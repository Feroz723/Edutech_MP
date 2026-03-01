import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Button from "@/components/ui/Button";

interface Course {
    id: string;
    title: string;
    description: string;
    price: number;
    instructor_name: string;
    average_rating: number;
    total_reviews: number;
    category_name?: string;
    thumbnail?: string;
    instructor_role?: string;
    duration?: string;
}

export default function CoursesPage() {
    useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [courses, setCourses] = useState<Course[]>([]);
    const [trendingCourses, setTrendingCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const searchQuery = searchParams.get("search") || "";
    const selectedCategory = searchParams.get("category") || "All";

    const categories = [
        { id: "Code", label: "Code", icon: "code", count: "1.2k courses", colorCode: "bg-blue-100 text-blue-600" },
        { id: "Business", label: "Business", icon: "business_center", count: "850 courses", colorCode: "bg-emerald-100 text-emerald-600" },
        { id: "Design", label: "Design", icon: "palette", count: "600 courses", colorCode: "bg-purple-100 text-purple-600" },
        { id: "Marketing", label: "Marketing", icon: "trending_up", count: "400 courses", colorCode: "bg-orange-100 text-orange-600" },
    ];

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [coursesRes, trendingRes] = await Promise.all([
                    api.get("/public/courses"),
                    api.get("/public/courses/trending")
                ]);

                setCourses(coursesRes.data);
                setTrendingCourses(trendingRes.data);
            } catch (error) {
                showToast("Failed to refresh marketplace", "error");
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [showToast]);

    useEffect(() => {
        if (!searchQuery) return;

        const performSearch = async () => {
            try {
                const res = await api.get(`/public/courses/search?query=${searchQuery}`);
                setCourses(res.data);
            } catch (error) {
                console.error("Search failed:", error);
            }
        };

        const timeoutId = setTimeout(performSearch, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const filteredCourses = useMemo(() => {
        return courses.filter(c => {
            const matchesCategory = selectedCategory === "All" || c.category_name?.toLowerCase() === selectedCategory.toLowerCase();
            return matchesCategory;
        });
    }, [courses, selectedCategory]);

    const updateSearch = (query: string) => {
        if (query) searchParams.set("search", query);
        else searchParams.delete("search");
        setSearchParams(searchParams);
    };

    const updateCategory = (cat: string) => {
        if (cat === "All") searchParams.delete("category");
        else searchParams.set("category", cat);
        setSearchParams(searchParams);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            <Sidebar />

            <main className="flex-1 overflow-y-auto">
                {/* Header Search Section */}
                <div className="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-10 py-6">
                    <div className="flex items-center gap-4 max-w-[1600px] mx-auto">
                        <div className="flex-1 relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                            <input
                                type="text"
                                placeholder="Search for courses, instructors, or skills..."
                                value={searchQuery}
                                onChange={(e) => updateSearch(e.target.value)}
                                className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                            />
                        </div>
                        <button className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">tune</span>
                        </button>
                    </div>
                </div>

                <div className="px-6 md:px-10 pb-12 max-w-[1600px] mx-auto space-y-12">
                    {/* Categories */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                onClick={() => updateCategory(cat.id)}
                                className={`flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-primary/40 transition-all cursor-pointer group shadow-sm hover:shadow-xl hover:shadow-primary/5 ${selectedCategory === cat.id ? "border-primary bg-primary/[0.02]" : ""}`}
                            >
                                <div className={`w-14 h-14 ${cat.colorCode} rounded-full flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-500 transform group-hover:scale-110`}>
                                    <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
                                </div>
                                <span className="text-sm font-black tracking-tight">{cat.label}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">{cat.count}</span>
                            </div>
                        ))}
                    </div>

                    {/* Trending Slider */}
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black tracking-tight">Trending Courses</h2>
                            <button className="text-primary text-sm font-black uppercase tracking-widest hover:underline px-2 py-1">View all</button>
                        </div>
                        <div className="flex gap-8 overflow-x-auto pb-6 -mx-2 px-2 scrollbar-none snap-x">
                            {trendingCourses.map((course) => (
                                <div
                                    key={course.id}
                                    onClick={() => navigate(`/courses/${course.id}`)}
                                    className="min-w-[340px] bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 dark:border-slate-800 group cursor-pointer snap-start"
                                >
                                    <div className="h-44 overflow-hidden relative p-4">
                                        <img
                                            src={course.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop`}
                                            className="w-full h-full object-cover rounded-[1.8rem] transition-transform duration-700 group-hover:scale-110"
                                            alt={course.title}
                                        />
                                        <div className="absolute top-6 right-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-primary text-[10px] font-black tracking-widest uppercase shadow-lg">Best Seller</div>
                                    </div>
                                    <div className="p-8 pt-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-[10px] font-black text-primary px-3 py-1.5 bg-primary/10 rounded-lg uppercase tracking-widest">{course.category_name}</span>
                                            <div className="flex items-center text-amber-500 gap-1">
                                                <span className="material-symbols-outlined text-sm font-fill">star</span>
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">{course.average_rating || "4.9"}</span>
                                            </div>
                                        </div>
                                        <h3 className="font-black text-lg text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">{course.title}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">{course.instructor_name} • {course.duration}</p>
                                        <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-6">
                                            <span className="text-2xl font-black text-slate-900 dark:text-white">₹{course.price.toLocaleString()}</span>
                                            <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                                <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Available Courses Grid */}
                    <div className="pt-4">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black tracking-tight">Available Courses</h2>
                            <div className="flex items-center gap-6 bg-white dark:bg-slate-900 px-6 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Sort by:</span>
                                <button className="text-xs font-black flex items-center gap-2 text-slate-900 dark:text-white uppercase tracking-widest hover:text-primary transition-colors">
                                    Popularity <span className="material-symbols-outlined text-lg">expand_more</span>
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-96 w-full bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] animate-pulse"></div>
                                ))}
                            </div>
                        ) : filteredCourses.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-700 p-24 text-center">
                                <div className="size-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300">
                                    <span className="material-symbols-outlined text-5xl">manage_search</span>
                                </div>
                                <h3 className="text-2xl font-black mb-3">No matches found</h3>
                                <p className="text-slate-500 max-w-md mx-auto font-medium">We couldn't find any courses matching your current search or filters. Try broad terms or different categories.</p>
                                <Button className="mt-10" onClick={() => setSearchParams({})}>Reset all filters</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredCourses.map((course) => (
                                    <div
                                        key={course.id}
                                        onClick={() => navigate(`/courses/${course.id}`)}
                                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group cursor-pointer"
                                    >
                                        <div className="h-48 relative overflow-hidden p-4 pb-0">
                                            <div className="absolute inset-4 overflow-hidden rounded-[1.8rem]">
                                                <div className="absolute inset-0 bg-gradient-to-br from-primary to-indigo-900 flex items-center justify-center transition-transform duration-700 group-hover:scale-110">
                                                    <span className="material-symbols-outlined text-white/20 text-8xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-125">
                                                        {course.category_name?.toLowerCase().includes("code") ? "code" :
                                                            course.category_name?.toLowerCase().includes("design") ? "palette" : "school"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-8 flex-1 flex flex-col">
                                            <h4 className="font-black text-lg text-slate-900 dark:text-white mb-3 line-clamp-2 h-14 leading-tight group-hover:text-primary transition-colors">{course.title}</h4>

                                            <div className="flex items-center gap-1 mb-8">
                                                <div className="flex text-amber-500">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <span key={star} className={`material-symbols-outlined text-lg ${star <= Math.floor(course.average_rating || 5) ? "font-fill" : ""}`}>star</span>
                                                    ))}
                                                </div>
                                                <span className="text-xs font-black text-slate-400 ml-2 tracking-widest">{course.average_rating || "4.9"}</span>
                                            </div>

                                            <div className="mt-auto flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-8">
                                                <span className="text-2xl font-black text-slate-900 dark:text-white">₹{course.price.toLocaleString()}</span>
                                                <button className="p-4 text-primary bg-primary/10 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">
                                                    <span className="material-symbols-outlined text-2xl font-black">add_shopping_cart</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        <div className="flex justify-center mt-20 gap-3">
                            <button className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-white dark:hover:bg-slate-900 transition-all">
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/30">1</button>
                            <button className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 font-black transition-all">2</button>
                            <button className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 font-black transition-all">3</button>
                            <span className="flex items-center justify-center w-12 text-slate-400 font-black italic">...</span>
                            <button className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 font-black transition-all">12</button>
                            <button className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-white dark:hover:bg-slate-900 transition-all">
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
