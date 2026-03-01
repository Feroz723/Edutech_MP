interface SkeletonProps {
    className?: string;
    variant?: "rectangle" | "circle" | "text";
}

export default function Skeleton({ className = "", variant = "rectangle" }: SkeletonProps) {
    const baseClass = "animate-pulse bg-slate-200";
    const variantClasses = {
        rectangle: "rounded-xl",
        circle: "rounded-full",
        text: "rounded h-4 w-full",
    };

    return <div className={`${baseClass} ${variantClasses[variant]} ${className}`} />;
}

export function CourseSkeleton() {
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-2 space-y-4">
            <Skeleton className="aspect-[16/10] rounded-[2rem]" />
            <div className="p-6 space-y-4">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
                <div className="pt-4 border-t border-slate-50 flex justify-between">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <tr className="animate-pulse">
            <td className="px-8 py-6"><Skeleton className="h-10 w-full" /></td>
            <td className="px-8 py-6"><Skeleton className="h-6 w-24" /></td>
            <td className="px-8 py-6"><Skeleton className="h-6 w-32" /></td>
            <td className="px-8 py-6"><Skeleton className="h-10 w-32 float-right" /></td>
        </tr>
    );
}
