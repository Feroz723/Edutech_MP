import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";

export default function InstructorDashboard() {
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user || user.role !== "instructor") {
            navigate("/auth");
            return;
        }

        const fetchStats = async () => {
            try {
                const res = await api.get("/instructor/stats");
                setStats(res.data);
            } catch (error) {
                showToast("Failed to load dashboard metrics", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user, authLoading, navigate, showToast]);

    if ((loading && !stats) || authLoading) return (
        <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
    );

    const metrics = [
        { label: "Active Courses", value: stats?.totalCourses || 0, icon: "menu_book", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
        { label: "Total Students", value: stats?.totalStudents || 0, icon: "groups", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
        { label: "Total Earnings", value: `₹${stats?.totalEarnings?.toLocaleString() || 0}`, icon: "payments", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
        { label: "Avg. Rating", value: "4.8", icon: "star", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    ];

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
                                <span className="text-slate-900 dark:text-white">Workspace Overview</span>
                            </nav>
                            <h1 className="text-3xl font-black tracking-tight">Instructor Dashboard</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage your professional curriculums and track student engagement</p>
                        </div>

                        <Button onClick={() => navigate("/instructor/courses/create")}>
                            <span className="material-symbols-outlined mr-2">add</span>
                            Create New Course
                        </Button>
                    </header>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {metrics.map((m) => (
                            <Card key={m.label}>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`p-3 rounded-xl ${m.bg} ${m.color}`}>
                                            <span className="material-symbols-outlined">{m.icon}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{m.label}</span>
                                    </div>
                                    <div className="text-3xl font-black tracking-tight">{m.value}</div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card>
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-bold">Revenue Insights</h3>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <span className="material-symbols-outlined text-xs">trending_up</span>
                                        +12.5% Growth
                                    </div>
                                </div>
                                <div className="h-64 w-full">
                                    {stats?.dailyEarnings?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={stats.dailyEarnings}>
                                                <defs>
                                                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#135bec" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#135bec" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(str) => new Date(str).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(val) => `₹${val}`}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "#fff",
                                                        borderRadius: "12px",
                                                        border: "1px solid #e2e8f0",
                                                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="earnings"
                                                    stroke="#135bec"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorEarnings)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                                            <span className="material-symbols-outlined text-slate-300 text-5xl mb-4">insert_chart</span>
                                            <p className="text-sm text-slate-400 font-medium">Accumulating revenue data for visualization</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-8">
                                <h3 className="text-lg font-bold mb-6">Platform Notifications</h3>
                                <div className="space-y-4">
                                    <NotificationItem
                                        icon="payments"
                                        title="Payout Processed"
                                        desc="Your earnings for January have been transferred."
                                        time="2h ago"
                                        color="text-emerald-500"
                                    />
                                    <NotificationItem
                                        icon="school"
                                        title="New Enrollment"
                                        desc="12 new students enrolled in 'Advanced React Patterns'."
                                        time="5h ago"
                                        color="text-blue-500"
                                    />
                                    <NotificationItem
                                        icon="reviews"
                                        title="Positive Review"
                                        desc="Sarah Jenkins left a 5-star rating on your course."
                                        time="1d ago"
                                        color="text-amber-500"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

function NotificationItem({ icon, title, desc, time, color }: any) {
    return (
        <div className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
            <div className={`size-10 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center ${color}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold">{title}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{time}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}
