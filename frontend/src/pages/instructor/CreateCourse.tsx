import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
    BookOpen,
    IndianRupee,
    FileText,
    Tag,
    Loader2,
    Save,
    Eye
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface Category {
    id: string;
    name: string;
}

export default function CreateCourse() {
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        category_id: "",
        thumbnail_url: ""
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get("/public/categories");
                setCategories(res.data);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.price) {
            showToast("Title and price are required", "error");
            return;
        }

        if (Number(formData.price) < 0) {
            showToast("Price must be a positive number", "error");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post("/courses", {
                title: formData.title,
                description: formData.description,
                price: Number(formData.price),
                category_id: formData.category_id || null
            });

            showToast("Course draft initialized successfully!", "success");
            if (user?.role === "instructor") {
                navigate(`/instructor/courses/${res.data.id}/lessons`);
            } else {
                navigate(`/admin/courses/${res.data.id}/lessons`);
            }
        } catch (error: any) {
            console.error("Create course error:", error);
            showToast(error.response?.data?.message || "Failed to initiate curriculum", "error");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return (
        <div className="flex h-screen items-center justify-center bg-background-light">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
    );

    if (!user || (user.role !== "admin" && user.role !== "instructor")) {
        navigate("/");
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-white font-display">
            <Sidebar />

            <main className="flex-1 overflow-y-auto bg-slate-50 p-8 md:p-12">
                <div className="fluid-container">
                    {/* Header */}
                    <div className="mb-10">
                        <Link
                            to={user?.role === "instructor" ? "/instructor/courses" : "/admin/courses"}
                            className="inline-flex items-center gap-2 text-slate-400 hover:text-primary mb-6 font-bold text-xs uppercase tracking-widest transition-all group"
                        >
                            <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                            Back to Curriculum Governance
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Initialize New Course</h1>
                        <p className="text-slate-500 mt-3 font-medium text-lg">Initialize a new institutional learning framework.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
                        <div className="space-y-8">
                            {/* Title */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
                                    Curriculum Title *
                                </label>
                                <div className="relative group">
                                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        id="title"
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g., Quantum Computing Fundamentals"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
                                    Institutional Abstract
                                </label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-4 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Describe the learning outcomes and professional scope..."
                                        rows={5}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Price and Category Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Price */}
                                <div>
                                    <label htmlFor="price" className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
                                        Valuation (₹) *
                                    </label>
                                    <div className="relative group">
                                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                        <input
                                            id="price"
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            placeholder="2499"
                                            min="0"
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label htmlFor="category_id" className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
                                        Domain Category
                                    </label>
                                    <div className="relative group">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                        <select
                                            id="category_id"
                                            name="category_id"
                                            value={formData.category_id}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Domain</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Eye size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Post-Deployment Protocol</p>
                                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                            Upon successful initialization, you will be redirected to add modules and instructional video content. The curriculum will remain in <strong>Draft Mode</strong> until finalized by an administrator.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center gap-6 pt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 px-8 py-5 bg-primary text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            INITIALIZING DRAFT...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            INITIALIZE COURSE DRAFT
                                        </>
                                    )}
                                </button>
                                <Link
                                    to={user?.role === "instructor" ? "/instructor/courses" : "/admin/courses"}
                                    className="px-8 py-5 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors"
                                >
                                    ABORT
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
