import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Sidebar from "@/components/Sidebar";
import {
    Camera,
    User,
    Mail,
    Shield,
    Lock,
    Bell,
    Loader2
} from "lucide-react";

export default function Profile() {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        instituteName: "",
        qualification: "",
        city: "",
        state: "",
        contactNumber: ""
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState({
        courseUpdates: true,
        deadlines: true,
        community: false
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

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get("/auth/profile");
            const data = response.data;
            const nameParts = (data.name || "").split(" ");
            setForm({
                firstName: nameParts[0] || "",
                lastName: nameParts.slice(1).join(" ") || "",
                email: data.email || "",
                instituteName: data.institute_name || "",
                qualification: data.qualification || "",
                city: data.city || "",
                state: data.state || "",
                contactNumber: data.contact_number || ""
            });
            setNotifications({
                courseUpdates: data.notif_course_updates,
                deadlines: data.notif_deadlines,
                community: data.notif_community
            });
        } catch (error) {
            console.error("Fetch profile error:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Update Profile Info
            const updatedName = `${form.firstName} ${form.lastName}`.trim();
            const profileRes = await api.put("/auth/profile", {
                name: updatedName,
                institute_name: form.instituteName,
                qualification: form.qualification,
                city: form.city,
                state: form.state,
                contact_number: form.contactNumber
            });
            localStorage.setItem("token", profileRes.data.token);

            // 2. Update Notifications
            await api.put("/auth/notifications", {
                courseUpdates: notifications.courseUpdates,
                deadlines: notifications.deadlines,
                community: notifications.community
            });

            // 3. Change Password if provided
            if (passwordForm.currentPassword && passwordForm.newPassword) {
                if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    showToast("New passwords do not match", "error");
                    setLoading(false);
                    return;
                }
                await api.post("/auth/change-password", {
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                });
            }

            showToast("Settings updated successfully", "success");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            // Optionally refresh user context if needed, but token is updated.
        } catch (error: any) {
            const msg = error.response?.data?.message || "Failed to update settings";
            showToast(msg, "error");
            if (error.response?.status === 401 && msg.includes("Session")) {
                logout();
                navigate("/auth");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
            <Sidebar />

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-8 py-12 lg:px-12">
                    {/* Header */}
                    <header className="mb-10">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">Settings</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium italic">Manage your student profile, security credentials and notification preferences.</p>
                    </header>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
                        {/* Account Information Section */}
                        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Account Information</h2>
                            </div>
                            <div className="p-10">
                                <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                                    <div className="relative group">
                                        <div className="size-28 rounded-[2rem] bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl overflow-hidden bg-cover bg-center transition-transform group-hover:scale-105"
                                            style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuACnBpSEq4Kr0hm_zU5szKgtoh4wMkGYISIDquBCqW1kw_qoK8A-6BU3TSY39ko0xnpsnBeeeY_kMtr_vNoyaTuver_1XRHB-l8kwzBH7bbuiosy0TYuJ3pzJc_ggkgAo8PzktIEvDyOlpv-bd-qOfOi59O7SL_heM72mpbLOMHnV1LYeVyoaFYdSLTMb8YR6NxIePYhTe84ZnBgkhbsPEabH4tNFPRL0exd6Ty8JPZVt3FX3AZt9YJsgm7hSqw1Gtv30WnqwmAwuZO')` }}>
                                        </div>
                                        <button type="button" className="absolute -bottom-2 -right-2 size-10 bg-primary text-white rounded-2xl border-4 border-white dark:border-slate-900 flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-primary/20">
                                            <Camera size={18} />
                                        </button>
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{user.name}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium italic mt-1">Update your photo and personal details here.</p>
                                        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                                            <button type="button" className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Change Photo</button>
                                            <button type="button" className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-900/10 rounded-xl hover:bg-rose-100 transition-all">Remove</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">First Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all" size={18} />
                                            <input
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-slate-900 dark:text-white font-bold tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                                type="text"
                                                value={form.firstName}
                                                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Last Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all" size={18} />
                                            <input
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-slate-900 dark:text-white font-bold tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                                type="text"
                                                value={form.lastName}
                                                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Institute Name</label>
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all text-[18px]">school</span>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-slate-900 dark:text-white font-bold tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                                type="text"
                                                placeholder="e.g. Stanford University"
                                                value={form.instituteName}
                                                onChange={(e) => setForm({ ...form, instituteName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Qualification</label>
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all text-[18px]">history_edu</span>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-slate-900 dark:text-white font-bold tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                                type="text"
                                                placeholder="e.g. B.Tech CS / Graduate"
                                                value={form.qualification}
                                                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3 md:col-span-2 relative">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Current Location (City, State)</label>
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all text-[18px]">location_on</span>
                                            <input
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-6 text-slate-900 dark:text-white font-bold tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                                type="text"
                                                placeholder="Start typing to find your city..."
                                                value={locationQuery || `${form.city}${form.city && form.state ? ', ' : ''}${form.state}`}
                                                onChange={(e) => {
                                                    setLocationQuery(e.target.value);
                                                    fetchLocations(e.target.value);
                                                }}
                                                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                            />
                                        </div>

                                        {/* Suggestions Dropdown */}
                                        {showSuggestions && suggestions.length > 0 && (
                                            <div className="absolute z-[100] top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                {suggestions.map((loc, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => handleSelectLocation(loc)}
                                                        className="w-full text-left px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b last:border-0 border-slate-100 dark:border-slate-700/30"
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
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Contact Number</label>
                                        <div className="relative group">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all text-[18px]">call</span>
                                            <input
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-slate-900 dark:text-white font-bold tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                                type="text"
                                                placeholder="+91 XXXXX XXXXX"
                                                value={form.contactNumber}
                                                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input
                                                className="w-full bg-slate-50 dark:bg-slate-500/10 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-slate-400 font-bold tracking-tight cursor-not-allowed text-sm"
                                                type="email"
                                                value={form.email}
                                                disabled
                                            />
                                        </div>
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-2 ml-1 flex items-center gap-1.5 leading-none">
                                            <Shield size={10} /> Institutional security locks email verification
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Password & Security Section */}
                        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Password & Security</h2>
                            </div>
                            <div className="p-10">
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Current Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all" size={18} />
                                            <input
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-slate-900 dark:text-white font-bold tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                                placeholder="••••••••"
                                                type="password"
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">New Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all" size={18} />
                                                <input
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-slate-900 dark:text-white font-bold tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                                    type="password"
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Confirm New Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-all" size={18} />
                                                <input
                                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-slate-900 dark:text-white font-bold tracking-tight focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm"
                                                    type="password"
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {user.role !== 'student' && (
                                        <div className="mt-4 pt-8 border-t border-slate-50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-6 bg-primary/5 p-6 rounded-[1.5rem] border border-primary/10">
                                            <div>
                                                <p className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">Two-factor Authentication</p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic mt-1">Keep your account extra secure with a verification code.</p>
                                            </div>
                                            <button type="button" className="w-full sm:w-auto px-6 py-2.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/20 transition-all border border-primary/10">
                                                Enable 2FA
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Notification Preferences Section */}
                        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Notification Preferences</h2>
                            </div>
                            <div className="p-10">
                                <div className="space-y-2">
                                    {[
                                        { id: "courseUpdates", title: "Course Updates", desc: "Get notified when new content is added to your courses." },
                                        { id: "deadlines", title: "Assignment Deadlines", desc: "Reminders about upcoming due dates for your tasks." },
                                        { id: "community", title: "Community Notifications", desc: "Alerts for replies to your forum posts or discussions." }
                                    ].map((pref, idx) => (
                                        <div key={pref.id} className={`flex items-center justify-between py-6 ${idx !== 0 ? "border-t border-slate-50 dark:border-slate-800/50" : ""}`}>
                                            <div className="flex items-center gap-5">
                                                <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                                                    <Bell size={20} />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight block">{pref.title}</span>
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic leading-relaxed">{pref.desc}</span>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={notifications[pref.id as keyof typeof notifications]}
                                                    onChange={() => setNotifications({ ...notifications, [pref.id]: !notifications[pref.id as keyof typeof notifications] })}
                                                />
                                                <div className="w-14 h-7 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-transparent shadow-inner transition-all"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end gap-4 mt-4 pb-12">
                            <button type="button" className="px-8 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Discard Changes</button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-12 py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                            >
                                {loading && <Loader2 size={16} className="animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
