import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { GraduationCap, Loader2 } from "lucide-react";

export default function InstructorApply() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        bio: "",
        expertise: "",
        experience: "",
        qualifications: ""
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            showToast("Please log in to apply", "error");
            return;
        }

        setLoading(true);
        try {
            await api.post("/instructor/apply", form);
            showToast("Application submitted successfully!", "success");
            navigate("/");
        } catch (error) {
            showToast("Failed to submit application", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-16 fluid-container">
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
                    <GraduationCap size={18} /> Faculty Program
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-4">Apply to Teach</h1>
                <p className="text-slate-500">Join our elite faculty and share your expertise with learners worldwide.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Bio</label>
                    <textarea
                        value={form.bio}
                        onChange={(e) => setForm({ ...form, bio: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[100px]"
                        placeholder="Tell us about yourself..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Areas of Expertise</label>
                    <input
                        type="text"
                        value={form.expertise}
                        onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="e.g., Web Development, Data Science, Cloud Computing"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Teaching Experience</label>
                    <textarea
                        value={form.experience}
                        onChange={(e) => setForm({ ...form, experience: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[100px]"
                        placeholder="Describe your teaching or industry experience..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Qualifications</label>
                    <textarea
                        value={form.qualifications}
                        onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[100px]"
                        placeholder="List your degrees, certifications, and achievements..."
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" /> Submitting...
                        </>
                    ) : (
                        "Submit Application"
                    )}
                </button>
            </form>
        </div>
    );
}
