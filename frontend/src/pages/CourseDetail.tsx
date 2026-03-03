import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
    Star,
    Play
} from "lucide-react";
import Button from "@/components/ui/Button";

export default function CourseDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [course, setCourse] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [courseRes, reviewsRes] = await Promise.all([
                api.get(`/public/courses/${id}`),
                api.get(`/reviews/${id}`)
            ]);
            setCourse(courseRes.data);
            setReviews(reviewsRes.data);

            if (user) {
                try {
                    const accessRes = await api.get(`/orders/verify-access/${id}`);
                    setHasAccess(accessRes.data.hasAccess);
                } catch (error) {
                    setHasAccess(false);
                }
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, [id, user]);

    useEffect(() => {
        if (id) fetchData();
    }, [id, fetchData]);



    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmittingReview(true);
        try {
            await api.post(`/reviews/${id}`, reviewForm);
            const reviewsRes = await api.get(`/reviews/${id}`);
            setReviews(reviewsRes.data);
            setReviewForm({ rating: 5, comment: "" });
            showToast("Review submitted!", "success");
        } catch (error) {
            console.error("Failed to submit review", error);
            showToast("Failed to submit review", "error");
        } finally {
            setSubmittingReview(false);
        }
    };

    const handlePurchase = async () => {
        if (!id) return;

        if (!user) {
            navigate("/auth");
            return;
        }

        try {
            setProcessingPayment(true);
            const orderRes = await api.post("/orders", { courseId: id });
            const orderId = orderRes.data.orderId;

            const paymentRes = await api.post("/payments/create", { orderId });
            const { mid, txnToken, paymentUrl } = paymentRes.data;

            if (!mid || !txnToken || !paymentUrl) {
                throw new Error("Invalid payment initialization response");
            }

            const form = document.createElement("form");
            form.method = "POST";
            form.action = paymentUrl;

            const fields: Record<string, string> = {
                mid,
                orderId,
                txnToken,
            };

            Object.entries(fields).forEach(([key, value]) => {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = value;
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
        } catch (error: any) {
            console.error("Purchase failed", error);
            const message = error?.response?.data?.message || "Unable to start payment. Please try again.";
            showToast(message, "error");
            setProcessingPayment(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark pt-32 px-6">
                <div className="fluid-container">
                    <div className="animate-pulse space-y-12">
                        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-full w-48" />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full" />
                                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-2/3" />
                                <div className="h-[400px] bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] w-full" />
                            </div>
                            <div className="h-[500px] bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark pt-32 px-6">
                <div className="max-w-xl mx-auto text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl shadow-primary/5 border border-slate-100 dark:border-slate-800 px-8">
                    <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-slate-800 text-slate-300">
                        <span className="material-symbols-outlined text-4xl">search_off</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Course Not Found</h1>
                    <p className="text-slate-500 mb-10 font-medium">The curriculum you are looking for might have been moved or archived.</p>
                    <Button onClick={() => navigate("/courses")} size="lg">
                        Browse Catalog
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            {/* Institution Header Section */}
            <div className="bg-slate-900 dark:bg-black pt-12 pb-32 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="fluid-container relative z-10">
                    <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">
                        <Link to="/courses" className="hover:text-primary transition-colors">Marketplace</Link>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span className="text-white">Curriculum Detail</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                        <div className="lg:col-span-2 space-y-8">
                            <span className="inline-flex items-center gap-2 bg-primary/20 text-primary border border-primary/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]">
                                <span className="material-symbols-outlined text-xs">verified</span>
                                {course.category_name || "Enterprise Discipline"}
                            </span>
                            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[1.05]">
                                {course.title}
                            </h1>
                            <p className="text-slate-400 text-xl leading-relaxed italic max-w-2xl">
                                {course.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-8 pt-4">
                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                                    <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm">
                                        {course.instructor_name?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Faculty Leader</p>
                                        <p className="text-white font-bold">{course.instructor_name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-white">
                                    <div className="flex items-center gap-1 text-amber-500">
                                        <Star size={20} className="fill-amber-500" />
                                        <span className="text-xl font-black">{Number(course.average_rating || 0).toFixed(1)}</span>
                                    </div>
                                    <span className="text-slate-500 text-sm font-bold">({course.total_reviews || 0} peer reviews)</span>
                                </div>
                            </div>
                        </div>

                        {/* Floating Purchase Architecture */}
                        <div className="lg:-mb-64 z-20">
                            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl shadow-primary/10 border border-slate-100 dark:border-slate-800 sticky top-24">
                                <div className="aspect-video bg-slate-900 rounded-[2.5rem] mb-8 overflow-hidden relative group">
                                    <img
                                        src={course.thumbnail || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop`}
                                        className="w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-110"
                                        alt={course.title}
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="size-20 bg-primary rounded-full flex items-center justify-center text-white shadow-xl shadow-primary/40 group-hover:scale-110 transition-transform duration-500 cursor-pointer">
                                            <Play size={32} className="ml-1" />
                                        </div>
                                        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/60">Institutional Preview</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-end gap-2">
                                        <span className="text-5xl font-black text-slate-900 dark:text-white uppercase">₹{Number(course.price || 0).toLocaleString()}</span>
                                        <span className="text-slate-400 font-bold mb-2 uppercase text-[10px] tracking-widest">One Time Access</span>
                                    </div>

                                    <div className="space-y-3">
                                        {hasAccess ? (
                                            <Button
                                                onClick={() => navigate(`/courses/${id}/learn`)}
                                                className="w-full h-16 rounded-2xl text-lg group shadow-xl shadow-primary/20"
                                            >
                                                Start Learning
                                                <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={handlePurchase}
                                                disabled={processingPayment}
                                                className="w-full h-16 rounded-2xl text-lg group shadow-xl shadow-primary/20"
                                            >
                                                {processingPayment ? "Redirecting to Paytm..." : (user ? "Buy with Paytm" : "Sign In to Purchase")}
                                                <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">payments</span>
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-8">
                                        <FeatureItem icon="verified" label="Lifetime IP" />
                                        <FeatureItem icon="workspace_premium" label="Certification" />
                                        <FeatureItem icon="video_library" label="HD Assets" />
                                        <FeatureItem icon="support_agent" label="Elite Support" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Curriculum Body */}
            <div className="fluid-container pt-16 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    <div className="lg:col-span-2 space-y-20">
                        {/* Course Description Section */}
                        <section className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter">Curriculum Overview</h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-medium">
                                    Our proprietary frameworks are designed for professionals who demand excellence. This course provides comprehensive immersion into {course.category_name} best practices.
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 list-none p-0">
                                    {["Advanced Technical Proficiency", "Institutional Methodology", "Global Recognition", "Strategic Implementations"].map(pt => (
                                        <li key={pt} className="flex items-center gap-3 text-slate-900 dark:text-white font-bold p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                            <span className="material-symbols-outlined text-primary">check_circle</span>
                                            {pt}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        {/* Reviews Infrastructure */}
                        <section>
                            <div className="flex items-center justify-between mb-10">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Peer Evaluations</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-primary">{Number(course.average_rating).toFixed(1)}</span>
                                    <div className="flex text-amber-500">
                                        <Star size={16} className="fill-amber-500" />
                                    </div>
                                </div>
                            </div>

                            {user && hasAccess && (
                                <div className="mb-12 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-primary/20 shadow-xl shadow-primary/5">
                                    <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">rate_review</span>
                                        Submit Personal Audit
                                    </h3>
                                    <form onSubmit={handleSubmitReview} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Discipline Rating</label>
                                                <select
                                                    value={reviewForm.rating}
                                                    onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                                                >
                                                    {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} / 5 Quality Grade</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Technical Feedback</label>
                                            <textarea
                                                value={reviewForm.comment}
                                                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                                className="w-full p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl min-h-[120px] font-medium"
                                                placeholder="Provide objective feedback on curriculum quality..."
                                            />
                                        </div>
                                        <Button type="submit" disabled={submittingReview}>
                                            {submittingReview ? "Processing..." : "Submit Audit"}
                                        </Button>
                                    </form>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-6">
                                {reviews.length === 0 ? (
                                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                                        <span className="material-symbols-outlined text-4xl text-slate-200">history_edu</span>
                                        <p className="text-slate-400 font-medium mt-4">No audits registered for this curriculum yet.</p>
                                    </div>
                                ) : (
                                    reviews.map((review) => (
                                        <div key={review.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-primary/20 transition-all">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center font-black text-primary">
                                                        {review.user_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-tight">{review.user_name}</p>
                                                        <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">Verified Learner</p>
                                                    </div>
                                                </div>
                                                <div className="flex text-amber-500 gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={14}
                                                            className={i < review.rating ? "fill-amber-500" : "text-slate-200"}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400 font-medium leading-[1.6]">
                                                {review.comment}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ icon, label }: { icon: string, label: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-lg">{icon}</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{label}</span>
        </div>
    );
}
