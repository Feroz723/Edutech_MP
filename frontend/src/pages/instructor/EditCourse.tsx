import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
    Trash2
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function EditCourse() {
    const { id } = useParams();
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        category_id: ""
    });

    const [categories, setCategories] = useState<any[]>([]);

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

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== "admin") {
            navigate("/");
            return;
        }

        fetchCourse();
    }, [user, authLoading, navigate, id]);

    const fetchCourse = async () => {
        try {
            const res = await api.get(`/courses/${id}`);
            const course = res.data;
            setFormData({
                title: course.title || "",
                description: course.description || "",
                price: course.price?.toString() || "",
                category_id: course.category_id?.toString() || ""
            });
        } catch (error) {
            showToast("Failed to load curriculum details", "error");
            navigate("/admin/courses");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.price) {
            showToast("Title and valuation are required", "error");
            return;
        }

        setSaving(true);
        try {
            await api.put(`/courses/${id}`, {
                title: formData.title,
                description: formData.description,
                price: Number(formData.price),
                category_id: formData.category_id || null
            });

            showToast("Curriculum protocol updated!", "success");
            navigate("/admin/courses");
        } catch (error: any) {
            console.error("Update course error:", error);
            showToast(error.response?.data?.message || "Failed to sync updates", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to decommission this course? This action is irreversible.")) return;

        try {
            await api.delete(`/admin/courses/${id}`);
            showToast("Course decommissioned successfully", "success");
            navigate("/admin/courses");
        } catch (error) {
            showToast("Decommissioning failed", "error");
        }
    };

    if (loading || authLoading) return (
        <div className="flex h-screen items-center justify-center bg-background-light">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-white font-display">
            <Sidebar />

            <main className="flex-1 overflow-y-auto bg-slate-50 p-8 md:p-12">
                <div className="fluid-container">
                    {/* Header */}
                    <div className="mb-10 flex justify-between items-end">
                        <div>
                            <Link
                                to="/admin/courses"
                                className="inline-flex items-center gap-2 text-slate-400 hover:text-primary mb-6 font-bold text-xs uppercase tracking-widest transition-all group"
                            >
                                <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                                Back to Curriculum Governance
                            </Link>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Modify Curriculum</h1>
                            <p className="text-slate-500 mt-3 font-medium text-lg">Update institutional learning parameters for <span className="text-primary">#{id?.slice(0, 8)}</span></p>
                        </div>
                        <button
                            onClick={handleDelete}
                            className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            title="Decommission Course"
                        >
                            <Trash2 size={24} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
                        <div className="space-y-8">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
                                    Curriculum Title *
                                </label>
                                <div className="relative group">
                                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-900"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
                                    Institutional Abstract
                                </label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-4 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={5}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-slate-900"
                                    />
                                </div>
                            </div>

                            {/* Price and Category Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Price */}
                                <div>
                                    <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
                                        Valuation (₹) *
                                    </label>
                                    <div className="relative group">
                                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-900"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
                                        Domain Category
                                    </label>
                                    <div className="relative group">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                        <select
                                            name="category_id"
                                            value={formData.category_id}
                                            onChange={handleChange}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer text-slate-900"
                                        >
                                            <option value="">Select Domain</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-6 pt-6">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-8 py-5 bg-primary text-white rounded-2xl font-bold text-sm shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            SYNCING...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            SAVE PROTOCOL
                                        </>
                                    )}
                                </button>
                                <Link
                                    to="/admin/courses"
                                    className="px-8 py-5 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors"
                                >
                                    CANCEL
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
