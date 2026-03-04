import { Link } from "react-router-dom";

const platformLinks = [
    { to: "/", label: "Home" },
    { to: "/courses", label: "Browse Courses" },
    { to: "/auth?mode=signup", label: "Get Started" },
];

const supportLinks = [
    { to: "/auth?mode=login", label: "Log In" },
    { to: "/auth?mode=signup", label: "Create Account" },
    { to: "/courses", label: "Explore Catalog" },
];

export default function Footer() {
    return (
        <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-16 w-full">
            <div className="fluid-container">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-12">
                    <div className="col-span-2 lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-primary p-2 rounded-lg text-white">
                                <span className="material-symbols-outlined block">school</span>
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display">EduStream</h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs leading-relaxed text-sm">
                            Empowering learners worldwide with accessible, high-quality education from industry experts.
                        </p>
                        <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                            <span>Learn • Build • Grow</span>
                        </div>
                    </div>

                    <div>
                        <h5 className="font-bold text-slate-900 dark:text-white mb-6 uppercase text-[10px] tracking-widest">Platform</h5>
                        <ul className="flex flex-col gap-4 text-sm text-slate-500 dark:text-slate-400">
                            {platformLinks.map((item) => (
                                <FooterLink key={item.label} to={item.to}>{item.label}</FooterLink>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h5 className="font-bold text-slate-900 dark:text-white mb-6 uppercase text-[10px] tracking-widest">Access</h5>
                        <ul className="flex flex-col gap-4 text-sm text-slate-500 dark:text-slate-400">
                            {supportLinks.map((item) => (
                                <FooterLink key={item.label} to={item.to}>{item.label}</FooterLink>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-6 text-xs font-medium text-slate-500">
                    <p>© 2024 EduStream Platform. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link to="/courses" className="hover:text-primary transition-colors">Catalog</Link>
                        <Link to="/auth?mode=login" className="hover:text-primary transition-colors">Login</Link>
                        <Link to="/auth?mode=signup" className="hover:text-primary transition-colors">Sign Up</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterLink({ to, children }: { to: string, children: React.ReactNode }) {
    return (
        <li>
            <Link to={to} className="hover:text-primary transition-colors">
                {children}
            </Link>
        </li>
    );
}

