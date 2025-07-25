export interface User {
  id: string;
  email: string;
  displayName?: string; // legacy/camelCase
  display_name?: string; // snake_case from Django
  username?: string;     // from Django User
  role: 'admin' | 'member';
  current_streak?: number;
  longest_streak?: number;
  // avatarUrl?: string;
}

export interface Chore {
  id: string;
  title: string;
  description?: string;
  assigneeId?: string;
  assignee?: User; // <-- Add this line for backend compatibility
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dependencies?: string[]; // Array of chore IDs that must be completed first
  blocksOthers?: boolean; // Whether this chore blocks other chores
}

export interface ChoreFormData {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string; // Store as string (YYYY-MM-DD)
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  dependencies?: string[];
  blocksOthers?: boolean;
}

export interface ChoreFilters {
  status?: 'all' | 'pending' | 'completed' | 'overdue';
  assignee?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  search?: string;
}

export interface DustyMessage {
  text: string;
  type: 'greeting' | 'chore_add' | 'chore_complete' | 'chore_claim' | 'chore_delete' | 'chore_edit' | 'no_chores' | 'overdue_chores' | 'all_completed' | 'error' | 'loading' | 'suggestion';
  timestamp: Date;
} 