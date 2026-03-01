import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Sidebar from "@/components/Sidebar";
import Button from "@/components/ui/Button";
import OnboardingModal from "@/components/OnboardingModal";

interface EnrolledCourse {
    id: string;
    title: string;
    instructor_name: string;
    progress: number;
    total_lessons: number;
    completed_lessons: number;
    thumbnail_url?: string;
    average_rating?: number;
}

interface LearningStats {
    totalCourses: number;
    completedCourses: number;
    totalHours: number;
    certificatesEarned: number;
}

export default function StudentDashboard() {
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
    const [stats, setStats] = useState<LearningStats>({
        totalCourses: 0,
        completedCourses: 0,
        totalHours: 0,
        certificatesEarned: 0
    });
    const [loading, setLoading] = useState(true);
    const [isProfileComplete, setIsProfileComplete] = useState<boolean>(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            navigate("/auth");
            return;
        }

        if (user.role !== "student") {
            if (user.role === "admin") navigate("/admin/dashboard");
            else navigate("/auth");
            return;
        }

        fetchData();
    }, [user, authLoading, navigate]);

    const fetchData = async () => {
        try {
            const [coursesRes, statsRes, profileRes] = await Promise.all([
                api.get("/student/courses"),
                api.get("/student/stats"),
                api.get("/auth/profile")
            ]);

            setIsProfileComplete(profileRes.data.isProfileComplete);

            setEnrolledCourses(coursesRes.data || []);
            setStats(statsRes.data || {
                totalCourses: 0,
                completedCourses: 0,
                totalHours: 0,
                certificatesEarned: 0
            });
        } catch (error) {
            showToast("Failed to load dashboard data", "error");
        } finally {
            setLoading(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    const firstCourse = enrolledCourses[0];
    const continueLearning = enrolledCourses.slice(1);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "Good Morning";
        if (hour >= 12 && hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <Sidebar />

            {!isProfileComplete && (
                <OnboardingModal onComplete={() => setIsProfileComplete(true)} />
            )}

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto p-6 md:p-8 lg:p-10 space-y-10">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                                {getGreeting()}, {user?.name?.split(" ")[0] || "Scholar"}!
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl">
                                You're almost there! Complete your current course to reach your weekly institutional mastery goal.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button className="p-3 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">
                                <span className="material-symbols-outlined block">notifications</span>
                            </button>
                        </div>
                    </header>

                    <div className="grid grid-cols-12 gap-8">
                        {/* Left Column */}
                        <div className="col-span-12 lg:col-span-8 space-y-8">
                            {/* Resume Learning Card */}
                            <section className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                                {firstCourse ? (
                                    <div className="flex flex-col md:flex-row">
                                        <div className="md:w-2/5 h-64 md:h-auto relative">
                                            <img
                                                src={firstCourse.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"}
                                                alt={firstCourse.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-primary/10"></div>
                                        </div>
                                        <div className="md:w-3/5 p-8 flex flex-col justify-between">
                                            <div>
                                                <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-widest">Most Recent Engagement</span>
                                                <h3 className="text-2xl font-black mt-4 mb-2 truncate">{firstCourse.title}</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Next Unit: Mastery of Module {firstCourse.completed_lessons + 1}</p>
                                            </div>
                                            <div className="mt-8 space-y-4">
                                                <div className="flex justify-between items-center text-sm font-bold">
                                                    <span className="text-slate-700 dark:text-slate-300">Phase Progress</span>
                                                    <span className="text-primary">{firstCourse.progress}%</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${firstCourse.progress}%` }}></div>
                                                </div>
                                                <div className="flex pt-4">
                                                    <Button
                                                        onClick={() => navigate(`/courses/${firstCourse.id}/learn`)}
                                                        className="px-8 py-3 rounded-xl shadow-lg shadow-primary/20"
                                                    >
                                                        Resume Learning
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                            <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2">Initialize Your Journey</h3>
                                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">You haven't enrolled in any courses yet. Explore our curriculum to begin your professional evolution.</p>
                                        <Button onClick={() => navigate("/courses")}>Browse Curriculums</Button>
                                    </div>
                                )}
                            </section>

                            {/* Weekly Activity & Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Weekly Activity</h4>
                                            <p className="text-3xl font-black mt-1 tracking-tight">{stats.totalHours}.5 Hours</p>
                                            <span className="text-emerald-500 text-xs font-bold flex items-center gap-1 mt-1">
                                                <span className="material-symbols-outlined text-sm">trending_up</span> +12% this week
                                            </span>
                                        </div>
                                        <div className="text-slate-300">
                                            <span className="material-symbols-outlined">analytics</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex items-end justify-between gap-3 h-40 px-2 mt-4">
                                        {[
                                            { day: "MON", h: "90%", active: false },
                                            { day: "TUE", h: "45%", active: false },
                                            { day: "WED", h: "60%", active: false },
                                            { day: "THU", h: "100%", active: true },
                                            { day: "FRI", h: "50%", active: false },
                                            { day: "SAT", h: "20%", active: false },
                                            { day: "SUN", h: "10%", active: false },
                                        ].map((bar, i) => (
                                            <div key={i} className="flex flex-col items-center gap-3 w-full group">
                                                <div
                                                    className={`w-full rounded-t-lg transition-all duration-500 ${bar.active ? "bg-primary shadow-lg shadow-primary/20" : "bg-primary/10 group-hover:bg-primary/20"}`}
                                                    style={{ height: bar.h }}
                                                ></div>
                                                <span className={`text-[10px] font-black tracking-tighter ${bar.active ? "text-primary" : "text-slate-400"}`}>{bar.day}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                                    <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Quick Institutional Stats</h4>
                                    <div className="space-y-6">
                                        <StatItem icon="bolt" label="12 Day Streak" sub="Superior consistency" color="text-orange-500" bg="bg-orange-50 dark:bg-orange-500/10" />
                                        <StatItem icon="workspace_premium" label={`${stats.certificatesEarned} Certificates`} sub="Verified credentials" color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
                                        <StatItem icon="school" label={`${stats.totalCourses} Active Modules`} sub="In your current library" color="text-purple-500" bg="bg-purple-50 dark:bg-purple-500/10" />
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Right Column / Deadlines */}
                        <div className="col-span-12 lg:col-span-4 space-y-8">
                            <section className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 h-full flex flex-col">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="font-black text-xl tracking-tight">Upcoming Deadlines</h3>
                                    <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">View Entire Calendar</button>
                                </div>
                                <div className="space-y-8 flex-1">
                                    <DeadlineItem date="Oct 24" title="Case Study: Design Ethics" course="Advanced UI Systems" status="2 Days Left" color="rose" />
                                    <DeadlineItem date="Oct 28" title="Prototype Submission" course="Interaction Design" status="6 Days Left" color="amber" />
                                    <DeadlineItem date="Nov 02" title="Visual Hierarchy Quiz" course="UI Fundamentals" status="Next Month" color="slate" />
                                </div>
                                <div className="mt-10 p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                            <span className="material-symbols-outlined text-xl">lightbulb</span>
                                        </div>
                                        <div>
                                            <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Institutional Mastery Tip</h5>
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                Students who maintain a 20-minute daily engagement session are 3.5x more likely to achieve certification!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Continue Learning List */}
                    <section className="pt-4">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-black text-2xl tracking-tight">Synchronize Progress</h3>
                            <div className="flex gap-2">
                                <button className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-primary transition-colors disabled:opacity-30">
                                    <span className="material-symbols-outlined block">chevron_left</span>
                                </button>
                                <button className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-primary transition-colors disabled:opacity-30">
                                    <span className="material-symbols-outlined block">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        {continueLearning.length === 0 ? (
                            <div className="bg-white/50 dark:bg-slate-900/50 p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                <p className="text-slate-400 text-sm font-medium">No additional active courses found in your library.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {continueLearning.map((course) => (
                                    <div key={course.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex gap-5 group hover:border-primary/30 transition-all cursor-pointer" onClick={() => navigate(`/courses/${course.id}/learn`)}>
                                        <div className="size-20 rounded-xl overflow-hidden shrink-0 shadow-md">
                                            <img
                                                src={course.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"}
                                                alt={course.title}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{course.title}</h4>
                                            <p className="text-xs text-slate-400 font-medium mb-3">{course.total_lessons - course.completed_lessons} units remaining</p>
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${course.progress > 80 ? "bg-emerald-500" : "bg-primary"}`}
                                                    style={{ width: `${course.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

function StatItem({ icon, label, sub, color, bg }: any) {
    return (
        <div className="flex items-center gap-5 group">
            <div className={`size-14 ${bg} ${color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-sm`}>
                <span className="material-symbols-outlined text-2xl font-bold">{icon}</span>
            </div>
            <div>
                <p className="font-black text-slate-900 dark:text-white tracking-tight">{label}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{sub}</p>
            </div>
        </div>
    );
}

function DeadlineItem({ date, title, course, status, color }: any) {
    const colorClasses = {
        rose: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-100 dark:border-rose-900/50 status:text-rose-500",
        amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-100 dark:border-amber-900/50 status:text-amber-600",
        slate: "bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-100 dark:border-slate-800 status:text-slate-400"
    }[color as 'rose' | 'amber' | 'slate'];

    const [month, day] = date.split(" ");

    return (
        <div className="flex gap-6 group cursor-pointer">
            <div className={`flex flex-col items-center justify-center w-14 h-16 rounded-2xl border ${colorClasses.split(" status:")[0]} shadow-sm`}>
                <span className="text-[10px] font-black uppercase tracking-tighter mb-0.5">{month}</span>
                <span className="text-2xl font-black leading-none">{day}</span>
            </div>
            <div className="flex-1 pb-2">
                <h4 className="text-sm font-black group-hover:text-primary transition-colors text-slate-900 dark:text-white leading-tight">{title}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Module: {course}</p>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`size-2 rounded-full ${color === 'rose' ? 'bg-rose-500' : color === 'amber' ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${color === 'rose' ? 'text-rose-500' : color === 'amber' ? 'text-amber-600' : 'text-slate-400'}`}>{status}</span>
                </div>
            </div>
        </div>
    );
}
