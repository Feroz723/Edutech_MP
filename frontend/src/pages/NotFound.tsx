import { Link } from "react-router-dom";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-6">
            <div className="text-center space-y-8 max-w-md">
                <div className="relative">
                    <div className="text-[200px] font-black text-slate-100 leading-none">404</div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Search size={64} className="text-slate-300" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Page Not Found
                    </h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        The page you're looking for doesn't exist or has been moved.
                        Let's get you back on track.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                    >
                        <Home size={18} /> Back to Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                        <ArrowLeft size={18} /> Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
