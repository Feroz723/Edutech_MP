import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import SecureVideoPlayer from "@/components/SecureVideoPlayer";
import {
    Play,
    Check,
    ChevronLeft,
    ChevronRight,
    Search,
    Bell,
    Settings,
    FileText,
    MessageSquare,
    ChevronUp,
    PlayCircle,
} from "lucide-react";

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

interface CourseProgress {
    completed_lessons: string[];
    current_lesson: string;
}

export default function CourseLearn() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [course, setCourse] = useState<any>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [progress, setProgress] = useState<CourseProgress | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    const fetchData = useCallback(async () => {
        try {
            const [courseRes, lessonsRes, progressRes] = await Promise.all([
                api.get(`/public/courses/${id}`),
                api.get(`/lessons/${id}`),
                api.get(`/progress/${id}`)
            ]);

            setCourse(courseRes.data);
            setLessons(lessonsRes.data);
            setProgress(progressRes.data);

            if (lessonsRes.data.length > 0) {
                const current = lessonsRes.data.find(
                    (l: Lesson) => l.id === progressRes.data.current_lesson
                ) || lessonsRes.data[0];
                setCurrentLesson(current);
            }
        } catch (error) {
            console.error("Failed to fetch course data", error);
            showToast("Curriculum synchronization failed", "error");
        } finally {
            setLoading(false);
        }
    }, [id, showToast]);

    useEffect(() => {
        // Auth is now handled by the global ProtectedRoute wrapper and App.tsx
        fetchData();

        // Global Security Protocol
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            showToast("Security Protocol: Action Restricted", "error");
            return false;
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
            const isInspect = (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'i' || e.key === 'j' || e.key === 'c'));
            const isViewSource = (e.ctrlKey && (e.key === 'U' || e.key === 'u'));
            const isDevTools = e.key === 'F12';

            if (isInspect || isViewSource || isDevTools) {
                e.preventDefault();
                showToast("Vault Protocol: Inspection Forbidden", "error");
                return false;
            }
        };

        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [user, navigate, fetchData, showToast]);

    const handleNextLesson = async () => {
        if (!currentLesson) return;
        const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
        if (currentIndex < lessons.length - 1) {
            const nextLesson = lessons[currentIndex + 1];
            setCurrentLesson(nextLesson);

            // Background master verification
            try {
                await api.post(`/progress/complete/${currentLesson.id}`);
                const progressRes = await api.get(`/progress/${id}`);
                setProgress(progressRes.data);
            } catch (error) {
                console.error("Progress persistence sync failed", error);
            }
        } else {
            showToast("Curriculum Completed", "success");
        }
    };

    const handlePreviousLesson = () => {
        if (!currentLesson) return;
        const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
        if (currentIndex > 0) {
            setCurrentLesson(lessons[currentIndex - 1]);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center font-display">
                <div className="relative">
                    <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!course) return null;

    const completedCount = progress?.completed_lessons?.length || 0;
    const progressPercent = Math.round((completedCount / (lessons.length || 1)) * 100);

    return (
        <div className="bg-slate-50 text-slate-900 antialiased min-h-screen font-display flex flex-col">
            {/* Top Navigation Bar */}
            <header className="flex items-center justify-between border-b border-solid border-slate-200 bg-white px-6 py-3 sticky top-0 z-50 h-20">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-4 text-primary">
                        <div className="size-10 flex items-center justify-center bg-primary/10 rounded-xl">
                            <span className="material-symbols-outlined text-2xl">school</span>
                        </div>
                        <h2 className="text-slate-900 text-xl font-black leading-tight tracking-[-0.015em]">EduStream Pro</h2>
                    </Link>
                    <label className="hidden md:flex flex-col min-w-48 h-12 max-w-72">
                        <div className="flex w-full flex-1 items-stretch rounded-2xl h-full overflow-hidden border border-slate-100 bg-slate-50 group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                            <div className="text-slate-400 flex items-center justify-center pl-4 group-focus-within:text-primary transition-colors">
                                <Search size={20} />
                            </div>
                            <input
                                className="flex w-full min-w-0 flex-1 border-none bg-transparent text-slate-900 focus:ring-0 h-full placeholder:text-slate-400 px-4 text-sm font-medium"
                                placeholder="Search repository..."
                            />
                        </div>
                    </label>
                </div>

                <div className="flex flex-1 justify-end gap-6 items-center">
                    <nav className="hidden lg:flex items-center gap-8 mr-4">
                        <Link className="text-slate-500 text-sm font-bold hover:text-primary transition-colors uppercase tracking-widest" to="/my-courses">My Learning</Link>
                        <Link className="text-slate-500 text-sm font-bold hover:text-primary transition-colors uppercase tracking-widest" to="/courses">Explore</Link>
                        <Link className="text-slate-500 text-sm font-bold hover:text-primary transition-colors uppercase tracking-widest" to="#">Resources</Link>
                    </nav>
                    <div className="flex gap-2">
                        <button className="flex items-center justify-center rounded-xl h-11 w-11 bg-slate-50 text-slate-500 hover:bg-primary/10 hover:text-primary transition-all border border-slate-100">
                            <Bell size={20} />
                        </button>
                        <button className="flex items-center justify-center rounded-xl h-11 w-11 bg-slate-50 text-slate-500 hover:bg-primary/10 hover:text-primary transition-all border border-slate-100">
                            <Settings size={20} />
                        </button>
                    </div>
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-11 border-2 border-primary/20 shadow-sm bg-slate-200"></div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-white">
                    <div className="px-8 py-5 flex flex-wrap items-center justify-between gap-6 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-3 text-sm font-bold uppercase tracking-wider">
                            <Link className="text-slate-400 hover:text-primary transition-colors" to="/courses">Curriculum</Link>
                            <span className="text-slate-200 text-lg">/</span>
                            <span className="text-primary tracking-tight font-black">{course.category_name || 'Engineering'}</span>
                            <span className="text-slate-200 text-lg">/</span>
                            <span className="text-slate-900 tracking-tight font-black line-clamp-1">{course.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePreviousLesson}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100 active:scale-95"
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>
                            <button
                                onClick={handleNextLesson}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
                            >
                                Next Lesson
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="px-8 py-8">
                        <div className="relative group aspect-video rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border border-slate-100">
                            {currentLesson?.youtube_video_id ? (
                                <SecureVideoPlayer videoId={currentLesson.youtube_video_id} />
                            ) : (
                                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                    <Play size={64} className="text-primary/40" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col flex-1 px-8">
                        <div className="flex border-b border-slate-100 scrollbar-hide overflow-x-auto">
                            <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} label="About Curriculum" />
                            <TabButton active={activeTab === "qa"} onClick={() => setActiveTab("qa")} label="Q&A Portal" />
                            <TabButton active={activeTab === "notes"} onClick={() => setActiveTab("notes")} label="Institutional Notes" />
                            <TabButton active={activeTab === "reviews"} onClick={() => setActiveTab("reviews")} label="Peer Feedback" />
                        </div>

                        <div className="py-10 flex flex-col gap-10 max-w-5xl">
                            {activeTab === "overview" && (
                                <>
                                    <div>
                                        <h2 className="text-3xl font-black mb-6 tracking-tight italic">Technical Specification</h2>
                                        <p className="text-slate-500 text-lg leading-relaxed font-medium italic">
                                            {currentLesson?.title}: This module establishes the core foundational principles required for high-fidelity technical mastery.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-y border-slate-100">
                                        <div className="flex items-start gap-5 group cursor-pointer">
                                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all transform group-hover:-translate-y-1">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-xs uppercase tracking-widest mb-1.5 pt-1">Curriculum Resources</h4>
                                                <p className="text-sm text-slate-400 font-medium italic">Download primary source artifacts and documentation (PDF, ZIP)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-5 group cursor-pointer">
                                            <div className="bg-primary/10 p-4 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all transform group-hover:-translate-y-1">
                                                <MessageSquare size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-xs uppercase tracking-widest mb-1.5 pt-1">Peer Connectivity</h4>
                                                <p className="text-sm text-slate-400 font-medium italic">Join the active technical environment for this module.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 py-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 mt-4">
                                        <div className="bg-slate-200 rounded-full size-14 border-4 border-white shadow-md"></div>
                                        <div>
                                            <h4 className="font-black text-xl tracking-tight italic">{course.instructor_name}</h4>
                                            <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">Lead Research Architect</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <aside className="w-full lg:w-[450px] border-l border-slate-100 flex flex-col bg-slate-50/50 backdrop-blur-3xl lg:relative h-full">
                    <div className="p-10 border-b border-slate-100 bg-white/80">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-2xl italic tracking-tighter">Course Portfolio</h3>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                            <span className="text-primary italic">{progressPercent}% MASTERED</span>
                            <span>{completedCount} / {lessons.length} MODULES</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div className="bg-primary h-full rounded-full shadow-[0_0_15px_rgba(19,91,236,0.3)] transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                        <div className="rounded-[2.5rem] border border-slate-100 bg-white overflow-hidden shadow-sm">
                            <div className="px-8 py-6 flex items-center justify-between bg-slate-50/50 border-b border-slate-100">
                                <div className="flex flex-col items-start">
                                    <span className="text-[9px] font-black text-primary mb-1 uppercase tracking-[0.2em] italic">Curriculum Segment 01</span>
                                    <h4 className="font-black text-sm text-slate-900 tracking-tight italic">Framework Foundations</h4>
                                </div>
                                <ChevronUp size={18} className="text-slate-300" />
                            </div>

                            <div className="flex flex-col divide-y divide-slate-50">
                                {lessons.map((lesson, index) => {
                                    const isCompleted = progress?.completed_lessons?.includes(lesson.id);
                                    const isCurrent = currentLesson?.id === lesson.id;
                                    return (
                                        <div
                                            key={lesson.id}
                                            onClick={() => setCurrentLesson(lesson)}
                                            className={`px-8 py-6 flex items-center gap-6 cursor-pointer transition-all border-l-[6px] ${isCurrent
                                                ? 'bg-primary/[0.03] border-primary'
                                                : 'hover:bg-slate-50 border-transparent'
                                                }`}
                                        >
                                            <div className={`size-10 rounded-2xl flex items-center justify-center transition-all ${isCompleted
                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                : isCurrent
                                                    ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-110'
                                                    : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                {isCompleted ? <Check size={20} className="stroke-[3]" /> : isCurrent ? <Play size={20} className="fill-white" /> : <span className="text-xs font-black">{index + 1}</span>}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-black italic tracking-tight ${isCurrent ? 'text-primary' : 'text-slate-700'}`}>
                                                    {lesson.title}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1.5 opacity-60">
                                                    <PlayCircle size={12} className="text-slate-400" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">42:10 Active Streaming</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="p-10 bg-white border-t border-slate-100">
                        <button
                            disabled={progressPercent < 100}
                            className={`w-full py-5 font-black rounded-2xl border text-xs uppercase tracking-[0.2em] italic transition-all active:scale-95 flex items-center justify-center gap-3 ${progressPercent === 100
                                ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/20 hover:bg-primary/90'
                                : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                }`}
                        >
                            Request Institutional Credential
                        </button>
                    </div>
                </aside>
            </main>
        </div>
    );
}

function TabButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative shrink-0 ${active ? 'text-primary italic' : 'text-slate-400 hover:text-slate-600'}`}
        >
            {label}
            {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-5px_15px_rgba(19,91,236,0.3)]" />}
        </button>
    );
}
