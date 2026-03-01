import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
    Search,
    Bell,
    Mail,
    TrendingUp,
    TrendingDown,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Filter
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import AdminLayout from "@/components/AdminLayout";

interface Transaction {
    id: string;
    user_name: string;
    course_title: string;
    total_amount: number;
    status: string;
    created_at: string;
}

export default function AdminOrders() {
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingPayouts: 0,
        netProfit: 0,
        chartData: []
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== "admin") {
            navigate("/");
            return;
        }

        fetchData();
    }, [user, authLoading, navigate]);

    const fetchData = async () => {
        try {
            const [ordersRes, statsRes] = await Promise.all([
                api.get("/admin/orders"),
                api.get("/admin/finance-stats")
            ]);
            setTransactions(ordersRes.data);
            setStats(statsRes.data);
        } catch (error) {
            showToast("Failed to load financial data", "error");
        } finally {
            setLoading(false);
        }
    };

    if (loading || authLoading) return (
        <div className="flex h-screen items-center justify-center bg-background-light">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
    );

    return (
        <AdminLayout
            title="Finance & Revenue"
            subtitle="Platform gross income and transaction history"
        >
            <div className="space-y-10">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-primary transition-all relative">
                        <Bell size={20} />
                        <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-primary transition-all">
                        <Mail size={20} />
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <MetricCard
                        label="Total Revenue"
                        value={`₹${stats.totalRevenue.toLocaleString()}`}
                        trend="+100%"
                        trendType="up"
                        subtext="Live platform gross income"
                    />
                    <MetricCard
                        label="Net Profit"
                        value={`₹${stats.netProfit.toLocaleString()}`}
                        trend="+100%"
                        trendType="up"
                        subtext="Revenue after instructor shares"
                    />
                    <MetricCard
                        label="Pending Payouts"
                        value={`₹${stats.pendingPayouts.toLocaleString()}`}
                        trend="+0%"
                        trendType="up"
                        subtext="Outstanding earnings to process"
                    />
                </div>

                {/* Chart and Date Range Row */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-10">
                    <div className="lg:col-span-3 bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Revenue Trends</h3>
                                <p className="text-slate-400 text-sm font-medium mt-1">Monthly overview of generated income</p>
                            </div>
                            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                                <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">6 Months</button>
                                <button className="px-4 py-2 text-xs font-bold bg-white text-slate-900 rounded-lg shadow-sm">1 Year</button>
                            </div>
                        </div>

                        <div className="h-[350px] w-full mt-4 -ml-6">
                            <ResponsiveContainer width="105%" height="100%">
                                <AreaChart data={stats.chartData.length > 0 ? stats.chartData : [{ month: 'N/A', revenue: 0 }]}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                        dy={15}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#1e3a8a"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Calendar / Date Range Mockup */}
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-black text-slate-900">Date Range</h3>
                            <Calendar size={20} className="text-slate-400" />
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
                                <span className="text-sm font-black text-slate-900">October 2023</span>
                                <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronRight size={16} /></button>
                            </div>

                            <div className="grid grid-cols-7 text-center gap-y-4">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                                    <span key={day} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</span>
                                ))}
                                {/* Simplified Calendar Days */}
                                {[1, 2, 3, 4].map(day => (
                                    <span key={day} className="text-sm font-bold text-slate-400">{day}</span>
                                ))}
                                <div className="bg-primary/10 rounded-l-lg py-2">
                                    <span className="text-sm font-bold text-primary">5</span>
                                </div>
                                <div className="bg-primary py-2 shadow-lg shadow-primary/20 relative z-10">
                                    <span className="text-sm font-bold text-white">6</span>
                                </div>
                                <div className="bg-primary/10 rounded-r-lg py-2">
                                    <span className="text-sm font-bold text-primary">7</span>
                                </div>
                                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map(day => (
                                    <span key={day} className="text-sm font-bold text-slate-950">{day}</span>
                                ))}
                            </div>

                            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg mt-4">
                                Apply Custom Range
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
                    <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-900">Recent Transactions</h3>
                            <p className="text-slate-400 text-sm font-medium mt-1">List of latest course purchases</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                                Status: All <ChevronRight size={14} className="rotate-90" />
                            </div>
                            <button className="flex items-center gap-2 px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                                <Filter size={14} /> Filter
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                    <th className="px-10 py-6">Transaction ID</th>
                                    <th className="px-10 py-6">Student</th>
                                    <th className="px-10 py-6">Course</th>
                                    <th className="px-10 py-6">Amount</th>
                                    <th className="px-10 py-6">Date</th>
                                    <th className="px-10 py-6 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.slice(0, 3).map((txn) => (
                                    <tr key={txn.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none">
                                        <td className="px-10 py-8">
                                            <span className="text-sm font-black text-primary cursor-pointer hover:underline">#TXN-{txn.id.slice(0, 5).toUpperCase()}</span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shadow-sm">
                                                    <img
                                                        src={`https://i.pravatar.cc/150?u=${txn.user_name}`}
                                                        alt={txn.user_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">{txn.user_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="text-sm font-medium text-slate-500 line-clamp-1">{txn.course_title}</span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="text-sm font-black text-slate-900">${Number(txn.total_amount).toFixed(2)}</span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="text-sm font-bold text-slate-400">{new Date(txn.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${txn.status === 'completed'
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-amber-100 text-amber-600'
                                                }`}>
                                                {txn.status === 'completed' ? 'Success' : 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function MetricCard({ label, value, trend, trendType, subtext }: any) {
    return (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl hover:border-primary/20 group">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">{label}</span>
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-black text-xs ${trendType === 'up' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'
                    }`}>
                    {trendType === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {trend}
                </div>
            </div>
            <div className="text-4xl font-black text-slate-900 tracking-tighter mb-4">{value}</div>
            <p className="text-slate-400 text-sm font-medium italic">{subtext}</p>
        </div>
    );
}
