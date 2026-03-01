import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
    DollarSign,
    TrendingUp,
    Calendar,
    IndianRupee,
    BookOpen,
    Download
} from "lucide-react";

interface Earning {
    id: string;
    course_id: string;
    course_title: string;
    gross_amount: number;
    instructor_share: number;
    platform_fee: number;
    created_at: string;
}

interface Stats {
    totalEarnings: number;
    monthlyEarnings: number;
    totalSales: number;
    pendingPayouts: number;
}

export default function InstructorEarnings() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [earnings, setEarnings] = useState<Earning[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalEarnings: 0,
        monthlyEarnings: 0,
        totalSales: 0,
        pendingPayouts: 0
    });
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("30d");

    useEffect(() => {
        if (!user || user.role !== "instructor") {
            navigate("/");
            return;
        }

        fetchData();
    }, [user, navigate, dateRange]);

    const fetchData = async () => {
        try {
            const [statsRes, earningsRes] = await Promise.all([
                api.get("/instructor/stats"),
                api.get(`/instructor/earnings?range=${dateRange}`)
            ]);

            setStats({
                totalEarnings: statsRes.data.totalEarnings || 0,
                monthlyEarnings: statsRes.data.monthlyEarnings || 0,
                totalSales: statsRes.data.totalSales || 0,
                pendingPayouts: statsRes.data.pendingPayouts || 0
            });

            setEarnings(earningsRes.data || []);
        } catch (error) {
            showToast("Failed to load earnings data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        // Generate CSV export
        const headers = ["Date", "Course", "Gross Amount", "Your Share", "Platform Fee"];
        const rows = earnings.map(e => [
            new Date(e.created_at).toLocaleDateString(),
            e.course_title,
            `₹${e.gross_amount}`,
            `₹${e.instructor_share}`,
            `₹${e.platform_fee}`
        ]);

        const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `earnings-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        showToast("Earnings exported successfully", "success");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-1/4" />
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-slate-200 rounded" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fluid-container py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Earnings Dashboard</h1>
                    <p className="text-slate-500 mt-2">Track your revenue and payouts</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-300"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="all">All time</option>
                    </select>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 rounded-xl">
                            <DollarSign size={20} className="text-emerald-600" />
                        </div>
                        <span className="text-slate-500 font-medium">Total Earnings</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">
                        ₹{stats.totalEarnings.toLocaleString()}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <TrendingUp size={20} className="text-blue-600" />
                        </div>
                        <span className="text-slate-500 font-medium">This Month</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">
                        ₹{stats.monthlyEarnings.toLocaleString()}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 rounded-xl">
                            <BookOpen size={20} className="text-purple-600" />
                        </div>
                        <span className="text-slate-500 font-medium">Total Sales</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{stats.totalSales}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 rounded-xl">
                            <Calendar size={20} className="text-amber-600" />
                        </div>
                        <span className="text-slate-500 font-medium">Pending Payouts</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">
                        ₹{stats.pendingPayouts.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Earnings Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900">Transaction History</h2>
                </div>

                {earnings.length === 0 ? (
                    <div className="p-12 text-center">
                        <DollarSign size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">No earnings yet. Start selling courses to see your revenue!</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left p-4 font-semibold text-slate-600">Date</th>
                                <th className="text-left p-4 font-semibold text-slate-600">Course</th>
                                <th className="text-right p-4 font-semibold text-slate-600">Gross</th>
                                <th className="text-right p-4 font-semibold text-slate-600">Your Share</th>
                                <th className="text-right p-4 font-semibold text-slate-600">Platform Fee</th>
                            </tr>
                        </thead>
                        <tbody>
                            {earnings.map((earning) => (
                                <tr key={earning.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            {new Date(earning.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-medium text-slate-900">{earning.course_title}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="flex items-center justify-end gap-1 text-slate-600">
                                            <IndianRupee size={14} />
                                            {Number(earning.gross_amount).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="flex items-center justify-end gap-1 font-bold text-emerald-600">
                                            <IndianRupee size={14} />
                                            {Number(earning.instructor_share).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className="flex items-center justify-end gap-1 text-slate-400">
                                            <IndianRupee size={14} />
                                            {Number(earning.platform_fee).toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Payout Info */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <DollarSign size={20} className="text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900">Payout Schedule</p>
                        <p className="text-sm text-blue-700 mt-1">
                            Earnings are calculated at 70% of course price. Payouts are processed on the 1st and 15th of each month.
                            Minimum payout amount is ₹1,000.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
