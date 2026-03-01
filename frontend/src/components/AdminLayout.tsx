import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";

interface AdminLayoutProps {
    title: string;
    subtitle: string;
    children: ReactNode;
}

export default function AdminLayout({ title, subtitle, children }: AdminLayoutProps) {
    const { user } = useAuth();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "Good Morning";
        if (hour >= 12 && hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display">
            <Sidebar />

            <main className="flex-1 overflow-y-auto">
                {/* Unified Premium Header */}
                <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-4 fluid-container flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {title || `${getGreeting()}, ${user?.name?.split(" ")[0] || "Admin"}`}
                        </h2>
                        <p className="text-slate-500 text-sm font-medium">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} • {subtitle}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                className="pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary w-64 text-sm font-medium transition-all"
                                placeholder="Search data..."
                                type="text"
                            />
                        </div>
                        <button className="relative p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                        </button>
                    </div>
                </header>

                <div className="fluid-container py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
