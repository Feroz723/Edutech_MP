import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
    label: string;
    path: string;
    icon: string;
}

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
        }
    };

    const adminLinks: NavItem[] = [
        { label: "Dashboard", path: "/admin/dashboard", icon: "dashboard" },
        { label: "Students", path: "/admin/users", icon: "groups" },
        { label: "Analytics", path: "/admin/analytics", icon: "analytics" },
        { label: "Courses", path: "/admin/courses", icon: "menu_book" },
        { label: "Finance", path: "/admin/orders", icon: "payments" },
        { label: "Settings", path: "/admin/settings", icon: "settings" },
    ];


    const studentLinks: NavItem[] = [
        { label: "Dashboard", path: "/student/dashboard", icon: "grid_view" },
        { label: "My Learning", path: "/my-courses", icon: "menu_book" },
        { label: "Browse", path: "/courses", icon: "explore" },
        { label: "Certificates", path: "/certificates", icon: "workspace_premium" },
        { label: "Assignments", path: "/assignments", icon: "assignment" },
    ];

    const links = user?.role === "admin"
        ? adminLinks
        : studentLinks;

    const isActive = (path: string) => location.pathname === path;

    return (
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 transition-colors duration-300">
            <div className="p-6 shrink-0">
                <div className="flex items-center gap-3 text-primary mb-8">
                    <div className="bg-primary rounded-lg p-2 text-white">
                        <span className="material-symbols-outlined block">auto_stories</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">EduStream</h1>
                </div>

                {/* Global Search */}
                <form onSubmit={handleSearch} className="mb-0 relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors text-xl">search</span>
                    <input
                        type="text"
                        placeholder="Global Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </form>
            </div>

            <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-1 custom-scrollbar">
                {links.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                            ${isActive(link.path)
                                ? "bg-primary text-white font-medium shadow-lg shadow-primary/20"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}
                        `}
                    >
                        <span className="material-symbols-outlined">{link.icon}</span>
                        <span>{link.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="mt-auto p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <div className="space-y-3">
                    <Link
                        to="/profile"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive("/profile") ? "bg-primary/10 text-primary font-medium" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                    >
                        <span className="material-symbols-outlined text-xl">manage_accounts</span>
                        <span className="text-sm font-bold">Profile & Security</span>
                    </Link>

                    <button
                        onClick={() => {
                            const isDark = document.documentElement.classList.toggle('dark');
                            localStorage.setItem('theme', isDark ? 'dark' : 'light');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl dark:hidden">dark_mode</span>
                        <span className="material-symbols-outlined text-xl hidden dark:block">light_mode</span>
                        <span className="text-sm font-bold dark:hidden">Switch to Dark</span>
                        <span className="text-sm font-bold hidden dark:block">Switch to Light</span>
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                            <img
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcMncD1yaGExTXXWAmlgKa23Xtfj6_qoPazOLwrjhThceodyaPM0YoGek8BKPYSC5OSVpbCtAMCgdVGfClO2D2rBMjb8SA5cQwP9nEMM5UlFfopVZ4tSPX8ZLbF-ZU3E9ZGiJL1W5q3hviMRWKk3wjwNTBdHqyV-lY_6u_GK9q50ksbw4i0M1ws7MNDJ3Dbb1AULuePM4nPN29AnFltPrgpn2vXPQMR4dRtszlnjzchsPOaFBKpcs-1itBSTBuG__kYNPCAwB1sPfW"
                                alt="Profile Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold truncate">{user?.name || "User"}</p>
                            <p className="text-[10px] text-slate-500 truncate capitalize font-black uppercase tracking-widest">{user?.role === 'student' ? 'Premium Learner' : 'Institutional Admin'}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="material-symbols-outlined text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Logout"
                        >
                            logout
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
