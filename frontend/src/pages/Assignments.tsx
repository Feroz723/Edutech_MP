import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import {
    Filter,
    Calendar as CalendarIcon,
    ClipboardList,
    CheckCircle2,
    TrendingUp,
    AlertCircle,
    UploadCloud,
    ChevronRight,
    Loader2
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function Assignments() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState("Upcoming");
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [submissionContent, setSubmissionContent] = useState("");

    const fetchAssignments = useCallback(async () => {
        try {
            const res = await api.get("/student/assignments");
            setAssignments(res.data);
        } catch (error) {
            showToast("Failed to load assignments", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    const handleSubmit = async () => {
        if (!submissionContent.trim()) {
            showToast("Please enter submission details", "info");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post("/student/assignments/submit", {
                assignmentId: selectedAssignment.id,
                content: submissionContent
            });
            showToast("Assignment submitted successfully!", "success");
            setSelectedAssignment(null);
            setSubmissionContent("");
            fetchAssignments();
        } catch (error) {
            showToast("Failed to submit assignment", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatus = (a: any) => {
        if (a.submission_status === 'submitted') return "Submitted";
        if (a.submission_status === 'graded') return "Graded";
        return "To Do";
    };

    const filteredAssignments = assignments.filter(a => {
        const status = getStatus(a);
        const isPastDue = a.due_at && new Date(a.due_at) < new Date();

        if (activeTab === "Upcoming") return status === "To Do" && !isPastDue;
        if (activeTab === "Completed") return status === "Submitted" || status === "Graded";
        if (activeTab === "Missing") return status === "To Do" && isPastDue;
        return false;
    });

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-background-light">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            <Sidebar />

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto p-8 lg:p-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">Assignments</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage your coursework and upcoming deadlines.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                <Filter size={18} />
                                Filter
                            </button>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                <CalendarIcon size={18} />
                                View Calendar
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800 mb-10">
                        {["Upcoming", "Completed", "Missing"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-4 text-sm font-bold tracking-tight transition-all relative ${activeTab === tab
                                    ? "text-primary"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex items-center gap-6 group hover:border-primary/20 transition-all">
                            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-2xl flex items-center justify-center">
                                <ClipboardList size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">To Do</p>
                                <p className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">
                                    {assignments.filter(a => getStatus(a) === "To Do").length.toString().padStart(2, '0')}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex items-center gap-6 group hover:border-primary/20 transition-all">
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-2xl flex items-center justify-center">
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Completed</p>
                                <p className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">
                                    {assignments.filter(a => getStatus(a) !== "To Do").length.toString().padStart(2, '0')}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm flex items-center gap-6 group hover:border-primary/20 transition-all">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl flex items-center justify-center">
                                <TrendingUp size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Certificates</p>
                                <p className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">00</p>
                            </div>
                        </div>
                    </div>

                    {/* Assignments Table */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden mb-12">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Assignment Title</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Course</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Created At</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredAssignments.map((assignment) => {
                                        const status = getStatus(assignment);
                                        return (
                                            <tr key={assignment.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2 rounded-lg ${status === "To Do" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-500" :
                                                            status === "Submitted" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" :
                                                                "bg-blue-50 dark:bg-blue-900/20 text-blue-500"
                                                            }`}>
                                                            {status === "To Do" ? <AlertCircle size={20} /> :
                                                                status === "Submitted" ? <CheckCircle2 size={20} /> :
                                                                    <ClipboardList size={20} />}
                                                        </div>
                                                        <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight">{assignment.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                                                        {assignment.course_title}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-black tracking-tight text-slate-700 dark:text-slate-300">
                                                            {new Date(assignment.created_at).toLocaleDateString()}
                                                        </p>
                                                        {assignment.due_at && (
                                                            <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${new Date(assignment.due_at) < new Date() ? "text-rose-500" : "text-amber-500"}`}>
                                                                <AlertCircle size={10} /> Due: {new Date(assignment.due_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status === "To Do" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-500" :
                                                        status === "Submitted" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" :
                                                            "bg-blue-50 dark:bg-blue-900/20 text-blue-500"
                                                        }`}>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                                        {status === "Graded" ? `Graded (${assignment.grade})` : status}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    {status === "To Do" ? (
                                                        <button
                                                            onClick={() => setSelectedAssignment(assignment)}
                                                            className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                                        >
                                                            Submit Now
                                                        </button>
                                                    ) : (
                                                        <button className="text-slate-400 hover:text-primary transition-all p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/20">
                                                            <ChevronRight size={20} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Submission Modal */}
                {selectedAssignment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                            <div className="p-10">
                                <header className="mb-8">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">Submit Assignment</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium italic">{selectedAssignment.title}</p>
                                </header>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Submission Content (Text or URL)</label>
                                        <textarea
                                            className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all min-h-[150px] resize-none"
                                            placeholder="Paste your solution link or write your response here..."
                                            value={submissionContent}
                                            onChange={(e) => setSubmissionContent(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setSelectedAssignment(null)}
                                            className="flex-1 py-4 px-6 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="flex-[2] py-4 px-6 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
                                            {isSubmitting ? "Submitting..." : "Send Submission"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
