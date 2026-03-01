import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Loader2 } from "lucide-react";

export default function AdminSettings() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState("general");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        platform_name: "",
        support_email: "",
        logo_url: "",
        theme: "light",
        mfa_enabled: false,
        password_complexity: "medium",
        session_timeout: 30,
        smtp_host: "",
        smtp_port: 587,
        notification_enrollment: true,
        notification_digest: false,
        currency: "INR",
        tax_percentage: 18
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get("/admin/settings");
            setSettings(res.data);
        } catch (error) {
            showToast("Failed to load settings", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put("/admin/settings", settings);
            showToast("Settings updated successfully", "success");
        } catch (error) {
            showToast("Failed to update settings", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));

        // Immediate visual feedback for theme changes
        if (field === 'theme') {
            if (value === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            localStorage.setItem('theme', value);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-background-light">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    return (
        <AdminLayout
            title="Platform Settings"
            subtitle="Manage your edutech platform's core configurations and system behavior"
        >
            <div className="space-y-10">

                {/* Tabs */}
                <div className="border-b border-slate-200 mb-10 overflow-x-auto">
                    <div className="flex gap-10 whitespace-nowrap">
                        <TabButton
                            id="general"
                            label="General"
                            icon="tune"
                            active={activeTab === "general"}
                            onClick={setActiveTab}
                        />
                        <TabButton
                            id="security"
                            label="Security"
                            icon="security"
                            active={activeTab === "security"}
                            onClick={setActiveTab}
                        />
                        <TabButton
                            id="email"
                            label="Email Notifications"
                            icon="mail"
                            active={activeTab === "email"}
                            onClick={setActiveTab}
                        />
                        <TabButton
                            id="payments"
                            label="Payments"
                            icon="payments"
                            active={activeTab === "payments"}
                            onClick={setActiveTab}
                        />
                    </div>
                </div>

                {/* Settings Content */}
                <div className="space-y-12 min-h-[500px]">
                    {activeTab === "general" && (
                        <div className="space-y-12 animate-in fade-in duration-500">
                            {/* Section: Platform Info */}
                            <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">General Information</h3>
                                    <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">Basic identification details for your institutional platform.</p>
                                </div>
                                <div className="lg:col-span-2 space-y-6 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                    <div className="space-y-3 mr-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Platform Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            value={settings.platform_name}
                                            onChange={(e) => handleChange("platform_name", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-3 mr-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Support Email</label>
                                        <input
                                            type="email"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            value={settings.support_email}
                                            onChange={(e) => handleChange("support_email", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section: Visuals */}
                            <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Branding & Assets</h3>
                                    <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">Update your platform's logo and visual identity for all users.</p>
                                </div>
                                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Platform Logo URL</label>
                                        <div className="flex items-center gap-8">
                                            <div className="size-24 rounded-2xl bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden group hover:border-primary/50 transition-colors">
                                                {settings.logo_url ? (
                                                    <img
                                                        src={settings.logo_url}
                                                        alt="Logo Preview"
                                                        className="w-14 h-14 object-contain group-hover:scale-110 transition-transform"
                                                    />
                                                ) : (
                                                    <span className="material-symbols-outlined text-slate-300 text-4xl">image</span>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <input
                                                    type="text"
                                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                    placeholder="Enter logo image URL..."
                                                    value={settings.logo_url || ""}
                                                    onChange={(e) => handleChange("logo_url", e.target.value)}
                                                />
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Recommended: 512x512px. SVG or PNG preferred.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Appearance */}
                            <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Default Theme</h3>
                                    <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">Set the default intelligence interface for new institutional scholars.</p>
                                </div>
                                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                    <div className="grid grid-cols-2 gap-6">
                                        <ThemeOption
                                            label="Light Mode"
                                            icon="light_mode"
                                            selected={settings.theme === "light"}
                                            onClick={() => handleChange("theme", "light")}
                                        />
                                        <ThemeOption
                                            label="Dark Mode"
                                            icon="dark_mode"
                                            selected={settings.theme === "dark"}
                                            onClick={() => handleChange("theme", "dark")}
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="space-y-12 animate-in fade-in duration-500">
                            <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Security Governance</h3>
                                    <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">Enforce strict authentication protocols for student and admin accounts.</p>
                                </div>
                                <div className="lg:col-span-2 space-y-8 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                    <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-primary">
                                                    <span className="material-symbols-outlined text-2xl">two_factor_authentication</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Multi-Factor Authentication</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Dual-Layer Integrity Protocol</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${settings.mfa_enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-200 text-slate-500"}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${settings.mfa_enabled ? "bg-emerald-500" : "bg-slate-400"}`}></div>
                                                    {settings.mfa_enabled ? "Protocol Active" : "Disabled"}
                                                </span>
                                                <div
                                                    onClick={() => handleChange("mfa_enabled", !settings.mfa_enabled)}
                                                    className={`w-14 h-7 ${settings.mfa_enabled ? "bg-primary" : "bg-slate-300"} rounded-full relative cursor-pointer shadow-inner flex items-center ${settings.mfa_enabled ? "justify-end pr-1" : "justify-start pl-1"} transition-all duration-300`}
                                                >
                                                    <div className="w-5 h-5 bg-white rounded-full shadow-md transition-all"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white/60 rounded-2xl border border-slate-100 text-xs text-slate-500 font-medium leading-relaxed">
                                            <span className="font-bold text-slate-700">Protocol Specification:</span> Enabling this requires all administrative personnel to undergo a secondary verification check. This mitigates unauthorized access attempts by 99.9%.
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password Complexity</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div
                                                onClick={() => handleChange("password_complexity", "strong")}
                                                className={`flex items-center gap-3 p-4 border-2 ${settings.password_complexity === "strong" ? "border-primary bg-primary/5" : "border-slate-50"} rounded-2xl transition-all cursor-pointer`}
                                            >
                                                <div className={`size-4 rounded-full border-2 ${settings.password_complexity === "strong" ? "border-primary flex items-center justify-center" : "border-slate-200"}`}>
                                                    {settings.password_complexity === "strong" && <div className="size-2 bg-primary rounded-full"></div>}
                                                </div>
                                                <span className={`text-sm font-bold ${settings.password_complexity === "strong" ? "text-slate-900" : "text-slate-400"}`}>Institutional Strength</span>
                                            </div>
                                            <div
                                                onClick={() => handleChange("password_complexity", "medium")}
                                                className={`flex items-center gap-3 p-4 border-2 ${settings.password_complexity === "medium" ? "border-primary bg-primary/5" : "border-slate-50"} rounded-2xl transition-all cursor-pointer`}
                                            >
                                                <div className={`size-4 rounded-full border-2 ${settings.password_complexity === "medium" ? "border-primary flex items-center justify-center" : "border-slate-200"}`}>
                                                    {settings.password_complexity === "medium" && <div className="size-2 bg-primary rounded-full"></div>}
                                                </div>
                                                <span className={`text-sm font-bold ${settings.password_complexity === "medium" ? "text-slate-900" : "text-slate-400"}`}>Regular Strength</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Session Inactivity Timeout (Minutes)</label>
                                        <input
                                            type="number"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none transition-all"
                                            value={settings.session_timeout}
                                            onChange={(e) => handleChange("session_timeout", parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === "email" && (
                        <div className="space-y-12 animate-in fade-in duration-500">
                            <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Email Intelligence</h3>
                                    <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">Configure the communications gateway for institutional notifications.</p>
                                </div>
                                <div className="lg:col-span-2 space-y-8 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">SMTP Host</label>
                                            <input
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold"
                                                value={settings.smtp_host || ""}
                                                onChange={(e) => handleChange("smtp_host", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Port</label>
                                            <input
                                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold"
                                                type="number"
                                                value={settings.smtp_port}
                                                onChange={(e) => handleChange("smtp_port", parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Notification Logic</label>
                                        <div className="space-y-4 mt-2">
                                            <div
                                                onClick={() => handleChange("notification_enrollment", !settings.notification_enrollment)}
                                                className="flex items-center justify-between group cursor-pointer p-4 bg-slate-50 rounded-2xl"
                                            >
                                                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Course Enrollment Confirmation</span>
                                                <div className={`w-10 h-5 ${settings.notification_enrollment ? "bg-primary" : "bg-slate-300"} rounded-full relative shadow-inner flex items-center ${settings.notification_enrollment ? "justify-end pr-1" : "justify-start pl-1"} transition-all`}>
                                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                                </div>
                                            </div>
                                            <div
                                                onClick={() => handleChange("notification_digest", !settings.notification_digest)}
                                                className="flex items-center justify-between group cursor-pointer p-4 bg-slate-50 rounded-2xl"
                                            >
                                                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Weekly Professional Digest</span>
                                                <div className={`w-10 h-5 ${settings.notification_digest ? "bg-primary" : "bg-slate-300"} rounded-full relative shadow-inner flex items-center ${settings.notification_digest ? "justify-end pr-1" : "justify-start pl-1"} transition-all`}>
                                                    <div className="w-3 h-3 bg-white rounded-full"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === "payments" && (
                        <div className="space-y-12 animate-in fade-in duration-500">
                            <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Finance Architecture</h3>
                                    <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">Manage institutional payment gateways and global currency logic.</p>
                                </div>
                                <div className="lg:col-span-2 space-y-8 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-6 border-2 border-primary bg-primary/5 rounded-[1.5rem] relative">
                                            <div className="absolute top-4 right-4 text-primary"><span className="material-symbols-outlined">check_circle</span></div>
                                            <div className="size-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm mb-4">
                                                <span className="material-symbols-outlined">payments</span>
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 mb-1">Razorpay Institutional</h4>
                                            <p className="text-xs text-slate-500 font-medium tracking-tight">Standard Indian intelligence gateway</p>
                                        </div>
                                        <div className="p-6 border-2 border-slate-50 hover:border-slate-100 transition-all rounded-[1.5rem] grayscale opacity-40">
                                            <div className="size-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-4">
                                                <span className="material-symbols-outlined">account_balance</span>
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 mb-1">Stripe Global</h4>
                                            <p className="text-xs text-slate-500 font-medium tracking-tight">Decommissioned gateway</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Platform Currency</label>
                                        <select
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none appearance-none cursor-pointer"
                                            value={settings.currency}
                                            onChange={(e) => handleChange("currency", e.target.value)}
                                        >
                                            <option value="INR">Indian Rupee (INR)</option>
                                            <option value="USD">US Dollar (USD)</option>
                                            <option value="EUR">Euro (EUR)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tax Configuration (%)</label>
                                        <input
                                            type="number"
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold"
                                            value={settings.tax_percentage}
                                            onChange={(e) => handleChange("tax_percentage", parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-10 border-t border-slate-200 flex justify-end gap-6">
                        <button
                            onClick={fetchSettings}
                            className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                        >
                            Discard Deletions
                        </button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-10 py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <span className="material-symbols-outlined">save</span>}
                            {saving ? "Saving..." : "Save Configurations"}
                        </Button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function TabButton({ id, label, icon, active, onClick }: any) {
    return (
        <button
            onClick={() => onClick(id)}
            className={`
                pb-4 flex items-center gap-3 text-sm font-bold transition-all border-b-2
                ${active
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-400 hover:text-slate-600"}
            `}
        >
            <span className="material-symbols-outlined text-lg">{icon}</span>
            {label}
        </button>
    );
}

function ThemeOption({ label, icon, selected, onClick }: any) {
    return (
        <label className="relative cursor-pointer group" onClick={onClick}>
            <input type="radio" name="theme" className="peer sr-only" checked={selected} readOnly />
            <div className={`
                p-6 rounded-2xl border-2 transition-all flex items-center gap-4
                ${selected ? "border-primary bg-primary/5" : "border-slate-100 group-hover:border-slate-200"}
            `}>
                <div className={`
                    p-3 rounded-xl transition-colors
                    ${selected ? "bg-primary text-white" : "bg-slate-50 text-slate-400 group-hover:text-primary"}
                `}>
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
                <span className="font-bold text-slate-900">{label}</span>
                {selected && (
                    <span className="material-symbols-outlined ml-auto text-primary text-sm font-bold">check_circle</span>
                )}
            </div>
        </label>
    );
}
