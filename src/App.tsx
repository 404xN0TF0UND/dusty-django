import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChoreList } from './components/ChoreList';
import { ChoreForm } from './components/ChoreForm';
import { MobileNav } from './components/MobileNav';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DustyBubble } from './components/DustyBubble';
import { ThemeToggle } from './components/ThemeToggle';
import { ChoreFilters } from './components/ChoreFilters';
import { OfflineStatus } from './components/OfflineStatus';
import { VirtualizedChoreList } from './components/VirtualizedChoreList';
import { 
  LazyChoreStats, 
  LazyChoreTemplates, 
  LazyPerformanceDashboard, 
  LazyAchievementDisplay, 
  LazyDustyChat, 
  LazyNotificationSettingsPanel
} from './components/LazyComponents';
import { Chore, DustyMessage, User, ChoreFormData, ChoreFilters as ChoreFiltersType } from './types';
import './App.css';
import { PerformanceMonitoringService } from './services/performanceMonitoring';
import { PerformanceOptimizationService } from './services/performanceOptimization';
import { dustyPersonality } from './services/dustyPersonality';
import { AchievementService, Achievement } from './services/achievementService';
import { notificationService } from './services/notificationService';
import { LazyLoadingService } from './services/lazyLoadingService';
import { ServiceWorkerService } from './services/serviceWorkerService';
import { DatabaseOptimizationService } from './services/databaseOptimizationService';
import { UpdatePrompt } from './components/UpdatePrompt';
import './components/LazyComponents.css';
import './components/PerformanceDashboard.css';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import './components/PWAInstallPrompt.css';
import './components/Toast.css';
import { UserManagementPanel } from './components/UserManagementPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AchievementNotification } from './components/AchievementNotification';
import { AchievementDisplay } from './components/AchievementDisplay';

// Add missing helper and component definitions at the top after imports

// Fetch changelog.json
async function fetchChangelog() {
  const res = await fetch('/changelog.json');
  return await res.json();
}

