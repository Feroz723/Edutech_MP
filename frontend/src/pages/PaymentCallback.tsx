import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function PaymentCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        const verify = async () => {
            const orderId = searchParams.get("orderId");
            const status = searchParams.get("status");

            if (!orderId) {
                showToast("Payment callback missing order id", "error");
                navigate("/courses");
                return;
            }

            // If the gateway already told us it failed, skip server verification
            if (status === "failed") {
                showToast("Payment failed. Please try again.", "error");
                navigate("/courses");
                return;
            }

            try {
                await api.post("/payments/verify", { orderId });
                showToast("Payment successful! Course unlocked.", "success");
                navigate("/my-courses");
            } catch (error: any) {
                const statusCode = error?.response?.status;
                if (statusCode === 401) {
                    // Auth token expired during Paytm redirect — session lost
                    showToast("Session expired. Please log in again.", "error");
                    navigate("/auth");
                } else {
                    const message = error?.response?.data?.message || "Payment verification failed";
                    showToast(message, "error");
                    navigate("/courses");
                }
            } finally {
                setVerifying(false);
            }
        };

        verify();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!verifying) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-12 text-center shadow-xl max-w-xl w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-6"></div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Finalizing payment</h1>
                <p className="text-slate-500 font-medium">Please wait while we confirm your Paytm transaction.</p>
            </div>
        </div>
    );
}
