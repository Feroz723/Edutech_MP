import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/AdminLayout";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from "recharts";


export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [data, setData] = useState<any>(null);
    const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState("30d");

    const fetchData = useCallback(async (selectedRange: string) => {
        try {
            const [analyticsRes, enrollmentsRes] = await Promise.all([
                api.get(`/admin/analytics?range=${selectedRange}`),
                api.get("/admin/enrollments/recent")
            ]);
            setData(analyticsRes.data);
            setRecentEnrollments(enrollmentsRes.data);
        } catch (err) {
            console.error("Admin dashboard load failed:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading) return;

        if (!user || user.role !== "admin") {
            navigate("/auth");
            return;
        }
        fetchData(range);
    }, [user, authLoading, navigate, range, fetchData]);

    if ((loading && !data) || authLoading) return (
        <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
    );

    const stats = [
        { label: "Total Students", value: data?.totalUsers?.toLocaleString() || "0", icon: "groups", trend: "+12%", color: "text-primary", bg: "bg-primary/10", progress: 70 },
        { label: "Total Revenue", value: `₹${data?.grossRevenue?.toLocaleString() || "0"}`, icon: "payments", trend: "+8.2%", color: "text-green-500", bg: "bg-green-500/10", progress: 62 },
        { label: "Active Courses", value: data?.totalCourses?.toString() || "0", icon: "menu_book", trend: "-2%", color: "text-orange-500", bg: "bg-orange-500/10", progress: 45, down: true },
        { label: "Total Sales", value: data?.totalSales?.toString() || "0", icon: "pending_actions", trend: "+5%", color: "text-purple-500", bg: "bg-purple-500/10", progress: 88 },
    ];

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "Good Morning";
        if (hour >= 12 && hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <AdminLayout
            title={`${getGreeting()}, ${user?.name?.split(" ")[0] || "Admin"}`}
            subtitle="Institutional Performance Overview"
        >
            <div className="py-8 space-y-8 fluid-container">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <span className="material-symbols-outlined">{stat.icon}</span>
                                </div>
                                <span className={`${stat.down ? "text-red-500" : "text-green-500"} text-sm font-bold flex items-center gap-1`}>
                                    <span className="material-symbols-outlined text-sm">{stat.down ? "trending_down" : "trending_up"}</span>
                                    {stat.trend}
                                </span>
                            </div>
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{stat.label}</p>
                            <h3 className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{stat.value}</h3>
                            <div className="mt-4 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${stat.color.replace('text-', 'bg-')} transition-all duration-1000`}
                                    style={{ width: `${stat.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Chart Widget */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white">Revenue vs. Enrollment</h4>
                            <p className="text-slate-500 text-sm font-medium">Comparison of monthly growth and financial metrics</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-primary shadow-sm shadow-primary/40"></span>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Enrollment</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/40"></span>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Revenue</span>
                            </div>
                            <select
                                value={range}
                                onChange={(e) => { setLoading(true); setRange(e.target.value); }}
                                className="text-xs font-bold border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-1.5 focus:ring-primary"
                            >
                                <option value="12m">Last 12 Months</option>
                                <option value="6m">Last 6 Months</option>
                                <option value="30d">Last 30 Days</option>
                            </select>
                        </div>
                    </div>

                    <div className="h-[350px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.revenueData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#135bec" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#135bec" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="enrollment"
                                    stroke="#135bec"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorEnroll)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    strokeDasharray="5 5"
                                    fillOpacity={1}
                                    fill="url(#colorRev)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bottom Widgets Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
                    {/* Recent Enrolled Students */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <h4 className="font-bold text-slate-900 dark:text-white">Recent Enrolled Students</h4>
                            <button className="text-primary text-sm font-bold hover:underline">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Course</th>
                                        <th className="px-6 py-4 text-center">Date</th>
                                        <th className="px-6 py-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {recentEnrollments.map((enrollment, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold">
                                                        {enrollment.student_name?.[0]}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{enrollment.student_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">{enrollment.course_title}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-400 text-center">{new Date(enrollment.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-3 py-1 ${enrollment.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"} text-[10px] font-black uppercase rounded-full`}>
                                                    {enrollment.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {recentEnrollments.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">No recent enrollments found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Popular Courses */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <h4 className="font-bold text-slate-900 dark:text-white">Popular Courses</h4>
                            <button className="material-symbols-outlined text-slate-400">more_horiz</button>
                        </div>
                        <div className="p-8 space-y-8">
                            {(data?.topCourses || []).map((course: any, idx: number) => (
                                <div key={idx} className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{course.title}</span>
                                        <span className="text-slate-500 font-bold">₹{Number(course.revenue).toLocaleString()}</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (Number(course.revenue) / (data?.grossRevenue || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {(!data?.topCourses || data.topCourses.length === 0) && (
                                <p className="text-center text-slate-400 text-sm italic py-10">No course data available.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
