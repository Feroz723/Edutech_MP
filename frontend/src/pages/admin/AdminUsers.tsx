import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import AdminLayout from "@/components/AdminLayout";
import { Trash2, Edit3, UserPlus, X, User as UserIcon, Lock, Search } from "lucide-react";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    is_suspended: boolean;
    created_at: string;
    last_login?: string;
    enrolled_courses?: string[];
}

export default function AdminUsers() {
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // UI States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "student" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await api.get("/admin/users");
            // In a real app, these would come from the relational DB
            const enrichedData = res.data.map((u: any) => ({
                ...u,
                last_login: u.last_login || new Date(u.created_at).toLocaleDateString() + " " + new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                enrolled_courses: u.enrolled_courses || ["Standard Foundation"]
            }));
            setUsers(enrichedData);
        } catch (error) {
            showToast("Failed to load users", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== "admin") {
            navigate("/");
            return;
        }
        fetchUsers();
    }, [user, authLoading, navigate, fetchUsers]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post("/admin/users", formData);
            showToast("User created successfully", "success");
            setIsCreateModalOpen(false);
            setFormData({ name: "", email: "", password: "", role: "student" });
            fetchUsers();
        } catch (error: any) {
            showToast(error.response?.data?.message || "Failed to create user", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            await api.put(`/admin/users/${selectedUser.id}/role`, { role: formData.role });
            showToast("User updated successfully", "success");
            setIsEditModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            showToast("Failed to update user", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (!window.confirm(`Are you absolutely sure you want to delete ${name}? This action cannot be undone.`)) return;
        try {
            await api.delete(`/admin/users/${id}`);
            showToast("User deleted successfully", "success");
            setUsers(users.filter(u => u.id !== id));
        } catch (error: any) {
            showToast(error.response?.data?.message || "Failed to delete user", "error");
        }
    };

    const handleToggleSuspension = async (userId: string) => {
        try {
            await api.put(`/admin/users/${userId}/suspend`);
            setUsers(users.map(u => u.id === userId ? { ...u, is_suspended: !u.is_suspended } : u));
            showToast("User status updated", "success");
        } catch (error) {
            showToast("Failed to update status", "error");
        }
    };

    const openEditModal = (u: User) => {
        setSelectedUser(u);
        setFormData({ name: u.name, email: u.email, password: "", role: u.role });
        setIsEditModalOpen(true);
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading || authLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <AdminLayout
            title="Student Management"
            subtitle="Monitor institutional enrollment and user permissions"
        >
            <div className="space-y-10">
                {/* Header Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm">
                            <span className="material-symbols-outlined text-sm">shield_person</span>
                            Governance Control
                        </div>
                        <h1 className="text-4xl font-black tracking-tight mb-2 text-slate-900 dark:text-white leading-none">Institutional Records</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Manage platform identities, roles, and security status.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setFormData({ name: "", email: "", password: "", role: "admin" });
                                setIsCreateModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
                        >
                            <UserPlus className="w-5 h-5" />
                            ADD ADMIN
                        </button>
                        <button
                            onClick={() => {
                                setFormData({ name: "", email: "", password: "", role: "student" });
                                setIsCreateModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-6 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all transform hover:-translate-y-1"
                        >
                            <UserPlus className="w-5 h-5 font-bold" />
                            ADD STUDENT
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or institutional ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all text-slate-900 dark:text-white"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all">
                        <span className="material-symbols-outlined">filter_list</span>
                        Filter
                    </button>
                </div>

                {/* Table Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        <input type="checkbox" className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-primary focus:ring-0 w-4 h-4 cursor-pointer" />
                                    </th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identity</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Institutional Email</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Enrollments</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Latest Activity</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-6">
                                            <input type="checkbox" className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-primary focus:ring-0 w-4 h-4 cursor-pointer" />
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${u.name}&background=random&color=fff`}
                                                        alt={u.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white leading-none mb-1">{u.name}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70">{u.role}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-sm text-slate-500 dark:text-slate-400">{u.email}</td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-wrap gap-2">
                                                {u.enrolled_courses?.slice(0, 2).map((course, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                                                        {course}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-xs font-bold text-slate-400">{u.last_login}</td>
                                        <td className="px-6 py-6">
                                            <span className={`px-3 py-1.5 ${u.is_suspended ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 border-rose-200" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 border-emerald-200"} text-[10px] font-black uppercase rounded-full border`}>
                                                {u.is_suspended ? "Suspended" : "Active"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleSuspension(u.id)}
                                                    className={`p-2 rounded-xl transition-all ${u.is_suspended ? "text-emerald-500 hover:bg-emerald-50" : "text-amber-500 hover:bg-amber-50"}`}
                                                    title={u.is_suspended ? "Unsuspend" : "Suspend"}
                                                >
                                                    <span className="material-symbols-outlined text-lg">{u.is_suspended ? "check_circle" : "block"}</span>
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(u)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                                    title="Edit User"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-8 py-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-sm font-medium text-slate-500 italic">
                            Totaling <span className="text-slate-900 dark:text-white font-black">{filteredUsers.length}</span> institutional records identified.
                        </p>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-xl">keyboard_double_arrow_left</span>
                            </button>
                            <button className="size-10 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20">1</button>
                            <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-xl">keyboard_double_arrow_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {
                isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                        {formData.role === "admin" ? "Register Institutional Admin" : "Add New Institutional Member"}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Credentials Protocol</p>
                                </div>
                                <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateUser} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Identity Name</span>
                                        <div className="relative mt-1">
                                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder="Ex: Alexander Pierce"
                                            />
                                        </div>
                                    </label>
                                    <label className="block">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Coordinates</span>
                                        <div className="relative mt-1">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder="user@edustream.io"
                                            />
                                        </div>
                                    </label>
                                    <label className="block">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Credentials</span>
                                        <div className="relative mt-1">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                placeholder="Leave blank for institutional default"
                                            />
                                        </div>
                                    </label>
                                    <label className="block">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Institutional Position</span>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full mt-1 px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        >
                                            <option value="student">Student</option>
                                            <option value="admin">Institutional Administrator</option>
                                        </select>
                                    </label>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-[10px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={isSubmitting}
                                        className="flex-[2] py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all text-[10px] flex items-center justify-center"
                                    >
                                        {isSubmitting ? <span className="material-symbols-outlined animate-spin">sync</span> : "Authorize & Create"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit Modal */}
            {
                isEditModalOpen && selectedUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Modify Permissions</h3>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
                                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                    <div className="w-12 h-12 rounded-full overflow-hidden">
                                        <img src={`https://ui-avatars.com/api/?name=${selectedUser.name}&background=random&color=fff`} alt="" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">{selectedUser.name}</p>
                                        <p className="text-xs text-slate-500">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Institutional Position</span>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full mt-1 px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 font-display"
                                        >
                                            <option value="student">Student</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                    </label>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all text-[10px] flex items-center justify-center font-display"
                                    >
                                        {isSubmitting ? <span className="material-symbols-outlined animate-spin">sync</span> : "Update Credentials"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </AdminLayout>
    );
}
