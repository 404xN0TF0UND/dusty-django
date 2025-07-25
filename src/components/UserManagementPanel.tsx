import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User } from '../types';
import './UserManagementPanel.css';

interface UserManagementPanelProps {
  onClose: () => void;
  currentUser: User;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ onClose, currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/users/');
        setUsers(response.data);
      } catch (err) {
        setUsers([]);
      }
    };
    fetchUsers();
  }, []);

  const isLastAdmin = (userId: string) => {
    const admins = users.filter(u => u.role === 'admin');
    return admins.length === 1 && admins[0].id === userId;
  };

  const handleRoleChange = async (user: User, makeAdmin: boolean) => {
    if (isLastAdmin(user.id) && !makeAdmin) {
      setError('You cannot demote the last admin.');
      return;
    }
    try {
      // PATCH to /api/profiles/{id}/ to update role
      await axios.patch(`http://localhost:8000/api/profiles/${user.id}/`, { role: makeAdmin ? 'admin' : 'member' });
      setUsers(users.map(u => u.id === user.id ? { ...u, role: makeAdmin ? 'admin' : 'member' } : u));
    } catch (err) {
      setError('Failed to update user role.');
    }
  };

  return (
    <div className="user-mgmt-overlay">
      <div className="user-mgmt-modal">
        <h2>User Management</h2>
        {error && <div className="user-mgmt-error">{error}</div>}
        <table className="user-mgmt-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <img
                    src={'/logo192.png'}
                    alt={user.displayName}
                    className="user-mgmt-avatar"
                  />
                </td>
                <td>{user.display_name || user.displayName || user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  {user.role !== 'admin' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleRoleChange(user, true)}
                    >
                      Promote to Admin
                    </button>
                  )}
                  {user.role === 'admin' && !isLastAdmin(user.id) && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRoleChange(user, false)}
                    >
                      Demote to Member
                    </button>
                  )}
                  {user.role === 'admin' && isLastAdmin(user.id) && (
                    <span className="user-mgmt-badge">Last Admin</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: 24 }}>Close</button>
      </div>
    </div>
  );
}; 