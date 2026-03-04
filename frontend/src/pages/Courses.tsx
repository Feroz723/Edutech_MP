import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/Button";
import {
    Star,
    Users,
    Clock,
    PlayCircle,
    ChevronRight,
    Search,
    SlidersHorizontal,
    ArrowLeft
} from "lucide-react";

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
    duration?: string;
    total_lessons?: number;
}

export default function CoursesPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const searchQuery = searchParams.get("search") || "";
    const selectedCategory = searchParams.get("category") || "All";

    const categories = [
        "All",
        "Business",
        "Development",
        "Design",
        "Marketing",
        "Data Science",
        "Personal Development"
    ];

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get("/public/courses");
                setCourses(res.data);
            } catch (error) {
                showToast("Failed to fetch courses", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
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
        <div className="min-h-screen bg-background-light dark:bg-background-dark pb-32">
            <div className="fluid-container pt-12">
                {/* Header & Breadcrumbs */}
                <div className="flex flex-col gap-8 mb-12">
                    <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                            <ArrowLeft size={14} />
                            Home
                        </Link>
                        <ChevronRight size={14} />
                        <span className="text-slate-900 dark:text-white">Available Courses</span>
                    </nav>

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                        <div className="max-w-3xl">
                            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight mb-4">
                                Available Courses
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xl font-medium leading-relaxed">
                                Detailed list of industry-standard courses taught by world-class experts.
                            </p>
                        </div>

                        <div className="flex gap-4 w-full lg:w-auto">
                            <div className="flex-1 lg:w-80 relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchQuery}
                                    onChange={(e) => updateSearch(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                                />
                            </div>
                            <button className="flex items-center gap-2 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <SlidersHorizontal size={18} />
                                Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex gap-3 overflow-x-auto pb-6 mb-12 scrollbar-none snap-x">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => updateCategory(cat)}
                            className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all snap-start ${selectedCategory === cat
                                    ? "bg-primary text-white shadow-xl shadow-primary/30"
                                    : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 hover:border-primary/50"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Course List Wrapper */}
                <div className="flex flex-col gap-8">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] animate-pulse" />
                        ))
                    ) : filteredCourses.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700 p-24 text-center">
                            <Search className="size-20 text-slate-200 mx-auto mb-6" />
                            <h3 className="text-2xl font-black mb-2">No matching curricula</h3>
                            <p className="text-slate-500 font-medium mb-10">Try a different search term or category.</p>
                            <Button onClick={() => setSearchParams({})}>Reset All Filters</Button>
                        </div>
                    ) : (
                        filteredCourses.map((course) => (
                            <CourseListItem key={course.id} course={course} onClick={() => navigate(`/courses/${course.id}`)} />
                        ))
                    )}
                </div>

                {/* Pagination */}
                <div className="flex justify-center mt-20 gap-3">
                    <button className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-white dark:hover:bg-slate-900 transition-all font-black">
                        <ChevronRight className="rotate-180" size={20} />
                    </button>
                    <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/30">1</button>
                    {[2, 3].map(i => (
                        <button key={i} className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 font-black transition-all">
                            {i}
                        </button>
                    ))}
                    <span className="flex items-center justify-center w-12 text-slate-400 font-black italic">...</span>
                    <button className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 font-black transition-all">12</button>
                    <button className="w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-white dark:hover:bg-slate-900 transition-all font-black">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function CourseListItem({ course, onClick }: { course: Course, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="group flex flex-col lg:flex-row bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer"
        >
            {/* Thumbnail Area */}
            <div className="lg:w-80 w-full h-64 lg:h-auto overflow-hidden relative">
                <img
                    src={course.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 transition-opacity"
                    alt={course.title}
                />
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
                    <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-lg">Bestseller</span>
                    {course.price > 1000 && <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-lg">Premium Access</span>}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-1 flex-col lg:flex-row p-10 gap-10">
                <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-primary px-3 py-1 bg-primary/10 rounded-lg uppercase tracking-widest">
                                {course.category_name || "Enterprise"}
                            </span>
                            {course.average_rating > 4.5 && (
                                <div className="flex items-center gap-1 text-amber-500">
                                    <Star size={14} className="fill-amber-500" />
                                    <span className="text-xs font-black tracking-widest uppercase">{course.average_rating || "4.9"}</span>
                                </div>
                            )}
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tighter group-hover:text-primary transition-colors">
                            {course.title}
                        </h3>
                    </div>

                    <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed font-medium line-clamp-2">
                        {course.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                        <MetaItem icon={<Users size={16} />} label={course.instructor_name} />
                        <MetaItem icon={<Clock size={16} />} label={course.duration || "Self-Paced"} />
                        <MetaItem icon={<PlayCircle size={16} />} label={`${course.total_lessons || 48} Curricula`} />
                    </div>
                </div>

                {/* Price & Action Area */}
                <div className="flex lg:flex-col justify-between lg:justify-center items-center lg:items-end lg:min-w-[200px] border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-8 lg:pt-0 lg:pl-10">
                    <div className="text-right">
                        <p className="text-4xl font-black text-slate-900 dark:text-white">₹{course.price.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">One-Time IP Access</p>
                    </div>
                    <Button className="mt-6 h-14 px-10 rounded-2xl shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform" size="lg">
                        View Curriculum
                    </Button>
                </div>
            </div>
        </div>
    );
}

function MetaItem({ icon, label }: { icon: React.ReactNode, label: string }) {
    return (
        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
            <span className="text-primary">{icon}</span>
            {label}
        </div>
    );
}
