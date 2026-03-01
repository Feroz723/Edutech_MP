import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
    const { user, logout, loading } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className={`sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 transition-all duration-300 ${scrolled ? "bg-white/90 dark:bg-background-dark/90 backdrop-blur-md shadow-sm" : "bg-white dark:bg-background-dark"
            }`}>
            <div className="fluid-container h-20 flex items-center justify-between gap-8">
                {/* Branding */}
                <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                    <div className="bg-primary p-2 rounded-lg text-white">
                        <span className="material-symbols-outlined block">school</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display">EduStream</h1>
                </Link>

                {/* Main Nav */}
                <nav className="hidden lg:flex items-center gap-8">
                    <Link to="/courses" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Courses</Link>
                    <Link to="#" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Mentors</Link>
                    <Link to="#" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Pricing</Link>
                    <Link to="#" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">Resources</Link>
                </nav>

                {/* Auth Actions */}
                <div className="flex items-center gap-3">
                    {loading ? (
                        <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
                    ) : !user ? (
                        <>
                            <Link to="/auth?mode=login">
                                <button className="hidden sm:flex px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                                    Log In
                                </button>
                            </Link>
                            <Link to="/auth?mode=signup">
                                <button className="flex px-6 py-2.5 text-sm font-bold bg-primary text-white rounded-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                                    Sign Up
                                </button>
                            </Link>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to={`/${user.role}/dashboard`} className="flex items-center gap-3 group">
                                <div className="bg-slate-200 dark:bg-slate-800 rounded-full size-10 flex items-center justify-center overflow-hidden border-2 border-primary/20 transition-all group-hover:border-primary text-slate-600 dark:text-slate-300 font-bold">
                                    {user.name?.[0] || <span className="material-symbols-outlined text-sm">person</span>}
                                </div>
                                <div className="hidden md:flex flex-col">
                                    <span className="text-sm font-bold leading-none text-slate-900 dark:text-white">{user.name}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{user.role}</span>
                                </div>
                            </Link>
                            <button
                                onClick={logout}
                                className="size-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                title="Log Out"
                            >
                                <span className="material-symbols-outlined">logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
