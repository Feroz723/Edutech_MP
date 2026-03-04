import { useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
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
    Clock
} from "lucide-react";

type LogLevel = "info" | "warn" | "error";

interface AuditLogApi {
    id: string;
    action: string;
    details?: any;
    timestamp: string;
    user_name?: string;
}

interface LogViewModel {
    id: string;
    level: LogLevel;
    message: string;
    timestamp: string;
    source: string;
    actor: string;
}

function inferLevel(action: string): LogLevel {
    const normalized = action.toLowerCase();
    if (normalized.includes("delete") || normalized.includes("suspend") || normalized.includes("refund")) return "warn";
    if (normalized.includes("fail") || normalized.includes("error")) return "error";
    return "info";
}

function inferSource(action: string, details?: any): string {
    if (details?.source) return String(details.source);
    const prefix = action.split("_")[0];
    return prefix ? prefix.toLowerCase() : "system";
}

function humanizeAction(action: string, details?: any) {
    const base = action
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    if (details?.title) return `${base} — ${details.title}`;
    if (details?.targetUserId) return `${base} — user ${details.targetUserId}`;
    if (details?.courseId) return `${base} — course ${details.courseId}`;

    return base;
}

export default function AdminLogs() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [logs, setLogs] = useState<LogViewModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [levelFilter, setLevelFilter] = useState<"all" | LogLevel>("all");
    const [autoRefresh, setAutoRefresh] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/logs");
            const mapped = (res.data as AuditLogApi[]).map((log) => ({
                id: log.id,
                level: inferLevel(log.action),
                message: humanizeAction(log.action, log.details),
                timestamp: log.timestamp,
                source: inferSource(log.action, log.details),
                actor: log.user_name || "System",
            }));
            setLogs(mapped);
        } catch {
            showToast("Failed to load logs", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (!user || user.role !== "admin") {
            navigate("/");
            return;
        }

        fetchLogs();
    }, [user, navigate, fetchLogs]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchLogs, 30000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchLogs]);

    const filteredLogs = useMemo(() => {
        return logs.filter((l) => {
            const q = searchTerm.toLowerCase();
            const matchesSearch =
                l.message.toLowerCase().includes(q)
                || l.actor.toLowerCase().includes(q)
                || l.source.toLowerCase().includes(q);
            const matchesLevel = levelFilter === "all" || l.level === levelFilter;
            return matchesSearch && matchesLevel;
        });
    }, [logs, searchTerm, levelFilter]);

    const stats = useMemo(() => ({
        info: logs.filter((l) => l.level === "info").length,
        warn: logs.filter((l) => l.level === "warn").length,
        error: logs.filter((l) => l.level === "error").length,
    }), [logs]);

    const getLevelIcon = (level: LogLevel) => {
        switch (level) {
            case "error": return <AlertCircle size={16} className="text-red-600" />;
            case "warn": return <AlertTriangle size={16} className="text-amber-600" />;
            default: return <Info size={16} className="text-blue-600" />;
        }
    };

    const getLevelBadgeStyle = (level: LogLevel) => {
        switch (level) {
            case "error": return "bg-red-100 text-red-700";
            case "warn": return "bg-amber-100 text-amber-700";
            default: return "bg-blue-100 text-blue-700";
        }
    };

    return (
        <AdminLayout
            title="Platform Audit Logs"
            subtitle="Monitor institutional events and security protocols"
        >
            <div className="space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by action, actor, source..."
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <select
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value as any)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold"
                        >
                            <option value="all">All Levels</option>
                            <option value="info">Info</option>
                            <option value="warn">Warn</option>
                            <option value="error">Error</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setAutoRefresh((v) => !v)}
                            className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${autoRefresh ? "bg-primary text-white border-primary" : "bg-white border-slate-200 text-slate-700"}`}
                        >
                            Auto-refresh {autoRefresh ? "On" : "Off"}
                        </button>
                        <button
                            onClick={fetchLogs}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard icon={<Info size={20} className="text-blue-600" />} label="Info Logs" value={stats.info} />
                    <StatCard icon={<AlertTriangle size={20} className="text-amber-600" />} label="Warning Logs" value={stats.warn} />
                    <StatCard icon={<AlertCircle size={20} className="text-red-600" />} label="Error Logs" value={stats.error} />
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Activity size={20} className="text-primary" />
                            System Events
                        </h3>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {filteredLogs.length} records
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
                        {!loading && filteredLogs.length === 0 ? (
                            <div className="p-16 text-center">
                                <Clock className="mx-auto mb-4 text-slate-300" size={36} />
                                <p className="text-slate-500 font-semibold">No audit logs found for current filters.</p>
                            </div>
                        ) : (
                            filteredLogs.map((log) => (
                                <div key={log.id} className="p-6 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-0.5">{getLevelIcon(log.level)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getLevelBadgeStyle(log.level)}`}>
                                                    {log.level}
                                                </span>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{log.source}</span>
                                                <span className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm font-semibold text-slate-800">{log.message}</p>
                                            <p className="text-xs text-slate-500 mt-1">Actor: {log.actor}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
                {icon}
                <span className="text-slate-500 font-medium">{label}</span>
            </div>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    );
}
