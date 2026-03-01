import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import api from "@/lib/api";
import {
    Users,
    TrendingUp,
    BookOpen,
    IndianRupee,
    Search,
    Download,
    MapPin,
    ArrowUpRight,
    ArrowDownRight,
    GraduationCap,
    School
} from "lucide-react";
import GeoMap from "@/components/analytics/GeoMap";

interface StudentData {
    id: string;
    registration_date: string;
    name: string;
    email: string;
    contact_number?: string;
    qualification?: string;
    city?: string;
    state?: string;
    institute_name?: string;
    courses?: string;
    revenue: number;
}

interface KPIStats {
    totalRevenue: number;
    newRegistrationsToday: number;
    totalUsers: number;
    activeCourses: number;
    avgRevenuePerUser: number;
}

interface GeoStat {
    state: string;
    count: number;
    percentage: number;
}

const AdminAnalytics: React.FC = () => {
    const [students, setStudents] = useState<StudentData[]>([]);
    const [kpis, setKpis] = useState<KPIStats | null>(null);
    const [geoStats, setGeoStats] = useState<GeoStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [analyticsRes, geoRes] = await Promise.all([
                api.get("/admin/detailed-analytics"),
                api.get("/admin/geo-distribution")
            ]);
            setStudents(analyticsRes.data.students);
            setKpis(analyticsRes.data.kpis);
            setGeoStats(geoRes.data);
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
    (s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.institute_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const exportToExcel = () => {
        const headers = ["ID", "Registration Date", "Name", "Email", "Contact", "Qualification", "Institute", "City", "State", "Courses", "Revenue"];
        const csvContent = [
            headers.join(","),
            ...filteredStudents.map(s => [
                s.id,
                new Date(s.registration_date).toLocaleDateString(),
                `"${s.name}"`,
                `"${s.email}"`,
                `"${s.contact_number || ""}"`,
                `"${s.qualification || ""}"`,
                `"${s.institute_name || ""}"`,
                `"${s.city || ""}"`,
                `"${s.state || ""}"`,
                `"${s.courses || ""}"`,
                s.revenue
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Institutional_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };


    return (
        <AdminLayout title="Institutional Analytics" subtitle="Real-time student demographics & revenue insights">
            <div className="space-y-8 pb-12">

                {/* KPI Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        label="Total Revenue"
                        value={formatCurrency(kpis?.totalRevenue || 0)}
                        trend="+12.5%"
                        trendType="up"
                        icon={<IndianRupee className="w-6 h-6 text-emerald-500" />}
                        bgColor="bg-emerald-50"
                    />
                    <MetricCard
                        label="New Registrations"
                        value={String(kpis?.newRegistrationsToday || 0)}
                        trend="+8%"
                        trendType="up"
                        icon={<Users className="w-6 h-6 text-blue-500" />}
                        bgColor="bg-blue-50"
                    />
                    <MetricCard
                        label="Active Courses"
                        value={String(kpis?.activeCourses || 0)}
                        trend="+4"
                        trendType="up"
                        icon={<BookOpen className="w-6 h-6 text-purple-500" />}
                        bgColor="bg-purple-50"
                    />
                    <MetricCard
                        label="Avg. Revenue / User"
                        value={formatCurrency(kpis?.avgRevenuePerUser || 0)}
                        trend="-2.4%"
                        trendType="down"
                        icon={<TrendingUp className="w-6 h-6 text-amber-500" />}
                        bgColor="bg-amber-50"
                    />
                </div>

                {/* Charts and Geo Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[500px]">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <MapPin className="text-primary" size={20} />
                                    Student Geographic Distribution
                                </h3>
                                <p className="text-sm text-slate-400 font-medium mt-1">Real-time intensity of institutional scholars across India</p>
                            </div>
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Live Map
                            </div>
                        </div>
                        <div className="h-[400px] w-full">
                            <GeoMap data={geoStats} />
                        </div>
                    </div>

                    {/* Stats Summary Panel */}
                    <div className="bg-primary/5 dark:bg-primary/10 rounded-[2.5rem] p-8 border border-primary/10 flex flex-col justify-between">
                        <div>
                            <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/30">
                                <TrendingUp size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">
                                Revenue Surge Detected 🚀
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 font-bold mt-4 text-sm leading-relaxed">
                                Your institutional platform has seen a 14% increase in premium registrations this week specifically from <span className="text-primary">Karnataka</span> and <span className="text-primary">Maharashtra</span>.
                            </p>
                        </div>
                        <div className="mt-8 pt-8 border-t border-primary/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Met</span>
                                <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">92%</span>
                            </div>
                            <div className="h-2 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: '92%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Student Table Section */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">Institutional Data Governance</h3>
                            <p className="text-sm text-slate-400 font-medium mt-1">Granular student tracking and compliance</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input
                                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 pl-12 pr-6 text-sm font-bold text-slate-700 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-primary/5 transition-all w-full md:w-[300px]"
                                    placeholder="Search by name, email or institute..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={exportToExcel}
                                className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <Download size={18} />
                                EXPORT TO EXCEL
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registration</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student Identity</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Institutional Details</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Location</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Enrolled Courses</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-slate-400 font-black uppercase tracking-widest text-xs">Generating report...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <span className="text-slate-400 font-bold">No students found matching your criteria</span>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-black text-slate-700 dark:text-slate-200">
                                                    {new Date(student.registration_date).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                                                    {new Date(student.registration_date).toLocaleTimeString('en-IN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-800 dark:text-white group-hover:text-primary transition-colors">{student.name}</div>
                                                        <div className="text-xs font-bold text-slate-400 mt-0.5">{student.email}</div>
                                                        <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 mt-1">
                                                            <GraduationCap size={10} />
                                                            {student.qualification || 'Not Specified'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300">
                                                    <School size={16} className="text-slate-300" />
                                                    {student.institute_name || 'Individual'}
                                                </div>
                                                <div className="text-xs font-bold text-slate-400 mt-1">{student.contact_number || 'No Contact'}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-sm font-black text-slate-700 dark:text-slate-300">
                                                    <MapPin size={14} className="text-slate-300" />
                                                    {student.city || 'NA'}, {student.state || 'Global'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="max-w-[200px] truncate text-xs font-bold text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                                    {student.courses || 'No Active Courses'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-black text-primary bg-primary/5 px-4 py-2 rounded-full inline-block border border-primary/10">
                                                    {formatCurrency(student.revenue)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

interface MetricCardProps {
    label: string;
    value: string;
    trend: string;
    trendType: 'up' | 'down';
    icon: React.ReactNode;
    bgColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, trend, trendType, icon, bgColor }) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-sm hover:scale-[1.02] hover:shadow-xl hover:border-primary/20 transition-all group">
        <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">{label}</span>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-black text-xs ${trendType === 'up' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                {trendType === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {trend}
            </div>
        </div>
        <div className="flex items-end justify-between">
            <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-none">{value}</h2>
            <div className={`w-14 h-14 ${bgColor} rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
        </div>
    </div>
);

export default AdminAnalytics;
