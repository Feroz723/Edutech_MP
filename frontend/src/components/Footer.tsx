import { Link } from "react-router-dom";

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
                        <div className="flex gap-4">
                            <SocialIcon icon="public" />
                            <SocialIcon icon="chat" />
                            <SocialIcon icon="alternate_email" />
                        </div>
                    </div>

                    <div>
                        <h5 className="font-bold text-slate-900 dark:text-white mb-6 uppercase text-[10px] tracking-widest">Platform</h5>
                        <ul className="flex flex-col gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <FooterLink to="/courses">Browse Courses</FooterLink>
                            <FooterLink to="#">Mentorship</FooterLink>
                            <FooterLink to="#">Roadmaps</FooterLink>
                            <FooterLink to="#">Pricing</FooterLink>
                        </ul>
                    </div>

                    <div>
                        <h5 className="font-bold text-slate-900 dark:text-white mb-6 uppercase text-[10px] tracking-widest">Resources</h5>
                        <ul className="flex flex-col gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <FooterLink to="#">Blog</FooterLink>
                            <FooterLink to="#">Community</FooterLink>
                            <FooterLink to="#">Help Center</FooterLink>
                            <FooterLink to="#">Newsletter</FooterLink>
                        </ul>
                    </div>

                    <div>
                        <h5 className="font-bold text-slate-900 dark:text-white mb-6 uppercase text-[10px] tracking-widest">Company</h5>
                        <ul className="flex flex-col gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <FooterLink to="#">About Us</FooterLink>
                            <FooterLink to="#">Careers</FooterLink>
                            <FooterLink to="#">Privacy</FooterLink>
                            <FooterLink to="#">Terms</FooterLink>
                        </ul>
                    </div>
                </div>

                <div className="pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-6 text-xs font-medium text-slate-500">
                    <p>© 2024 EduStream Platform. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link to="#" className="hover:text-primary transition-colors">Status</Link>
                        <Link to="#" className="hover:text-primary transition-colors">Cookies</Link>
                        <Link to="#" className="hover:text-primary transition-colors">Security</Link>
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

function SocialIcon({ icon }: { icon: string }) {
    return (
        <a
            href="#"
            className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-800"
        >
            <span className="material-symbols-outlined text-xl">{icon}</span>
        </a>
    );
}