// SignInForm component
const SignInForm: React.FC = () => {
  const { loading, signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Dusty's Chores</h1>
      <p>Your grumpy butler awaits...</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={submitting || loading}>
          {submitting ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

// WhatsNewModal component
const WhatsNewModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [changelog, setChangelog] = useState<any>(null);
  useEffect(() => {
    if (open) {
      fetchChangelog().then(setChangelog);
    }
  }, [open]);
  if (!open || !changelog) return null;
  const latest = changelog[0];
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>🚀 What’s New <span style={{ fontSize: '1rem', color: '#888' }}>v{latest.version}</span></h2>
        <div style={{ fontSize: '0.95rem', color: '#aaa', marginBottom: 8 }}>{latest.date}</div>
        <ul>
          {latest.changes.map((c: string, i: number) => <li key={i}>{c}</li>)}
        </ul>
        <button className="btn btn-primary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

// --- Main App Logic ---
const AppContent: React.FC = () => {
  const { currentUser, loading, signOutUser } = useAuth();
  const [chores, setChores] = useState<Chore[]>([]);
  const [dustyMessage, setDustyMessage] = useState<DustyMessage | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isFromTemplate, setIsFromTemplate] = useState(false);
  const [currentSection, setCurrentSection] = useState<'home' | 'add' | 'profile' | 'stats' | 'sms'>('home');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastSuggestionTime, setLastSuggestionTime] = useState<Date>(new Date());
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [choresLoading, setChoresLoading] = useState(true);
  const [filters, setFilters] = useState<ChoreFiltersType>({});
  const [selectedChoreIds, setSelectedChoreIds] = useState<string[]>([]);
  const [isPerformanceDashboardOpen, setIsPerformanceDashboardOpen] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [achievementNotification, setAchievementNotification] = useState<Achievement | null>(null);
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const installPromptEvent = useRef<Event | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showUserMgmt, setShowUserMgmt] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [newAchievement, setNewAchievement] = useState<any | null>(null);
  // const [avatarUploading, setAvatarUploading] = useState(false);
  // const [avatarError, setAvatarError] = useState<string | null>(null);

  // Show What's New modal on login (once per version)
  useEffect(() => {
    fetchChangelog().then((changelog) => {
      const latestVersion = changelog[0]?.version;
      const seen = localStorage.getItem('whatsnew-version');
      if (latestVersion && seen !== latestVersion) {
        setShowWhatsNew(true);
        localStorage.setItem('whatsnew-version', latestVersion);
      }
    });
  }, []);

  // On login, ensure user is in Firestore users collection
  useEffect(() => {
    if (!currentUser) return;
    // This block is no longer needed as user data is fetched from Django
    // const usersRef = fsCollection(db, 'users');
    // const userDoc = fsDoc(db, 'users', currentUser.id);
    // (async () => {
    //   // Check if user doc exists
    //   const userSnap = await getDoc(userDoc);
    //   if (!userSnap.exists()) {
    //     await setDoc(userDoc, {
    //       id: currentUser.id,
    //       displayName: currentUser.displayName,
    //       email: currentUser.email,
    //       role: 'member', // Default to member
    //       createdAt: fsServerTimestamp(),
    //       lastLoginAt: fsServerTimestamp(),
    //       avatarUrl: '/logo192.png' // Fallback to default avatar
    //     });
    //   }
    //   // Fetch all users
    //   const all = await getDocs(usersRef);
    //   setAllUsers(all.docs.map(doc => doc.data() as User));
    // })();
  }, [currentUser]);

  // Initialize performance monitoring and service worker
  useEffect(() => {
    PerformanceMonitoringService.init();
    
    // Initialize database optimization
    DatabaseOptimizationService.getInstance().init();
    
    // Register service worker
    ServiceWorkerService.getInstance().register().then(() => {
      // Set up update callback
      ServiceWorkerService.getInstance().onUpdateAvailable(() => {
        setIsUpdateAvailable(true);
      });
    });
    
    // Clean up expired cache periodically
    const cacheCleanupInterval = setInterval(() => {
      PerformanceOptimizationService.clearExpiredCache();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => {
      PerformanceMonitoringService.cleanup();
      clearInterval(cacheCleanupInterval);
    };
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Show toast helper
  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 3500);
  };

  // Fetch chores from Django API
  const fetchChores = useCallback(async () => {
    if (!currentUser) return;
    setChoresLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/chores/');
      // Map backend fields to frontend camelCase
      const mappedChores = response.data.map((chore: any) => ({
        ...chore,
        dueDate: chore.due_date,
        completedAt: chore.completed_at,
        createdAt: chore.created_at,
        updatedAt: chore.updated_at,
        isRecurring: chore.is_recurring,
        recurrencePattern: chore.recurrence_pattern,
        assigneeId: chore.assignee_id,
      }));
      setChores(mappedChores);
    } catch (err) {
      setChores([]);
    }
    setChoresLoading(false);
  }, [currentUser]);

  // Fetch all users from Django API
  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/users/');
      setAllUsers(response.data);
    } catch (err) {
      setAllUsers([]);
    }
  }, []);

  useEffect(() => {
    fetchChores();
    fetchUsers();
  }, [fetchChores, fetchUsers]);

  // Daily reminder system
  useEffect(() => {
    if (!currentUser) return;

    const checkDailyReminder = () => {
      const now = new Date();
      const lastReminder = localStorage.getItem('lastDailyReminder');
      
      if (lastReminder) {
        const lastDate = new Date(lastReminder);
        const daysSinceLastReminder = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastReminder >= 1) {
          notificationService.sendDailyReminderIfNeeded(chores);
          localStorage.setItem('lastDailyReminder', now.toISOString());
        }
      } else {
        // First time user, send reminder tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        localStorage.setItem('lastDailyReminder', tomorrow.toISOString());
      }
    };

    // Check for daily reminder every hour
    const reminderInterval = setInterval(checkDailyReminder, 60 * 60 * 1000);
    
    // Initial check
    checkDailyReminder();

    return () => clearInterval(reminderInterval);
  }, [currentUser, chores]);

  // Smart suggestion system
  useEffect(() => {
    if (!currentUser) return;

    const checkForSmartSuggestion = async () => {
      const now = new Date();
      const timeSinceLastSuggestion = now.getTime() - lastSuggestionTime.getTime();
      const minutesSinceLastSuggestion = timeSinceLastSuggestion / (1000 * 60);
      
      // Suggest every 30 minutes if user has uncompleted chores
      if (minutesSinceLastSuggestion >= 30) {
        const uncompletedChores = chores.filter(chore => 
          !chore.completedAt && 
          (chore.assigneeId === currentUser.id || chore.assigneeId === '')
        );
        
        if (uncompletedChores.length > 0) {
          const suggestion = await dustyPersonality.getContextualSuggestion(currentUser.id);
          setDustyMessage({
            text: suggestion,
            type: 'suggestion',
            timestamp: new Date()
          });
          setLastSuggestionTime(now);
        }
      }
    };

    // Check for suggestions every 5 minutes
    const suggestionInterval = setInterval(checkForSmartSuggestion, 5 * 60 * 1000);
    
    // Initial check after 5 minutes
    const initialCheck = setTimeout(checkForSmartSuggestion, 5 * 60 * 1000);

    return () => {
      clearInterval(suggestionInterval);
      clearTimeout(initialCheck);
    };
  }, [currentUser, chores, lastSuggestionTime]);

  // Initialize offline support
  useEffect(() => {
    if (currentUser) {
      // This block is no longer needed as OfflineSyncService is removed
      // (async () => {
      //   await OfflineSyncService.init();
      // })();
      
      // Register service worker message handler
      const handleServiceWorkerMessage = (event: MessageEvent) => {
        // OfflineSyncService.handleServiceWorkerMessage(event); // This line is no longer needed
      };
      
      navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
      
      return () => {
        navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, [currentUser]);

  // Listen for service worker notification actions
  useEffect(() => {
    const handleSWMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'COMPLETE_CHORE_FROM_NOTIFICATION' && event.data.choreId) {
        try {
          // This block is no longer needed as it relied on Firestore
          // const ref = doc(db, 'chores', event.data.choreId);
          // await updateDoc(ref, {
          //   completedAt: new Date(),
          //   updatedAt: new Date(),
          // });
          showToast('Chore marked as complete!', 'success');
        } catch (err) {
          showToast('Failed to complete chore.', 'error');
        }
      }
      if (event.data?.type === 'SNOOZE_CHORE_FROM_NOTIFICATION' && event.data.choreId) {
        try {
          // This block is no longer needed as it relied on Firestore
          // const snoozeDays = event.data.snoozeDays || 1;
          // const ref = doc(db, 'chores', event.data.choreId);
          // // Get current due date
          // const chore = chores.find(c => c.id === event.data.choreId);
          // let newDueDate = new Date();
          // if (chore && chore.dueDate) {
          //   newDueDate = new Date(chore.dueDate);
          //   newDueDate.setDate(newDueDate.getDate() + snoozeDays);
          // } else {
          //   newDueDate.setDate(newDueDate.getDate() + snoozeDays);
          // }
          // await updateDoc(ref, {
          //   dueDate: newDueDate,
          //   updatedAt: new Date(),
          // });
          showToast(`Chore snoozed for ${event.data.snoozeDays} day${event.data.snoozeDays > 1 ? 's' : ''}!`, 'info');
        } catch (err) {
          showToast('Failed to snooze chore.', 'error');
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, [chores]);

  // Load personality data
  useEffect(() => {
    const loadPersonality = async () => {
      await dustyPersonality.loadPersonality();
      if (currentUser) {
        const greeting = await dustyPersonality.getContextualGreeting(
          currentUser.id,
          currentUser.display_name || currentUser.displayName || currentUser.username || ''
        );
        setDustyMessage({
          text: greeting,
          type: 'greeting',
          timestamp: new Date()
        });
        
        // Initialize notifications and send welcome notification
        notificationService.init();
        await notificationService.sendWelcomeNotification(
          currentUser.display_name || currentUser.displayName || currentUser.username || ''
        );
      }
    };
    loadPersonality();
  }, [currentUser]);

  // Check for new achievements after chore completion
  useEffect(() => {
    if (!currentUser || chores.length === 0) return;

    const newAchievements = AchievementService.checkForNewAchievements(currentUser.id, chores);
    
    if (newAchievements.length > 0) {
      // Show achievement notification
      const achievement = newAchievements[0]; // Show first achievement
      setAchievementNotification(achievement);
    }
  }, [chores, currentUser]);

  // Listen for sync completion (when coming back online)
  useEffect(() => {
    if (!isOnline) return;
    // Check if there were pending actions and now synced
    const checkSync = async () => {
      // This block is no longer needed as OfflineSyncService is removed
      // const summary = await OfflineSyncService.getOfflineSummary();
      // if (summary.pendingChores === 0 && summary.lastSync && summary.lastSync > new Date(Date.now() - 60000)) {
      //   showToast('All changes synced!', 'success');
      // }
    };
    checkSync();
  }, [isOnline]);

  // Add or edit chore
  const handleFormSubmit = async (formData: ChoreFormData) => {
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        assignee_id: formData.assigneeId || null,
        due_date: formData.dueDate
          ? (typeof formData.dueDate === 'string'
              ? formData.dueDate + 'T20:00:00'
              : null)
          : null,
        is_recurring: formData.isRecurring,
        recurrence_pattern: formData.recurrencePattern,
        priority: formData.priority,
        category: formData.category,
        dependencies: formData.dependencies,
        blocks_others: formData.blocksOthers,
      };
      if (editingChore) {
        // Edit existing chore
        const response = await axios.patch(`http://localhost:8000/api/chores/${editingChore.id}/`, payload);
        // Optimistically update state
        setChores(prev => prev.map(c => c.id === editingChore.id ? { ...c, ...payload, id: editingChore.id } : c));
      } else {
        // Add new chore
        const response = await axios.post('http://localhost:8000/api/chores/', payload);
        // Optimistically update state
        setChores(prev => [...prev, response.data]);
      }
      fetchChores(); // Still sync with backend
    } catch (err) {
    }
    setIsFormOpen(false);
    setEditingChore(null);
  };

  // Helper to fetch achievements for the current user
  const fetchAchievements = useCallback(async () => {
    if (!currentUser) return [];
    try {
      const response = await axios.get(`http://localhost:8000/api/achievements/?user=${currentUser.id}`);
      return response.data;
    } catch {
      return [];
    }
  }, [currentUser]);

  // After completing a chore, check for new achievements
  const handleChoreComplete = useCallback(async (choreId: string) => {
    try {
      await axios.patch(`http://localhost:8000/api/chores/${choreId}/`, { completed_at: new Date().toISOString() });
      setChores(prev => prev.map(c => c.id === choreId ? { ...c, completedAt: new Date().toISOString() } : c));
      // Find the completed chore
      let completedChore = chores.find(c => c.id === choreId);
      // If recurring, create the next instance
      if (completedChore && completedChore.isRecurring && completedChore.recurrencePattern && completedChore.dueDate) {
        // Fetch the latest version from the backend to get the correct assignee
        try {
          const { data: updatedChore } = await axios.get(`http://localhost:8000/api/chores/${choreId}/`);
          completedChore = { ...completedChore, assigneeId: updatedChore.assignee_id };
        } catch (err) {
          // If fetch fails, fallback to local state
        }
        // Fix: ensure dueDate is a string before passing to new Date()
        const dueDateStr = completedChore.dueDate || '';
        let nextDueDate = dueDateStr ? new Date(dueDateStr) : new Date();
        switch (completedChore.recurrencePattern) {
          case 'daily':
            nextDueDate.setDate(nextDueDate.getDate() + 1);
            break;
          case 'weekly':
            nextDueDate.setDate(nextDueDate.getDate() + 7);
            break;
          case 'monthly':
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            break;
          default:
            break;
        }
        // Format as YYYY-MM-DD
        const nextDueDateStr = nextDueDate.toISOString().split('T')[0];
        // Create new chore instance
        const newChorePayload = {
          title: completedChore.title,
          description: completedChore.description,
          assignee_id: completedChore.assigneeId ? Number(completedChore.assigneeId) : null,
          due_date: nextDueDateStr + 'T20:00:00',
          is_recurring: true,
          recurrence_pattern: completedChore.recurrencePattern,
          priority: completedChore.priority,
          category: completedChore.category,
          dependencies: completedChore.dependencies,
          blocks_others: completedChore.blocksOthers,
        };
        try {
          const resp = await axios.post('http://localhost:8000/api/chores/', newChorePayload);
        } catch (err) {
        }
        fetchChores();
      } else {
        fetchChores();
      }
      // Fetch achievements and show notification for new ones
      const achievements = await fetchAchievements();
      const unlocked = achievements.filter((a: any) => a.completed && !a.notified);
      if (unlocked.length > 0) {
        setNewAchievement(unlocked[0]);
        // Optionally, mark as notified in backend (not shown here)
      }
    } catch (err) {
      // Handle error
    }
  }, [fetchChores, chores, fetchAchievements]);

  const handleChoreClaim = useCallback(async (choreId: string) => {
    if (!currentUser) return;
    try {
      // Update the backend
      await axios.patch(`http://localhost:8000/api/chores/${choreId}/`, {
        assignee_id: Number(currentUser.id)
      });
      // Optimistically update state
      setChores(prev => prev.map(c =>
        c.id === choreId
          ? { ...c, assigneeId: currentUser.id, assignee: currentUser }
          : c
      ));
      // Dusty response
      const claimResponse = await dustyPersonality.getChoreClaimResponse();
      setDustyMessage({
        text: claimResponse,
        type: 'chore_claim',
        timestamp: new Date()
      });
      // Notification
      const chore = chores.find(c => c.id === choreId);
      if (chore) {
        await notificationService.sendChoreAssignedNotification(
          chore.title,
          currentUser.display_name || currentUser.displayName || currentUser.username || ''
        );
      }
      fetchChores();
    } catch (err) {
      const errorResponse = await dustyPersonality.getErrorMessage();
      setDustyMessage({
        text: errorResponse,
        type: 'error',
        timestamp: new Date()
      });
    }
  }, [currentUser, chores, fetchChores]);

  const handleChoreEdit = (chore: Chore) => {
    setEditingChore(chore);
    setIsFormOpen(true);
  };

  // Delete a chore
  const handleChoreDelete = useCallback(async (choreId: string) => {
    try {
      await axios.delete(`http://localhost:8000/api/chores/${choreId}/`);
      // Optimistically update state
      setChores(prev => prev.filter(c => c.id !== choreId));
      fetchChores();
    } catch (err) {
      // Handle error
    }
  }, [fetchChores]);

  const handleAddChore = useCallback(() => {
    setIsFormOpen(true);
    setEditingChore(null);
    setIsFromTemplate(false);
  }, []);

  const handleTemplateSelect = (templateData: ChoreFormData) => {
    // Create a chore object from the template data
    const templateChore: Chore = {
      id: '', // Will be set by Firestore
      title: templateData.title,
      description: templateData.description || '',
      category: templateData.category,
      priority: templateData.priority,
      isRecurring: templateData.isRecurring,
      recurrencePattern: templateData.recurrencePattern,
      createdAt: new Date().toISOString(), // Use ISO string for Django
      updatedAt: new Date().toISOString(), // Use ISO string for Django
    };
    
    setEditingChore(templateChore);
    setIsFromTemplate(true);
    setIsFormOpen(true);
  };

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setEditingChore(null);
    setIsFromTemplate(false);
  }, []);

  // Bulk operations handlers
  const handleChoreSelect = (choreId: string, selected: boolean) => {
    if (selected) {
      setSelectedChoreIds(prev => [...prev, choreId]);
    } else {
      setSelectedChoreIds(prev => prev.filter(id => id !== choreId));
    }
  };

  const handleSectionChange = (section: 'home' | 'add' | 'profile' | 'stats' | 'sms') => {
    setCurrentSection(section);
    if (section === 'add') {
      handleAddChore();
    }
  };

  // Filter chores based on current filters - optimized with useMemo
  const filteredChores = useMemo(() => {
    if (!currentUser) return [];
    const now = new Date();
    return chores.filter(chore => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = chore.title.toLowerCase().includes(searchLower);
        const descriptionMatch = chore.description?.toLowerCase().includes(searchLower) || false;
        if (!titleMatch && !descriptionMatch) return false;
      }
      // Status filter
      if (filters.status) {
        const isCompleted = !!chore.completedAt;
        const isOverdue = chore.dueDate && !chore.completedAt && now > new Date(chore.dueDate);
        switch (filters.status) {
          case 'completed':
            if (!isCompleted) return false;
            break;
          case 'pending':
            if (isCompleted || isOverdue) return false;
            break;
          case 'overdue':
            if (!isOverdue) return false;
            break;
        }
      }
      // Priority filter
      if (filters.priority && chore.priority !== filters.priority) {
        return false;
      }
      // Category filter
      if (filters.category && chore.category !== filters.category) {
        return false;
      }
      // Assignee filter (new: allow filtering by specific user)
      if (filters.assignee && filters.assignee !== 'all') {
        if (filters.assignee === 'unassigned') {
          if (chore.assigneeId) return false;
        } else if (filters.assignee === 'assigned') {
          if (!chore.assigneeId) return false;
        } else {
          // Specific user UID
          if (chore.assigneeId !== filters.assignee) return false;
        }
      }
      return true;
    });
  }, [chores, filters, currentUser?.id, currentUser?.role]);

  // Get unique categories from chores
  const categories = Array.from(new Set(chores.map(chore => chore.category).filter(Boolean) as string[]));

  // PWA install prompt logic
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      installPromptEvent.current = e;
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    const event = installPromptEvent.current as any;
    if (event && event.prompt) {
      event.prompt();
      event.userChoice.then(() => {
        setShowInstallPrompt(false);
        installPromptEvent.current = null;
      });
    }
  };

  if (loading) {
    return <div className="app"><div className="login-container">Loading...</div></div>;
  }
  if (!currentUser) {
    return <SignInForm />;
  }

  return (
    <div className="app">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner">You are offline. Changes will sync when you’re back online.</div>
      )}
      <header className="app-header">
        <div className="header-content">
          <h1>Dusty's Chores</h1>
          <div className="user-info">
            <span>
              Welcome, {currentUser.display_name || currentUser.displayName || currentUser.username}
              {currentUser.role === 'admin' && <span className="admin-badge">Admin</span>}
            </span>
            <div className="header-actions" style={{ flexWrap: 'wrap' }}>
              {/* Trophy icon for achievements */}
              <button className="trophy-btn" title="View Achievements" onClick={() => setShowAchievementModal(true)}>
                🏆
              </button>
              <ThemeToggle />
              <button className="btn btn-secondary" onClick={signOutUser} style={{ marginLeft: 12 }}>
                SIGN OUT
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="app-main">
        <ErrorBoundary>
          {currentSection === 'home' && (
            <div className="main-content">
              <ChoreFilters
                filters={filters}
                onFiltersChange={setFilters}
                categories={categories}
                users={allUsers}
                loading={choresLoading}
              />
              
              {chores.length > 50 ? (
                <VirtualizedChoreList
                  chores={filteredChores}
                  currentUser={currentUser}
                  onComplete={handleChoreComplete}
                  onClaim={handleChoreClaim}
                  onEdit={handleChoreEdit}
                  onDelete={handleChoreDelete}
                  loading={choresLoading}
                  selectedChoreIds={selectedChoreIds}
                  onChoreSelect={handleChoreSelect}
                  itemHeight={120}
                  containerHeight={600}
                />
              ) : (
                <ChoreList
                  chores={filteredChores}
                  currentUser={currentUser}
                  onComplete={handleChoreComplete}
                  onClaim={handleChoreClaim}
                  onEdit={handleChoreEdit}
                  onDelete={handleChoreDelete}
                  loading={choresLoading}
                  selectedChoreIds={selectedChoreIds}
                  onChoreSelect={handleChoreSelect}
                />
              )}
            </div>
          )}
          {currentSection === 'stats' && (
            <LazyChoreStats
              chores={chores}
              currentUser={currentUser}
              loading={choresLoading}
            />
          )}
          
          {currentSection === 'profile' && (
            <div className="profile-section">
              <h2>Profile</h2>
              <div className="profile-content">
                <div className="user-info-card">
                  <img
                    src={'/logo192.png'}
                    alt={currentUser.displayName}
                    className="user-mgmt-avatar"
                    style={{ marginBottom: 12 }}
                  />
                  {/* <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-avatar-upload"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAvatarUploading(true);
                        setAvatarError(null);
                        try {
                          // const storage = getStorage();
                          // const avatarRef = storageRef(storage, `avatars/${currentUser.id}`);
                          // await uploadBytes(avatarRef, e.target.files[0]);
                          // const url = await getDownloadURL(avatarRef);
                          // const userRef = fsDoc(db, 'users', currentUser.id);
                          // await updateDoc(userRef, { avatarUrl: url });
                          // // Update local user state
                          // setAllUsers(users => users.map(u => u.id === currentUser.id ? { ...u, avatarUrl: url } : u));
                          // // Optionally, update currentUser if you have a setter
                        } catch (err) {
                          setAvatarError('Failed to upload avatar.');
                        } finally {
                          // setAvatarUploading(false);
                        }
                      }
                    }}
                  /> */}
                  {/* <label htmlFor="profile-avatar-upload" className="user-mgmt-avatar-btn">
                    {avatarUploading ? 'Uploading...' : 'Change Avatar'}
                  </label> */}
                  {/* {avatarError && <div className="user-mgmt-error">{avatarError}</div>} */}
                  <h3>User Information</h3>
                  <p><strong>Name:</strong> {currentUser.display_name || currentUser.displayName || currentUser.username}</p>
                  <p><strong>Email:</strong> {currentUser.email}</p>
                  <p><strong>Role:</strong> {currentUser.role}</p>
                  <button className="btn btn-secondary" onClick={() => setShowWhatsNew(true)}>
                    What’s New
                  </button>
                  
                  {/* Only show role toggle to admins */}
                  {currentUser.role === 'admin' && (
                    <div className="role-toggle">
                      <h4>Development Tools</h4>
                      <p className="dev-note">Toggle your role for testing purposes:</p>
                      <button 
                        className={`btn ${currentUser.role === 'admin' ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => {}} // Removed toggleRole
                      >
                        {currentUser.role === 'admin' ? 'Switch to Member' : 'Switch to Admin'}
                      </button>
                      <p className="dev-note">Note: This is for development testing only</p>
                    </div>
                  )}
                </div>
                
                <LazyNotificationSettingsPanel />
                
                {/* SMSSettings removed */}
                
                {currentUser.role === 'admin' && (
                  <div className="admin-tools">
                    <h3>Admin Tools</h3>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setIsPerformanceDashboardOpen(true)}
                      onMouseEnter={() => LazyLoadingService.preloadComponent('PerformanceDashboard')}
                      title="Performance Dashboard"
                    >
                      <span role="img" aria-label="Performance">📊</span> Performance Dashboard
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setIsAchievementOpen(true)}
                      onMouseEnter={() => LazyLoadingService.preloadComponent('AchievementDisplay')}
                    >
                      🏆 Achievements
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowUserMgmt(true)}
                      style={{ marginLeft: 8 }}
                    >
                      Manage Users
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </ErrorBoundary>
      </main>
      
      <MobileNav
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
        onAddChore={handleAddChore}
        onAchievementClick={() => setIsAchievementOpen(true)}
        onChatClick={() => setIsChatOpen(true)}
      />

      <ChoreForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={editingChore}
        users={allUsers}
        isFromTemplate={isFromTemplate}
        allChores={chores}
      />

      <LazyChoreTemplates
        open={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onTemplateSelect={handleTemplateSelect}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        type={confirmDialog.type}
      />

      {dustyMessage && (
        <DustyBubble 
          message={dustyMessage} 
          onAnimationComplete={() => setDustyMessage(null)}
        />
      )}

      {/* Offline Status Indicator */}
      <OfflineStatus />

      {/* Dusty Chat */}
      <LazyDustyChat
        currentUser={currentUser}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        chores={chores}
        onAddChore={handleAddChore}
        onCompleteChore={handleChoreComplete}
        onClaimChore={handleChoreClaim}
      />

      {/* Achievement Display */}
      {isAchievementOpen && (
        <LazyAchievementDisplay
          onClose={() => setIsAchievementOpen(false)}
          currentUser={currentUser}
          chores={chores}
        />
      )}

      {/* Achievement notification */}
      {achievementNotification && (
        <div className="achievement-notification">
          <div className="achievement-content">
            <span className="achievement-icon">🏆</span>
            <div className="achievement-text">
              <h4>Achievement Unlocked!</h4>
              <p>{achievementNotification.title}</p>
            </div>
            <button 
              className="close-btn"
              onClick={() => setAchievementNotification(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Performance Dashboard */}
      <LazyPerformanceDashboard
        isOpen={isPerformanceDashboardOpen}
        onClose={() => setIsPerformanceDashboardOpen(false)}
      />

      {/* Update Prompt */}
      <UpdatePrompt
        isVisible={isUpdateAvailable}
        onUpdate={() => setIsUpdateAvailable(false)}
        onDismiss={() => setIsUpdateAvailable(false)}
      />

      <PWAInstallPrompt
        visible={showInstallPrompt}
        onInstall={handleInstall}
        onDismiss={() => setShowInstallPrompt(false)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}

      <WhatsNewModal open={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
      {showUserMgmt && (
        <UserManagementPanel onClose={() => setShowUserMgmt(false)} currentUser={currentUser} />
      )}
      {/* Achievement Modal */}
      {showAchievementModal && (
        <AchievementDisplay
          currentUser={currentUser}
          chores={chores}
          onClose={() => setShowAchievementModal(false)}
        />
      )}
      {/* Achievement Toast Notification */}
      {newAchievement && (
        <AchievementNotification
          achievement={newAchievement}
          onClose={() => setNewAchievement(null)}
        />
      )}
    </div>
  );
};

// --- App Wrapper with Providers ---
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
