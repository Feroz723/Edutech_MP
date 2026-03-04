import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";

const avatars = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuANWcU-JEtWmv-2NWZ0f-4d8UxLGJwOwHXffyx55qQdxku45Sh74xrpYQVxLugtBGV0Cbvex23xHg7vzuB_HtcsfCahfmQ8QDPHsw6m_V0po_1Y6muUBcsUeRWcrZx6c_JgMjk_gdxaRXyfMFCcDycll5fGWtKWRuN_ue2bl8XRJTGPGE-NUP5MupnQAN-iZrqznUqUIRFYog8aKL9puwD3MHmlv0KdppEUnRhr2kVTTHPkIljV64KMXFyDzRf3Jx1N1poT6aBmmpxx",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCQmFiFApUpJM-L80oEG6gQ03pNNtREjzVwW-V05fCOivwv_LppImvWoMh77ISmLlbjVWC1rYdWOJu7C9R6Va7ipqZ8RO2LG_0_fDa9hfeRa0N87iEl-GqufWM6FyiJWt9jLX6_yQRLga_Hp1EaL4LXqBy6f68_1SdZPJnKeVpTr-LzBFjUpDtMrNx0WsPA2_mzgHj6GmEX7cTmAcQiqgurzO3CvP4PNq8EjRPRD950ML6JB59pQvOYgTQurUm_0PbLHOFi6ok_dQf9",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBfefSQfnC76LQZy2YC5JyOGzMOaI17cBWQQ_qvYuUJYXHyMT19DkwR1ACMY_A2y3QEB7uwLp2KF-dHu28iL_Nuphr2iR076ptlNA9a-wWEy97Bd9kFe2r1s0_BsqGtAiyzvknho9oJnWKfBJIZjVnWDJVu_HVH8Y2GHQcbWkKdD_y9FkvOlMDoZVj0V9TVJwr8RMt70NBSEbMgmUtQv2m1w31LTL12h8nEdq6vXCWlYToObj2d_47_0e0rIDmWcihCn_9Ao6LcoghM"
];

