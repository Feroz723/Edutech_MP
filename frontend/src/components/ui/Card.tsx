import React from "react";

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card = ({ children, className = "" }: CardProps) => (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden ${className}`}>
        {children}
    </div>
);

export const CardHeader = ({ children, className = "" }: CardProps) => (
    <div className={`p-6 border-b border-slate-200 dark:border-slate-800 ${className}`}>
        {children}
    </div>
);

export const CardContent = ({ children, className = "" }: CardProps) => (
    <div className={`p-6 ${className}`}>
        {children}
    </div>
);

export const CardFooter = ({ children, className = "" }: CardProps) => (
    <div className={`p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 ${className}`}>
        {children}
    </div>
);
