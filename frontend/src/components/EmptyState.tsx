import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    onClick?: () => void;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    onClick
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-500">
            <div className="p-6 bg-slate-50 text-slate-300 rounded-[2rem] mb-6">
                <Icon size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 text-sm max-w-sm mb-8 font-medium leading-relaxed">
                {description}
            </p>

            {actionHref ? (
                <Link
                    to={actionHref}
                    className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
                >
                    {actionLabel}
                </Link>
            ) : actionLabel ? (
                <button
                    onClick={onClick}
                    className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
                >
                    {actionLabel}
                </button>
            ) : null}
        </div>
    );
}