export default function Home() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Auto-Redirect: If logged in, dive straight into learning
    useEffect(() => {
        if (!authLoading && user) {
            navigate(`/${user.role}/dashboard`);
        }
    }, [user, authLoading, navigate]);

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display">
            <main className="flex-grow">
                {/* Hero Section */}
                <section className="relative py-16 lg:py-24 overflow-hidden">
                    <div className="fluid-container grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="flex flex-col gap-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider w-fit animate-in">
                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                <span>The Future of Learning</span>
                            </div>
                            <h2 className="text-5xl lg:text-7xl font-black leading-tight tracking-tight text-slate-900 dark:text-white animate-in">
                                Unlock Your Potential with <span className="text-primary italic">Expert-Led</span> Courses
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed animate-in">
                                Learn from industry leaders and gain the skills you need to succeed in today's competitive job market. Access 2,000+ premium courses today.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 animate-in">
                                {!authLoading && user ? (
                                    <Button
                                        size="lg"
                                        className="px-8 py-6 h-auto text-base font-bold rounded-xl shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
                                        onClick={() => navigate(`/${user.role}/dashboard`)}
                                    >
                                        <span className="material-symbols-outlined mr-2">dashboard</span>
                                        Go to Dashboard
                                    </Button>
                                ) : (
                                    <Button
                                        size="lg"
                                        className="px-8 py-6 h-auto text-base font-bold rounded-xl shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
                                        onClick={() => navigate("/courses")}
                                    >
                                        Explore Courses
                                    </Button>
                                )}

                            </div>
                            <div className="flex items-center gap-4 pt-4 animate-in">
                                <div className="flex -space-x-3">
                                    {avatars.map((url, i) => (
                                        <img
                                            key={i}
                                            className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                                            src={url}
                                            alt="Student Avatar"
                                            loading="lazy"
                                            width="40"
                                            height="40"
                                        />
                                    ))}
                                </div>
                                <p className="text-sm text-slate-500 font-medium">Joined by 15k+ active learners</p>
                            </div>
                        </div>
                        <div className="relative group">
                            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors"></div>
                            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors"></div>
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800 transform group-hover:scale-[1.02] transition-transform duration-500">
                                <img
                                    className="w-full aspect-video object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1vR8myYaVHbOghHRpgcCCa_AbOJzSUqIAdrSas9HzMC1uXRIwOtQKe5w2Iht7679eqGssptbHF19uflUA4U2D74DdKg-8dkb2ESvIJVajqZNj4cRKgLlVOn7v_vDSfRdbCwBVSB1H01AO21ekMj6IIi7B7rUGdDkGR7Tc68oAR0E33x7WVyzcndlgEGTIiD68z0qVbID76hp0BT7Dtt7aEjDwhrTdSVIf0kFO0gz1f6LXEgiepSMpsJBDTmKeogZzPegYU0l-zWUR"
                                    alt="Students studying"
                                    fetchPriority="high"
                                    loading="eager"
                                    width="1200"
                                    height="675"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories Section */}
                <section className="py-20 bg-white dark:bg-slate-900/50">
                    <div className="fluid-container">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                            <div className="max-w-2xl">
                                <h3 className="text-3xl font-bold mb-4">Explore Popular Categories</h3>
                                <p className="text-slate-600 dark:text-slate-400">Whatever your goal, we have a category for you. Dive into our most popular paths selected by thousands of students.</p>
                            </div>
                            <button
                                onClick={() => navigate("/courses")}
                                className="text-primary font-bold flex items-center gap-1 hover:underline"
                            >
                                View all categories <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <CategoryCard icon="code" title="Programming" desc="Python, Javascript, Cloud computing and more." count="120+ Courses" />
                            <CategoryCard icon="payments" title="Business" desc="Management, Finance, and Entrepreneurship." count="85+ Courses" />
                            <CategoryCard icon="palette" title="Design" desc="UI/UX, Graphic design, and Motion graphics." count="60+ Courses" />
                            <CategoryCard icon="campaign" title="Marketing" desc="Social media, SEO, and Brand strategy." count="45+ Courses" />
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20">
                    <div className="fluid-container">
                        <div className="flex flex-col gap-4 text-center items-center mb-16">
                            <h3 className="text-4xl font-black">Why Choose Our Platform</h3>
                            <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-lg">We provide a comprehensive learning experience tailored to your professional goals, ensuring you have everything you need to thrive.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FeatureCard
                                icon="verified_user"
                                title="Expert Instructors"
                                desc="Learn from real-world experts with years of experience in leading tech and business companies."
                            />
                            <FeatureCard
                                icon="schedule"
                                title="Flexible Learning"
                                desc="Study at your own pace, anytime and anywhere. Lifetime access to all course materials and updates."
                            />
                            <FeatureCard
                                icon="workspace_premium"
                                title="Certificates"
                                desc="Earn industry-recognized certificates upon completion that you can share with your network."
                            />
                        </div>
                    </div>
                </section>

                {/* Global CTA Section */}
                <section className="py-20">
                    <div className="fluid-container">
                        <div className="relative bg-primary rounded-[3rem] overflow-hidden p-12 lg:p-24 flex flex-col items-center text-center text-white shadow-2xl shadow-primary/20">
                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
                                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
                            </div>
                            <h3 className="text-4xl lg:text-5xl font-black mb-6 relative z-10 leading-tight">Ready to start your journey?</h3>
                            <p className="text-white/80 text-xl mb-12 max-w-2xl relative z-10">Join over 100,000 students learning from the world's best instructors.</p>
                            <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full sm:w-auto">
                                <button
                                    onClick={() => navigate(user ? `/${user.role}/dashboard` : "/auth?mode=signup")}
                                    className="px-10 py-5 bg-white text-primary font-bold rounded-2xl shadow-lg hover:translate-y-[-2px] transition-all"
                                >
                                    Get Started Now
                                </button>
                                <button
                                    onClick={() => navigate("/courses")}
                                    className="px-10 py-5 bg-primary border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
                                >
                                    Browse Courses
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function CategoryCard({ icon, title, desc, count }: { icon: string, title: string, desc: string, count: string }) {
    return (
        <div className="group p-8 rounded-[2rem] bg-background-light dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <span className="material-symbols-outlined text-3xl">{icon}</span>
            </div>
            <h4 className="text-xl font-bold mb-3">{title}</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">{desc}</p>
            <div className="text-primary text-sm font-bold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                {count} <span className="material-symbols-outlined text-sm">trending_up</span>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
    return (
        <div className="flex flex-col items-center text-center p-10 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center text-primary mb-8 border border-primary/10">
                <span className="material-symbols-outlined text-4xl">{icon}</span>
            </div>
            <h4 className="text-2xl font-bold mb-4">{title}</h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg">{desc}</p>
        </div>
    );
}
