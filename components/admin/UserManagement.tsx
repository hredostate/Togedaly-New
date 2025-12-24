
import React, { useEffect, useState } from 'react';
import { getUsers, updateUserRole } from '../../services/adminService';
import type { AdminUser, UserRole } from '../../types';
import { useToasts } from '../ToastHost';
import { roleClass } from '../roles';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole>('member');
    const [q, setQ] = useState('');
    const { add: addToast } = useToasts();

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (e: any) {
            addToast({ title: 'Error', desc: 'Could not load users.', emoji: '😥' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleEdit = (user: AdminUser) => {
        setEditingUser(user);
        setSelectedRole(user.role);
    };

    const handleSave = async () => {
        if (!editingUser) return;
        try {
            await updateUserRole(editingUser.id, selectedRole, 'mock-admin-id');
            addToast({ title: 'Success', desc: 'User role updated.', emoji: '✅' });
            setEditingUser(null);
            loadUsers();
        } catch (e: any) {
            addToast({ title: 'Error', desc: e.message, emoji: '😥' });
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(q.toLowerCase()) || 
        u.email.toLowerCase().includes(q.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">User Management</h3>
                <input 
                    value={q} 
                    onChange={e => setQ(e.target.value)} 
                    placeholder="Search users..." 
                    className="border rounded-xl px-3 py-2 text-sm w-64 bg-white text-gray-900 focus:ring-2 focus:ring-brand focus:border-transparent"
                    style={{ backgroundColor: '#ffffff', color: '#111827' }}
                />
            </div>

            <div className="rounded-2xl border bg-white overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-3 text-left">User</th>
                            <th className="p-3 text-left">Role</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Joined</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan={5} className="p-6 text-center">Loading users...</td></tr>}
                        {!loading && filteredUsers.map(user => (
                            <tr key={user.id} className="border-b">
                                <td className="p-3">
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-xs uppercase font-semibold ${roleClass(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-3 capitalize">{user.status}</td>
                                <td className="p-3 text-xs text-gray-500">{new Date(user.joined_at).toLocaleDateString()}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => handleEdit(user)} className="px-3 py-1.5 text-xs rounded-lg border hover:bg-slate-100">
                                        Edit Role
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingUser && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setEditingUser(null)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-semibold text-lg mb-4">Edit Role: {editingUser.name}</h3>
                        <div className="space-y-3">
                            {(['member', 'manager', 'support', 'admin'] as const).map(role => (
                                <label key={role} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:bg-slate-50">
                                    <input 
                                        type="radio" 
                                        name="role" 
                                        checked={selectedRole === role} 
                                        onChange={() => setSelectedRole(role)}
                                        className="text-brand focus:ring-brand"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium capitalize">{role}</div>
                                        <div className="text-xs text-gray-500">
                                            {role === 'admin' ? 'Full access' : role === 'support' ? 'View tickets & basic actions' : role === 'manager' ? 'Manage pools & members' : 'Regular user access'}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-xl border text-sm">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;