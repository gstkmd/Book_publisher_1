import React, { useState } from 'react';
import { Shield, Plus, Trash2, CheckCircle2, XCircle, Info, Settings2 } from 'lucide-react';

interface RoleManagerProps {
    rolePermissions: Record<string, string[]>;
    onUpdate: (newPermissions: Record<string, string[]>) => void;
}

const AVAILABLE_MODULES = [
    { id: 'monitoring', label: 'Employee Monitoring' },
    { id: 'tasks', label: 'Task Management' },
    { id: 'workflow', label: 'Editorial Workflow' },
    { id: 'library', label: 'Content Library' },
    { id: 'standards', label: 'Curriculum Standards' },
    { id: 'lesson_plans', label: 'Lesson Planning' },
    { id: 'assessments', label: 'Assessments' },
    { id: 'rights', label: 'Rights & Integrity' }
];

const DEFAULT_ROLES = ['admin', 'editor_in_chief', 'section_editor', 'author', 'reviewer', 'illustrator', 'teacher'];

export function RoleManager({ rolePermissions, onUpdate }: RoleManagerProps) {
    const [newRoleName, setNewRoleName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Initialize with default roles if empty
    React.useEffect(() => {
        if (Object.keys(rolePermissions).length === 0) {
            const initial: Record<string, string[]> = {};
            DEFAULT_ROLES.forEach(role => {
                initial[role] = role === 'admin' ? AVAILABLE_MODULES.map(m => m.id) : ['tasks', 'library'];
            });
            onUpdate(initial);
        }
    }, []);

    const togglePermission = (role: string, moduleId: string) => {
        const current = rolePermissions[role] || [];
        const updated = current.includes(moduleId)
            ? current.filter(id => id !== moduleId)
            : [...current, moduleId];
        
        onUpdate({
            ...rolePermissions,
            [role]: updated
        });
    };

    const handleAddRole = () => {
        if (!newRoleName.trim()) return;
        const normalized = newRoleName.toLowerCase().replace(/\s+/g, '_');
        if (rolePermissions[normalized]) {
            alert('Role already exists');
            return;
        }
        onUpdate({
            ...rolePermissions,
            [normalized]: ['tasks'] // Default to basic access
        });
        setNewRoleName('');
        setIsAdding(false);
    };

    const handleDeleteRole = (role: string) => {
        if (role === 'admin') return;
        if (window.confirm(`Are you sure you want to delete the "${role}" role?`)) {
            const updated = { ...rolePermissions };
            delete updated[role];
            onUpdate(updated);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 overflow-hidden">
            <div className="p-6 border-b border-indigo-50 bg-gradient-to-r from-indigo-50/30 to-transparent flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="text-indigo-600 h-5 w-5" />
                        Role-Based Access Control
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Define custom user types and manage their module access levels.</p>
                </div>
                
                {!isAdding ? (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                    >
                        <Plus size={16} /> Create New Role
                    </button>
                ) : (
                    <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                        <input 
                            autoFocus
                            type="text"
                            value={newRoleName}
                            onChange={e => setNewRoleName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddRole()}
                            placeholder="Role Name (e.g. Guest)"
                            className="px-3 py-2 border-2 border-indigo-100 rounded-xl text-xs font-bold focus:border-indigo-400 outline-none"
                        />
                        <button onClick={handleAddRole} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                            <CheckCircle2 size={16} />
                        </button>
                        <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                            <XCircle size={16} />
                        </button>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-indigo-50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-indigo-50">User Role</th>
                            {AVAILABLE_MODULES.map(module => (
                                <th key={module.id} className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center min-w-[100px]">
                                    {module.label}
                                </th>
                            ))}
                            <th className="px-6 py-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-50/50">
                        {Object.entries(rolePermissions).map(([role, permissions]) => (
                            <tr key={role} className="group hover:bg-indigo-50/20 transition-colors">
                                <td className="px-6 py-4 border-r border-indigo-50/50">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-slate-700 capitalize tracking-tight">{role.replace(/_/g, ' ')}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{role === 'admin' ? 'Full System Access' : `${permissions.length} Modules`}</span>
                                    </div>
                                </td>
                                
                                {AVAILABLE_MODULES.map(module => (
                                    <td key={module.id} className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => role !== 'admin' && togglePermission(role, module.id)}
                                            disabled={role === 'admin'}
                                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                                permissions.includes(module.id)
                                                ? 'bg-indigo-100 text-indigo-600 shadow-sm border border-indigo-200'
                                                : 'bg-slate-50 text-slate-300 border border-slate-100 hover:border-slate-200'
                                            } ${role === 'admin' ? 'cursor-default opacity-80' : 'cursor-pointer active:scale-90'}`}
                                        >
                                            {permissions.includes(module.id) ? (
                                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                                            ) : (
                                                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                                            )}
                                        </button>
                                    </td>
                                ))}

                                <td className="px-4 py-4">
                                    {role !== 'admin' && (
                                        <button 
                                            onClick={() => handleDeleteRole(role)}
                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-indigo-50 flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                    <Info size={16} className="text-indigo-600" />
                </div>
                <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">How to assign roles?</h4>
                    <p className="text-[10px] font-medium text-slate-500 mt-1 max-w-2xl leading-relaxed">
                        Once defined here, these roles will become available in the <span className="text-indigo-600 font-extrabold italic">"Team Members"</span> section. When you assign a role to a user, the ModuleGuard system will automatically enforce these permission sets across the entire platform.
                    </p>
                </div>
            </div>
        </div>
    );
}
