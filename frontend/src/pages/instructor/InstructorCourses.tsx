import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Course {
    id: string;
    title: string;
    description: string;
    price: number;
    is_published: boolean;
    created_at: string;
    student_count?: number;
    average_rating?: number;
}

export default function InstructorCourses() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== "instructor") {
            navigate("/auth");
            return;
        }
        fetchCourses();
    }, [user, navigate]);

    const fetchCourses = async () => {
        try {
            const res = await api.get("/courses/my-courses");
            setCourses(res.data);
        } catch (error) {
            showToast("Failed to load your curated modules", "error");
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (courseId: string, currentStatus: boolean) => {
        try {
            if (currentStatus) {
                // Placeholder for unpublish logic if needed
                showToast("Transitioned to draft status", "info");
            } else {
                await api.put(`/courses/${courseId}/publish`);
                showToast("Curriculum published to marketplace!", "success");
            }
            fetchCourses();
        } catch (error) {
            showToast("Failed to synchronize curriculum status", "error");
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
            <Sidebar />

            <main className="flex-1 overflow-y-auto">
                <div className="fluid-container py-8">
                    <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                <span>Instructor</span>
                                <span className="material-symbols-outlined text-xs">chevron_right</span>
                                <span className="text-slate-900 dark:text-white">Curriculum Management</span>
                            </nav>
                            <h1 className="text-3xl font-black tracking-tight">My Courses</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Deploy and maintain your professional learning modules</p>
                        </div>

                        <Button onClick={() => navigate("/instructor/courses/create")}>
                            <span className="material-symbols-outlined mr-2">add</span>
                            Create New Course
                        </Button>
                    </header>

                    {courses.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
                            <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-slate-300 text-4xl">menu_book</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">No active curriculums</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mb-8">You haven't deployed any learning modules yet. Start your journey by creating your first course.</p>
                            <Button variant="outline" onClick={() => navigate("/instructor/courses/create")}>
                                Synchronize First Module
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {courses.map((course) => (
                                <Card key={course.id} className="overflow-hidden group">
                                    <div className="aspect-video bg-gradient-to-br from-primary to-blue-700 relative flex items-center justify-center overflow-hidden">
                                        <span className="material-symbols-outlined text-white/20 text-7xl transform group-hover:scale-110 transition-transform duration-500">school</span>
                                        <div className="absolute top-4 left-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest shadow-sm ${course.is_published
                                                ? "bg-emerald-500 text-white"
                                                : "bg-amber-500 text-white"}`}>
                                                {course.is_published ? "Published" : "Draft Mode"}
                                            </span>
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">groups</span>
                                                {course.student_count || 0} Students
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                                                {course.average_rating?.toFixed(1) || "0.0"}
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold mb-4 line-clamp-2 h-14 group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/instructor/courses/${course.id}/edit`)}>
                                            {course.title}
                                        </h3>

                                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <Button variant="ghost" size="sm" className="px-0" onClick={() => navigate(`/instructor/courses/${course.id}/edit`)}>
                                                <span className="material-symbols-outlined text-sm mr-1">edit</span> Edit
                                            </Button>
                                            <Button variant="ghost" size="sm" className="px-0" onClick={() => navigate(`/instructor/courses/${course.id}/lessons`)}>
                                                <span className="material-symbols-outlined text-sm mr-1">list</span> Lessons
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`px-0 ${course.is_published ? "text-amber-500" : "text-emerald-500"}`}
                                                onClick={() => handlePublish(course.id, course.is_published)}
                                            >
                                                <span className="material-symbols-outlined text-sm mr-1">
                                                    {course.is_published ? "visibility_off" : "visibility"}
                                                </span>
                                                {course.is_published ? "Draft" : "Publish"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
