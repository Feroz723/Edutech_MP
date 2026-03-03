import Sidebar from "@/components/Sidebar";
import {
    Download,
    Share2,
    Link as LinkIcon,
    Copy,
    Calendar,
    Star,
    Clock,
    TrendingUp,
    Search,
    Loader2
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";


export default function Certificates() {
    const { showToast } = useToast();
    const [certificates, setCertificates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCertificates = useCallback(async () => {
        try {
            const res = await api.get("/student/certificates");
            setCertificates(res.data);
        } catch (error) {
            showToast("Failed to load certificates", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchCertificates();
    }, [fetchCertificates]);

    const handleDownload = (cert: any) => {
        showToast(`Preparing download for ${cert.course_title}...`, "success");
        // Simulate PDF generation/download
        setTimeout(() => {
            const link = document.createElement("a");
            link.href = "#"; // In real app, this would be a signed URL
            link.download = `Certificate-${cert.id}.pdf`;
            showToast("Download started!", "success");
        }, 1500);
    };

    const copyVerifyLink = (id: string) => {
        navigator.clipboard.writeText(`https://edustream.io/verify/${id}`);
        showToast("Verification link copied!", "success");
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-background-light">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            <Sidebar />

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto p-8 lg:p-12">
                    {/* Header */}
                    <header className="mb-12">
                        <h2 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">My Certificates</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium italic">Showcase your professional milestones and verified technical achievements.</p>
                    </header>

                    {/* Certificates List */}
                    <div className="space-y-8">
                        {certificates.map((cert) => (
                            <div key={cert.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col md:flex-row group hover:border-primary/20 transition-all duration-300">
                                {/* Preview Column */}
                                <div className="md:w-72 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-8 border-r border-slate-100 dark:border-slate-800 relative">
                                    <div className="relative w-full aspect-[4/3] bg-white dark:bg-slate-900 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform group-hover:scale-105 transition-transform duration-500">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                                        <div className="p-4 flex flex-col h-full justify-between">
                                            <div className="border-2 border-primary/20 h-full w-full flex flex-col items-center justify-center p-2 text-center rounded-xl">
                                                <div className="mb-2">
                                                    {cert.icon}
                                                </div>
                                                <div className="h-1 w-12 bg-slate-100 dark:bg-slate-800 mb-1"></div>
                                                <div className="h-1 w-16 bg-slate-100 dark:bg-slate-800 mb-2"></div>
                                                <div className="h-0.5 w-20 bg-slate-50 dark:bg-slate-900"></div>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-primary/10 backdrop-blur-[2px] transition-opacity">
                                            <Search className="text-primary" size={32} />
                                        </div>
                                    </div>
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 p-8 flex flex-col justify-between">
                                    <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                                        <div className="flex-1">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-3 py-1.5 rounded-xl">
                                                Professional Certificate
                                            </span>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-4 tracking-tight leading-tight">
                                                {cert.course_title}
                                            </h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 flex items-center gap-2 font-medium italic">
                                                <Calendar size={16} className="text-primary" />
                                                Completed on {new Date(cert.issued_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                                            <button
                                                onClick={() => handleDownload(cert)}
                                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                            >
                                                <Download size={16} />
                                                PDF
                                            </button>
                                            <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                                <Share2 size={16} />
                                                LinkedIn
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                            <LinkIcon size={14} className="opacity-50" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                ID: <span className="text-slate-900 dark:text-slate-200">{cert.verifyId}</span>
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => copyVerifyLink(cert.id)}
                                            className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                                        >
                                            Copy Verification Link
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Stats or Tips */}
                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-primary/5 rounded-[2rem] p-8 border border-primary/10 group cursor-default">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                                    <Star size={20} />
                                </div>
                                <span className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-slate-100">Earned</span>
                            </div>
                            <p className="text-5xl font-black text-primary tracking-tighter">
                                {certificates.length.toString().padStart(2, '0')}
                            </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 group cursor-default">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-3 rounded-2xl transition-transform group-hover:scale-110">
                                    <Clock size={20} />
                                </div>
                                <span className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-slate-100">In Progress</span>
                            </div>
                            <p className="text-5xl font-black text-slate-400 tracking-tighter">02</p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 group cursor-default">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-3 rounded-2xl transition-transform group-hover:scale-110">
                                    <TrendingUp size={20} />
                                </div>
                                <span className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-slate-100">Strength</span>
                            </div>
                            <p className="text-5xl font-black text-slate-400 tracking-tighter">High</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
