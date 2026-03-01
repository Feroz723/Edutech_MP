import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Sidebar from "@/components/Sidebar";

interface EnrolledCourse {
    id: string;
    title: string;
    instructor_name: string;
    instructor_role?: string;
    progress: number;
    total_lessons: number;
    completed_lessons: number;
    thumbnail_url?: string;
    category?: string;
}

export default function MyCourses() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "in-progress" | "completed">("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get("/student/courses");
                // Mocking categories and roles for high-fidelity UI if not present
                const enrichedCourses = response.data.map((course: any, index: number) => ({
                    ...course,
                    thumbnail_url: course.thumbnail_url || course.thumbnail,
                    category: course.category || (index % 2 === 0 ? "DESIGN" : "DEVELOPMENT"),
                    instructor_role: course.instructor_role || "Senior Instructor"
                }));
                setCourses(enrichedCourses);
            } catch (error) {
                showToast("Failed to load your learning path", "error");
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchCourses();
        else navigate("/auth");
    }, [user, showToast, navigate]);

    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            const matchesFilter =
                filter === "all" ? true :
                    filter === "in-progress" ? course.progress < 100 :
                        course.progress === 100;

            const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.instructor_name.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesFilter && matchesSearch;
        });
    }, [courses, filter, searchQuery]);

    if (loading && !courses.length) return (
        <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <Sidebar />

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto p-6 md:p-8 lg:p-10 space-y-8">
                    {/* Header */}
                    <header>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">My Learning</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Track your progress and continue your enrolled courses.</p>
                    </header>

                    {/* Controls */}
                    <div className="flex flex-col md:flex-row gap-6 justify-between items-center py-2">
                        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full md:w-auto">
                            {(["all", "in-progress", "completed"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setFilter(t)}
                                    className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === t
                                        ? "bg-primary/10 text-primary shadow-sm"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        }`}
                                >
                                    {t.replace("-", " ")}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:w-96 group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                            <input
                                type="text"
                                placeholder="Search your courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    {filteredCourses.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-700 p-20 text-center">
                            <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <span className="material-symbols-outlined text-4xl">search_off</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">No courses found</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                            {filteredCourses.map((course) => (
                                <CourseCard key={course.id} course={course} navigate={navigate} />
                            ))}

                            {/* Study Plan Widget */}
                            <div className="bg-primary rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-xl shadow-primary/30 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <span className="material-symbols-outlined text-9xl">auto_awesome</span>
                                </div>
                                <div className="z-10">
                                    <h3 className="text-2xl font-black mb-3">Keep going, {user?.name?.split(" ")[0] || "Scholar"}!</h3>
                                    <p className="text-primary-foreground/80 text-sm font-medium leading-relaxed">
                                        You've completed 4 lessons this week. You're in the top 10% of your cohort.
                                    </p>
                                </div>
                                <div className="z-10 mt-10">
                                    <button className="w-full bg-white text-primary font-black py-4 rounded-2xl hover:bg-slate-50 transition-colors shadow-lg">
                                        View Study Plan
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function CourseCard({ course, navigate }: { course: EnrolledCourse; navigate: any }) {
    const isCompleted = course.progress === 100;

    return (
        <div
            onClick={() => navigate(`/courses/${course.id}/learn`)}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-500 group cursor-pointer flex flex-col h-full"
        >
            <div className="aspect-[4/3] overflow-hidden relative p-4">
                <img
                    src={course.thumbnail_url || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop`}
                    alt={course.title}
                    className="w-full h-full object-cover rounded-[1.8rem] transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-6 right-8">
                    <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-lg ${isCompleted ? "bg-emerald-500 text-white" : "bg-white/90 dark:bg-slate-900/90 text-primary backdrop-blur-md"
                        }`}>
                        {isCompleted ? "COMPLETED" : course.category}
                    </span>
                </div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
                <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                        {course.instructor_name} • {course.instructor_role}
                    </p>
                </div>

                <div className="mt-8 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Progress</span>
                        <span className={`text-sm font-black ${isCompleted ? "text-emerald-500" : "text-primary"}`}>{course.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? "bg-emerald-500" : "bg-primary shadow-[0_0_10px_rgba(19,91,236,0.3)]"}`}
                            style={{ width: `${course.progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
