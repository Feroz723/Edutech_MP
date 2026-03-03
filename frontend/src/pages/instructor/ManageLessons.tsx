import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
    Plus,
    Video,
    Trash2,
    Loader2,
    Youtube,
    Clock,
    FileText,
    Link as LinkIcon,
    ChevronDown,
    ChevronUp,
    Bookmark,
    Shield
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface Resource {
    id: string;
    title: string;
    url: string;
    type: string;
}

interface Assignment {
    id: string;
    title: string;
    description: string;
    max_points: number;
}

interface Lesson {
    id: string;
    title: string;
    youtube_video_id: string;
    position: number;
    duration?: number;
    resources: Resource[];
    assignments: Assignment[];
}

export default function ManageLessons() {
    const { id: courseId } = useParams();
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [course, setCourse] = useState<any>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

    // Forms
    const [newLesson, setNewLesson] = useState({ title: "", youtube_video_id: "", duration: "" });
    const [newResource, setNewResource] = useState({ title: "", url: "", type: "link" });
    const [newAssignment, setNewAssignment] = useState({ title: "", description: "", max_points: "100" });

    const fetchData = useCallback(async () => {
        try {
            const [courseRes, lessonsRes] = await Promise.all([
                api.get(`/courses/${courseId}`),
                api.get(`/lessons/${courseId}`) // Corrected endpoint to match backend route /:courseId
            ]);
            setCourse(courseRes.data);
            setLessons(lessonsRes.data);
        } catch (error) {
            showToast("Failed to load curriculum modules", "error");
            navigate("/admin/courses");
        } finally {
            setLoading(false);
        }
    }, [courseId, navigate, showToast]);

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== "admin") {
            navigate("/");
            return;
        }

        fetchData();
    }, [user, authLoading, navigate, fetchData]);

    const handleAddLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLesson.title || !newLesson.youtube_video_id) {
            showToast("Module title and Video ID are mandatory", "error");
            return;
        }

        setSaving(true);
        try {
            const res = await api.post(`/lessons/${courseId}`, {
                title: newLesson.title,
                youtube_video_id: newLesson.youtube_video_id,
                position: lessons.length + 1,
                duration: newLesson.duration ? Number(newLesson.duration) : 10
            });

            setLessons([...lessons, { ...res.data, resources: [], assignments: [] }]);
            setNewLesson({ title: "", youtube_video_id: "", duration: "" });
            setShowAddForm(false);
            showToast("New module synchronized successfully!", "success");
        } catch (error: any) {
            showToast(error.response?.data?.message || "Module synchronization failed", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm("Are you sure you want to decommission this instructional module?")) return;

        try {
            await api.delete(`/lessons/${lessonId}`);
            setLessons(lessons.filter(l => l.id !== lessonId));
            showToast("Module decommissioned", "success");
        } catch (error) {
            showToast("Failed to remove module", "error");
        }
    };

    // Resource Actions
    const handleAddResource = async (lessonId: string) => {
        if (!newResource.title || !newResource.url) {
            showToast("Resource details are missing", "error");
            return;
        }
        try {
            const res = await api.post(`/lessons/resource/${lessonId}`, newResource);
            setLessons(lessons.map(l => l.id === lessonId ? { ...l, resources: [...l.resources, res.data] } : l));
            setNewResource({ title: "", url: "", type: "link" });
            showToast("Resource attached", "success");
        } catch (error) {
            showToast("Failed to attach resource", "error");
        }
    };

    const handleDeleteResource = async (lessonId: string, resourceId: string) => {
        try {
            await api.delete(`/lessons/resource/${resourceId}`);
            setLessons(lessons.map(l => l.id === lessonId ? { ...l, resources: l.resources.filter(r => r.id !== resourceId) } : l));
            showToast("Resource detached", "success");
        } catch (error) {
            showToast("Failed to detach resource", "error");
        }
    };

    // Assignment Actions
    const handleAddAssignment = async (lessonId: string) => {
        if (!newAssignment.title) {
            showToast("Assignment title is required", "error");
            return;
        }
        try {
            const res = await api.post(`/lessons/assignment/${lessonId}`, {
                ...newAssignment,
                max_points: Number(newAssignment.max_points)
            });
            setLessons(lessons.map(l => l.id === lessonId ? { ...l, assignments: [...l.assignments, res.data] } : l));
            setNewAssignment({ title: "", description: "", max_points: "100" });
            showToast("Assignment synchronized", "success");
        } catch (error) {
            showToast("Failed to synchronize assignment", "error");
        }
    };

    const handleDeleteAssignment = async (lessonId: string, assignmentId: string) => {
        try {
            await api.delete(`/lessons/assignment/${assignmentId}`);
            setLessons(lessons.map(l => l.id === lessonId ? { ...l, assignments: l.assignments.filter(a => a.id !== assignmentId) } : l));
            showToast("Assignment decommissioned", "success");
        } catch (error) {
            showToast("Failed to remove assignment", "error");
        }
    };

    const handlePublish = async () => {
        if (!confirm("Are you ready to synchronize this curriculum with the global marketplace?")) return;
        setSaving(true);
        try {
            await api.put(`/courses/${courseId}/publish`);
            setCourse({ ...course, is_published: true });
            showToast("Curriculum synchronized and published!", "success");
        } catch (error) {
            console.error("Publish error:", error);
            showToast("Publication synchronization failed", "error");
        } finally {
            setSaving(false);
        }
    };

    const extractYouTubeId = (url: string): string => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /^([a-zA-Z0-9_-]{11})$/
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return url;
    };

    if (loading || authLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-lg"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950 font-display transition-colors">
            <Sidebar />

            <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-8 md:p-12">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-10">
                        <Link to="/admin/courses" className="inline-flex items-center gap-2 text-slate-400 hover:text-primary mb-6 font-bold text-xs uppercase tracking-widest transition-all group">
                            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                            Back to Curriculum Governance
                        </Link>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-none flex items-center gap-4">
                                    Instructional Modules
                                    {course?.is_published ? (
                                        <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-200 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <Shield size={10} /> Published
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <FileText size={10} /> Draft Mode
                                        </span>
                                    )}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-3 font-medium text-lg italic">
                                    Managing curriculum for: <span className="text-primary font-bold not-italic">"{course?.title}"</span>
                                </p>
                            </div>
                            <button onClick={() => setShowAddForm(true)} className="flex-shrink-0 flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all transform hover:-translate-y-1">
                                <Plus size={20} /> SYNC NEW MODULE
                            </button>
                        </div>
                    </div>

                    {/* Add Lesson Form */}
                    {showAddForm && (
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 mb-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Initialize Instructional Module</h3>
                            <form onSubmit={handleAddLesson} className="space-y-6">
                                <div className="space-y-3">
                                    <label htmlFor="module_title" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Module Title *</label>
                                    <input
                                        id="module_title"
                                        type="text"
                                        value={newLesson.title}
                                        onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                                        placeholder="Tactical Frameworks in UX"
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold tracking-tight text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-400"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label htmlFor="youtube_id" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">YouTube Video ID / URL *</label>
                                        <div className="relative group">
                                            <Youtube className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all" size={18} />
                                            <input
                                                id="youtube_id"
                                                type="text"
                                                value={newLesson.youtube_video_id}
                                                onChange={(e) => setNewLesson({ ...newLesson, youtube_video_id: extractYouTubeId(e.target.value) })}
                                                placeholder="Paste URL or ID"
                                                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold tracking-tight text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-400"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="duration" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Expected Duration (Min)</label>
                                        <div className="relative group">
                                            <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all" size={18} />
                                            <input
                                                id="duration"
                                                type="number"
                                                value={newLesson.duration}
                                                onChange={(e) => setNewLesson({ ...newLesson, duration: e.target.value })}
                                                placeholder="15"
                                                min="1"
                                                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold tracking-tight text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 pt-6">
                                    <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50">
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} SYNC MODULE
                                    </button>
                                    <button type="button" onClick={() => setShowAddForm(false)} className="px-10 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">CANCEL</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Lessons Roadmap */}
                    {lessons.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-24 text-center shadow-sm">
                            <div className="size-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-300 dark:text-slate-700">
                                <Video size={48} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">Curriculum Void Detected</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-12 max-w-xs mx-auto font-medium italic">Initialize your first instructional module to begin deployment to the institutional framework.</p>
                            <button onClick={() => setShowAddForm(true)} className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all">
                                <Plus size={18} /> SYNC FIRST MODULE
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {lessons.map((lesson, index) => (
                                <div key={lesson.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-xl hover:border-primary/20">
                                    <div className="p-8 flex items-center gap-8">
                                        <div className="size-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-sm border border-primary/20 shrink-0">
                                            {String(index + 1).padStart(2, '0')}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-slate-900 dark:text-slate-100 text-xl tracking-tight truncate">{lesson.title}</h4>
                                            <div className="flex items-center gap-6 mt-2">
                                                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500">
                                                    <Youtube size={14} /> {lesson.youtube_video_id}
                                                </span>
                                                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                                                    <Clock size={14} /> {lesson.duration || 10} MINS
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)} className={`size-12 rounded-2xl flex items-center justify-center transition-all ${expandedLesson === lesson.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'}`}>
                                                {expandedLesson === lesson.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                            <button onClick={() => handleDeleteLesson(lesson.id)} className="size-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Content: Resources & Assignments */}
                                    {expandedLesson === lesson.id && (
                                        <div className="px-8 pb-10 pt-4 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 animate-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                                {/* Resources Manager */}
                                                <div className="space-y-6">
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
                                                        <LinkIcon size={14} className="text-primary" /> Learning Resources
                                                    </h5>
                                                    <div className="space-y-3">
                                                        {lesson.resources?.map(res => (
                                                            <div key={res.id} className="group bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-all hover:border-primary/30">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="size-8 bg-slate-50 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                                                        <FileText size={16} />
                                                                    </div>
                                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{res.title}</span>
                                                                </div>
                                                                <button onClick={() => handleDeleteResource(lesson.id, res.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-all">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-4">
                                                            <input aria-label="Resource Title" type="text" value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} placeholder="Resource Title" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400" />
                                                            <div className="flex gap-2">
                                                                <input aria-label="Resource URL" type="text" value={newResource.url} onChange={(e) => setNewResource({ ...newResource, url: e.target.value })} placeholder="URL (PDF, Doc, Link)" className="flex-1 bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400" />
                                                                <button onClick={() => handleAddResource(lesson.id)} className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 flex items-center justify-center"><Plus size={18} /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Assignments Manager */}
                                                <div className="space-y-6">
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
                                                        <Bookmark size={14} className="text-amber-500" /> Module Assignments
                                                    </h5>
                                                    <div className="space-y-3">
                                                        {lesson.assignments?.map(asgn => (
                                                            <div key={asgn.id} className="group bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-all hover:border-amber-500/30">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="size-8 bg-amber-50 dark:bg-amber-900/10 rounded-lg flex items-center justify-center text-amber-500 shrink-0">
                                                                        <Bookmark size={16} />
                                                                    </div>
                                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{asgn.title}</span>
                                                                </div>
                                                                <button onClick={() => handleDeleteAssignment(lesson.id, asgn.id)} className="opacity-0 group-hover:opacity-100 text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-all">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-4">
                                                            <input aria-label="Assignment Title" type="text" value={newAssignment.title} onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} placeholder="Assignment Title" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-400" />
                                                            <div className="flex gap-2">
                                                                <textarea aria-label="Assignment Description" value={newAssignment.description} onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })} placeholder="Instructions for students..." className="flex-1 bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 px-4 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/10 transition-all resize-none h-[42px] placeholder:text-slate-400" />
                                                                <button onClick={() => handleAddAssignment(lesson.id)} className="bg-amber-500 text-white p-3 rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center"><Plus size={18} /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Operational Safety Manual */}
                    <div className="mt-16 bg-slate-900 rounded-[3rem] p-12 text-white overflow-hidden relative border border-slate-800">
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="size-24 bg-amber-500 text-slate-950 rounded-[2rem] flex items-center justify-center shrink-0 border-4 border-slate-800 shadow-2xl">
                                <Shield size={40} />
                            </div>
                            <div className="text-center md:text-left">
                                <h4 className="text-2xl font-black mb-3 tracking-tight">Instructional Protocol Safety</h4>
                                <p className="text-slate-400 text-lg leading-relaxed max-w-2xl font-medium italic">
                                    Admins must utilize <span className="text-white font-bold not-italic underline decoration-amber-500 underline-offset-4">Unlisted YouTube Protocols</span> for module security. This prevents external indexing while maintaining high-fidelity delivery via the institutional EduStream framework.
                                </p>
                                <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                                    <button className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Security Guide</button>
                                    <button className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Optimization Manual</button>
                                </div>
                            </div>
                        </div>
                        <span className="material-symbols-outlined absolute -bottom-16 -right-16 text-[20rem] text-white/5 pointer-events-none select-none">shield</span>
                    </div>

                    {/* Publish Footer */}
                    {!course?.is_published && lessons.length > 0 && (
                        <div className="mt-12 flex justify-center">
                            <button
                                onClick={handlePublish}
                                disabled={saving}
                                className="group relative flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-primary to-blue-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {saving ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">rocket_launch</span>
                                )}
                                PUBLISH CURRICULUM TO MARKETPLACE
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
