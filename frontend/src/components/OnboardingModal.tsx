import React, { useState } from "react";
import {
    School,
    GraduationCap,
    MapPin,
    ArrowRight,
    ShieldCheck,
    AlertCircle
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

interface OnboardingModalProps {
    onComplete: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
    const { login } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        instituteName: "",
        qualification: "",
        city: "",
        state: "",
        contactNumber: ""
    });
    const [locationQuery, setLocationQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const fetchLocations = async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5&countrycodes=in`);
            const data = await response.json();
            setSuggestions(data);
            setShowSuggestions(true);
        } catch (error) {
            console.error("Location fetch error:", error);
        }
    };

    const handleSelectLocation = (loc: any) => {
        const city = loc.address.city || loc.address.town || loc.address.village || loc.address.suburb || loc.display_name.split(",")[0];
        const state = loc.address.state || "";
        setForm({ ...form, city, state });
        setLocationQuery(`${city}, ${state}`);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!form.instituteName || !form.qualification || !form.city || !form.state || !form.contactNumber) {
            showToast("Please fill all fields to continue", "error");
            return;
        }

        try {
            setLoading(true);
            const response = await api.put("/auth/profile", {
                name: undefined, // Don't change name here
                institute_name: form.instituteName,
                qualification: form.qualification,
                city: form.city,
                state: form.state,
                contact_number: form.contactNumber
            });

            if (response.data.token) {
                login(response.data.token);
            }

            showToast("Institutional profile verified!", "success");
            onComplete();
        } catch (error) {
            console.error("Onboarding error:", error);
            showToast("Failed to verify profile. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"></div>

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                    {/* Left Side: Branding/Identity */}
                    <div className="md:col-span-2 bg-primary p-8 md:p-12 text-white flex flex-col justify-between">
                        <div>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 shadow-xl">
                                <ShieldCheck size={32} />
                            </div>
                            <h2 className="text-3xl font-black leading-tight tracking-tighter">
                                Institutional Verification
                            </h2>
                            <p className="mt-4 text-primary-foreground/80 font-medium leading-relaxed">
                                To unlock your learning path, please provide your institutional identity details.
                            </p>
                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-3 text-sm font-bold bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                                <AlertCircle size={16} className="text-white/60" />
                                <span>No option to skip</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="md:col-span-3 p-8 md:p-12">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Institute Name</label>
                                    <div className="relative group">
                                        <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all" size={18} />
                                        <input
                                            required
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-6 text-slate-900 dark:text-white font-bold tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                            placeholder="e.g. Stanford University"
                                            value={form.instituteName}
                                            onChange={(e) => setForm({ ...form, instituteName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Highest Qualification</label>
                                    <div className="relative group">
                                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all" size={18} />
                                        <input
                                            required
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-6 text-slate-900 dark:text-white font-bold tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                            placeholder="e.g. B.Tech CS / Graduate"
                                            value={form.qualification}
                                            onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 relative">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Current Location (City, State)</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all" size={18} />
                                        <input
                                            required
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-6 text-slate-900 dark:text-white font-bold tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                            placeholder="Start typing to find your city..."
                                            value={locationQuery}
                                            onChange={(e) => {
                                                setLocationQuery(e.target.value);
                                                fetchLocations(e.target.value);
                                            }}
                                            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                        />
                                    </div>

                                    {/* Suggestions Dropdown */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-[100] top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            {suggestions.map((loc, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleSelectLocation(loc)}
                                                    className="w-full text-left px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b last:border-0 border-slate-50 dark:border-slate-700/30"
                                                >
                                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                                                        {loc.address.city || loc.address.town || loc.address.village || loc.address.suburb || loc.display_name.split(",")[0]}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium line-clamp-1">
                                                        {loc.address.state || loc.display_name.split(",").slice(1).join(",")}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Selected Hidden Fields for State sync */}
                                    <input type="hidden" name="city" value={form.city} />
                                    <input type="hidden" name="state" value={form.state} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Contact Number</label>
                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all text-[18px]">call</span>
                                        <input
                                            required
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-6 text-slate-900 dark:text-white font-bold tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                            placeholder="+91 XXXXX XXXXX"
                                            value={form.contactNumber}
                                            onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        START LEARNING
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
