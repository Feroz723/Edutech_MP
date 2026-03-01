import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
    Activity,
    AlertTriangle,
    Info,
    AlertCircle,
    Search,
    RefreshCw,
    Calendar,
    Clock
} from "lucide-react";

interface Log {
    id: string;
    level: string;
    message: string;
    timestamp: string;
    source?: string;
}

export default function AdminLogs() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [levelFilter, setLevelFilter] = useState("all");

    useEffect(() => {
        if (!user || user.role !== "admin") {
            navigate("/");
            return;
        }

        fetchLogs();
    }, [user, navigate]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/logs");
            setLogs(res.data);
        } catch (error) {
            showToast("Failed to load logs", "error");
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(l => {
        const matchesSearch = l.message?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = levelFilter === "all" || l.level === levelFilter;
        return matchesSearch && matchesLevel;
    });

    const getLevelIcon = (level: string) => {
        switch (level) {
            case "error": return <AlertCircle size={16} className="text-red-600" />;
            case "warn": return <AlertTriangle size={16} className="text-amber-600" />;
            default: return <Info size={16} className="text-blue-600" />;
        }
    };

    const getLevelBadgeStyle = (level: string) => {
        switch (level) {
            case "error": return "bg-red-100 text-red-700";
            case "warn": return "bg-amber-100 text-amber-700";
            default: return "bg-blue-100 text-blue-700";
        }
    };

    // Generate some mock logs for demonstration
    const mockLogs: Log[] = [
        { id: "1", level: "info", message: "Server started successfully on port 5000", timestamp: new Date().toISOString(), source: "server" },
        { id: "2", level: "info", message: "Database connection established", timestamp: new Date(Date.now() - 60000).toISOString(), source: "database" },
        { id: "3", level: "info", message: "User admin@edutech.com logged in", timestamp: new Date(Date.now() - 120000).toISOString(), source: "auth" },
        { id: "4", level: "warn", message: "High memory usage detected: 85%", timestamp: new Date(Date.now() - 180000).toISOString(), source: "system" },
        { id: "5", level: "info", message: "New course created: Advanced React Development", timestamp: new Date(Date.now() - 240000).toISOString(), source: "course" },
        { id: "6", level: "info", message: "Payment received: ₹2,499 for course ID 123", timestamp: new Date(Date.now() - 300000).toISOString(), source: "payment" },
        { id: "7", level: "error", message: "Failed to send email notification to user@example.com", timestamp: new Date(Date.now() - 360000).toISOString(), source: "email" },
        { id: "8", level: "info", message: "User student@edutech.com registered via Google OAuth", timestamp: new Date(Date.now() - 420000).toISOString(), source: "auth" },
        { id: "9", level: "warn", message: "Rate limit exceeded for IP 192.168.1.100", timestamp: new Date(Date.now() - 480000).toISOString(), source: "security" },
        { id: "10", level: "info", message: "Course published: Python for Data Science", timestamp: new Date(Date.now() - 540000).toISOString(), source: "course" },
    ];

    const displayLogs = logs.length > 0 ? filteredLogs : mockLogs.filter(l => {
        const matchesSearch = l.message?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = levelFilter === "all" || l.level === levelFilter;
        return matchesSearch && matchesLevel;
    });

    return (
        <AdminLayout
            title="Platform Audit Logs"
            subtitle="Monitor institutional events and security protocols"
        >
            <div className="space-y-10">
                {/* Header Actions */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={fetchLogs}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-2">
                            <Info size={20} className="text-blue-600" />
                            <span className="text-slate-500 font-medium">Info Logs</span>
                        </div>
                        <p className="text-3xl font-bold">{mockLogs.filter(l => l.level === "info").length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle size={20} className="text-amber-600" />
                            <span className="text-slate-500 font-medium">Warnings</span>
                        </div>
                        <p className="text-3xl font-bold">{mockLogs.filter(l => l.level === "warn").length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-2">
                            <AlertCircle size={20} className="text-red-600" />
                            <span className="text-slate-500 font-medium">Errors</span>
                        </div>
                        <p className="text-3xl font-bold">{mockLogs.filter(l => l.level === "error").length}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                        <select
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value)}
                            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-300"
                        >
                            <option value="all">All Levels</option>
                            <option value="info">Info</option>
                            <option value="warn">Warnings</option>
                            <option value="error">Errors</option>
                        </select>
                    </div>
                </div>

                {/* Logs List */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="divide-y divide-slate-100">
                        {displayLogs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {getLevelIcon(log.level)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${getLevelBadgeStyle(log.level)}`}>
                                                {log.level}
                                            </span>
                                            {log.source && (
                                                <span className="text-xs text-slate-400 font-mono">
                                                    [{log.source}]
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-700 font-medium">{log.message}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(log.timestamp).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {displayLogs.length === 0 && (
                        <div className="p-12 text-center">
                            <Activity size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500">No logs found matching your criteria</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
