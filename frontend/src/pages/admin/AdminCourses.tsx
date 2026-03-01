import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import AdminLayout from "@/components/AdminLayout";

interface Course {
    id: string;
    title: string;
    description: string;
    price: number;
    status: string; // approved, pending, rejected
    is_published: boolean;
    instructor_name?: string;
    student_count?: number;
    created_at: string;
}

export default function AdminCourses() {
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchCourses = useCallback(async () => {
        try {
            const res = await api.get("/admin/courses");
            setCourses(res.data);
        } catch (error) {
            showToast("Failed to load curriculum records", "error");
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
        fetchCourses();
    }, [user, authLoading, navigate, fetchCourses]);

    const handleApprove = async (courseId: string) => {
        try {
            await api.put(`/admin/courses/${courseId}/approve`);
            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: "approved" } : c));
            showToast("Course protocol approved!", "success");
        } catch (error) {
            showToast("Governance update failed", "error");
        }
    };

    const handlePublishToggle = async (courseId: string, currentStatus: boolean) => {
        try {
            if (currentStatus) {
                // In a real app, you'd have an unpublish endpoint
                showToast("Course transitioned to draft mode", "info");
            } else {
                await api.put(`/courses/${courseId}/publish`);
                showToast("Module live in marketplace!", "success");
            }
            fetchCourses();
        } catch (error) {
            showToast("Marketplace sync failed", "error");
        }
    };

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
            title="Course Management"
            subtitle="Review, deploy, and maintain institutional learning frameworks"
        >
            <div className="space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                            <span className="material-symbols-outlined text-sm">history_edu</span>
                            Curriculum Governance
                        </div>
                        <h1 className="text-4xl font-black tracking-tight mb-2 text-slate-900 dark:text-white leading-none">Course Management</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Review, deploy, and maintain institutional learning frameworks.</p>
                    </div>
                    <button
                        onClick={() => navigate("/admin/courses/create")}
                        className="flex items-center gap-2 px-6 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all transform hover:-translate-y-1"
                    >
                        <span className="material-symbols-outlined font-bold">add</span>
                        DEPLOY NEW COURSE
                    </button>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                        <input
                            type="text"
                            placeholder="Search courses, instructors, or curriculum IDs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all text-slate-900 dark:text-white"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all">
                        <span className="material-symbols-outlined">filter_alt</span>
                        Filter Settings
                    </button>
                </div>

                {/* Content Table */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mastery Course</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Creation Entity</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Governance Status</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Deploy Status</th>
                                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredCourses.map((course) => (
                                    <tr key={course.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center text-primary border border-primary/20">
                                                    <span className="material-symbols-outlined">book_4</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/admin/courses/${course.id}/edit`)}>
                                                        {course.title}
                                                    </p>
                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">ID: {course.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{course.instructor_name || "Platform Admin"}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Verified Authority</p>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border ${course.status === "approved"
                                                ? "bg-emerald-100/50 text-emerald-700 border-emerald-200"
                                                : "bg-amber-100/50 text-amber-700 border-amber-200"
                                                }`}>
                                                {course.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${course.is_published ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></div>
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    {course.is_published ? "Live Marketplace" : "Internal Draft"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                                                    className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                                    title="Edit Curriculum"
                                                >
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/admin/courses/${course.id}/lessons`)}
                                                    className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                                    title="Manage Lessons"
                                                >
                                                    <span className="material-symbols-outlined text-sm">list</span>
                                                </button>
                                                {course.status !== "approved" && (
                                                    <button
                                                        onClick={() => handleApprove(course.id)}
                                                        className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                        title="Authorize Course"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handlePublishToggle(course.id, course.is_published)}
                                                    className={`p-2.5 rounded-xl transition-all shadow-sm ${course.is_published
                                                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500"
                                                        : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500"
                                                        } hover:text-white`}
                                                    title={course.is_published ? "Draft Mode" : "Publish Live"}
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        {course.is_published ? "visibility_off" : "visibility"}
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredCourses.length === 0 && (
                        <div className="p-20 text-center">
                            <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 block">inventory_2</span>
                            <h3 className="text-xl font-bold text-slate-400">No matching curriculums found.</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mt-2">Try adjusting your search filters or deploy a new framework.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="px-8 py-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-sm font-medium text-slate-500">
                            Records <span className="text-slate-900 dark:text-white font-bold">1</span> to <span className="text-slate-900 dark:text-white font-bold">{filteredCourses.length}</span> of <span className="text-slate-900 dark:text-white font-bold">{courses.length}</span> deployed
                        </p>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button className="size-10 bg-primary text-white font-bold rounded-full shadow-lg shadow-primary/20">1</button>
                            <button className="size-10 text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white transition-colors">2</button>
                            <span className="text-slate-300 dark:text-slate-700 px-2 font-black">...</span>
                            <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
