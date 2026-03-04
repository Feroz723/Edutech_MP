import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface PaymentSession {
    provider: string;
    txnToken: string;
    orderId: string;
    amount: string;
    mid: string;
    callbackUrl: string;
    environment: string;
    paymentUrl: string;
    qrData?: string | null;
    qrExpiresAt?: string | null;
}

interface OrderStatus {
    id: string;
    status: string;
    total_amount: string;
    payment_provider: string | null;
    payment_status_raw: string | null;
    payment_verified_at: string | null;
}

const SESSION_KEY = (orderId: string) => `paytm_checkout_session:${orderId}`;
const POLL_INTERVAL_MS = 5000;

function useCountdown(isoExpiry: string | null | undefined) {
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

    useEffect(() => {
        if (!isoExpiry) return;
        const target = new Date(isoExpiry).getTime();

        const tick = () => {
            const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
            setSecondsLeft(diff);
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [isoExpiry]);

    return secondsLeft;
}

function formatCountdown(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
}

function QrDisplay({ qrData }: { qrData: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(qrData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (qrData.startsWith("data:image")) {
        return (
            <img
                src={qrData}
                alt="Paytm QR Code"
                className="w-48 h-48 mx-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg"
            />
        );
    }

    if (qrData.startsWith("http://") || qrData.startsWith("https://")) {
        return (
            <div className="flex flex-col items-center gap-3">
                <img
                    src={qrData}
                    alt="Paytm QR Code"
                    className="w-48 h-48 mx-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg"
                    onError={(e) => {
                        // If image fails, show as a deeplink button
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                />
                <a
                    href={qrData}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary font-bold underline"
                >
                    Open QR Link
                </a>
            </div>
        );
    }

    if (qrData.startsWith("upi://")) {
        return (
            <a
                href={qrData}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl font-bold shadow-lg hover:bg-green-500 transition-colors"
            >
                <span className="material-symbols-outlined">smartphone</span>
                Open in UPI App
            </a>
        );
    }

    // Fallback: copy button for raw payload
    return (
        <div className="w-full">
            <textarea
                readOnly
                value={qrData}
                className="w-full p-4 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono resize-none h-24"
            />
            <button
                onClick={handleCopy}
                className="mt-2 text-xs text-primary font-bold flex items-center gap-1"
            >
                <span className="material-symbols-outlined text-sm">
                    {copied ? "check_circle" : "content_copy"}
                </span>
                {copied ? "Copied!" : "Copy QR Payload"}
            </button>
        </div>
    );
}

export default function PaymentCheckout() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    const [session, setSession] = useState<PaymentSession | null>(null);
    const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const countdown = useCountdown(session?.qrExpiresAt);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    const handleCompleted = useCallback(() => {
        stopPolling();
        if (orderId) sessionStorage.removeItem(SESSION_KEY(orderId));
        showToast("Payment successful! Course unlocked.", "success");
        navigate("/my-courses");
    }, [stopPolling, orderId, showToast, navigate]);

    const handleFailed = useCallback(() => {
        stopPolling();
        showToast("Payment failed. Please try again.", "error");
    }, [stopPolling, showToast]);

    // Poll order status every 5 seconds while pending
    const startPolling = useCallback(() => {
        if (!orderId || pollRef.current) return;
        pollRef.current = setInterval(async () => {
            try {
                const res = await api.get(`/payments/status/${orderId}`);
                const st: OrderStatus = res.data;
                setOrderStatus(st);
                if (st.status === "completed") handleCompleted();
                if (st.status === "failed") { handleFailed(); stopPolling(); }
            } catch {
                // Network glitch — keep polling
            }
        }, POLL_INTERVAL_MS);
    }, [orderId, handleCompleted, handleFailed, stopPolling]);

    // Session recovery: state → sessionStorage → /payments/create fallback
    useEffect(() => {
        if (!orderId) { navigate("/courses"); return; }

        (async () => {
            try {
                // 1. From navigation state
                const stateSession = (location.state as any)?.paymentSession as PaymentSession | undefined;
                if (stateSession) {
                    sessionStorage.setItem(SESSION_KEY(orderId), JSON.stringify(stateSession));
                    setSession(stateSession);
                    setLoading(false);
                    startPolling();
                    return;
                }

                // 2. From sessionStorage
                const cached = sessionStorage.getItem(SESSION_KEY(orderId));
                if (cached) {
                    setSession(JSON.parse(cached));
                    setLoading(false);
                    startPolling();
                    return;
                }

                // 3. Fallback: re-create payment session
                const res = await api.post("/payments/create", { orderId });
                const newSession: PaymentSession = res.data;
                sessionStorage.setItem(SESSION_KEY(orderId), JSON.stringify(newSession));
                setSession(newSession);
                startPolling();
            } catch (err: any) {
                const msg = err?.response?.data?.message || "Failed to load payment session";
                showToast(msg, "error");
                navigate("/courses");
            } finally {
                setLoading(false);
            }
        })();

        return () => stopPolling();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    const handleOpenPaytm = () => {
        if (!session) return;
        const form = document.createElement("form");
        form.method = "POST";
        form.action = session.paymentUrl;
        const fields: Record<string, string> = {
            mid: session.mid,
            orderId: session.orderId,
            txnToken: session.txnToken,
        };
        Object.entries(fields).forEach(([key, value]) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = value;
            form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
    };

    const handleIHavePaid = async () => {
        if (!orderId) return;
        setVerifying(true);
        try {
            await api.post("/payments/verify", { orderId });
            if (orderId) sessionStorage.removeItem(SESSION_KEY(orderId));
            showToast("Payment verified! Course unlocked.", "success");
            navigate("/my-courses");
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 401) {
                showToast("Session expired. Please log in again.", "error");
                navigate("/auth");
            } else {
                const msg = err?.response?.data?.message || "Payment verification failed";
                showToast(msg, "error");
            }
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
                        <p className="text-slate-500 font-medium text-sm uppercase tracking-widest animate-pulse">
                            Loading Payment Session...
                        </p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (!session) return null;

    const statusBadgeColor =
        orderStatus?.status === "completed"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            : orderStatus?.status === "failed"
                ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-background-light dark:bg-background-dark py-20 px-6">
                <div className="max-w-lg mx-auto">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                            <span className="material-symbols-outlined text-sm">payments</span>
                            Paytm Checkout
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                            Complete Your Purchase
                        </h1>
                        <p className="text-slate-500 font-medium mt-2 text-sm">
                            Your order is reserved. Complete payment within the session window.
                        </p>
                    </div>

                    {/* Order Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-primary/5 p-8 space-y-8">

                        {/* Order Summary */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Order ID</p>
                                <p className="font-mono text-xs text-slate-600 dark:text-slate-300">{session.orderId.slice(0, 18)}…</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Amount</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">
                                    ₹{Number(session.amount).toLocaleString("en-IN")}
                                </p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        {orderStatus && (
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadgeColor}`}>
                                <span className="material-symbols-outlined text-xs">
                                    {orderStatus.status === "completed" ? "check_circle" : orderStatus.status === "failed" ? "cancel" : "schedule"}
                                </span>
                                {orderStatus.status}
                            </div>
                        )}

                        {/* QR Code Section */}
                        {session.qrData && (
                            <div className="flex flex-col items-center gap-4 pt-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Scan with Paytm / any UPI app
                                </p>
                                <QrDisplay qrData={session.qrData} />

                                {/* Countdown */}
                                {countdown !== null && (
                                    <div className={`flex items-center gap-2 text-sm font-bold ${countdown < 60 ? "text-red-500" : "text-slate-500"}`}>
                                        <span className="material-symbols-outlined text-sm">timer</span>
                                        QR expires in {formatCountdown(countdown)}
                                    </div>
                                )}
                                {countdown === 0 && (
                                    <p className="text-xs text-red-500 font-bold">QR expired — please use Paytm Checkout below</p>
                                )}
                            </div>
                        )}

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
                            {/* Open Paytm button */}
                            <button
                                onClick={handleOpenPaytm}
                                className="w-full h-14 rounded-2xl bg-primary text-white font-black tracking-tight flex items-center justify-center gap-2 shadow-xl shadow-primary/25 hover:bg-primary/90 transition-colors"
                            >
                                <span className="material-symbols-outlined">open_in_new</span>
                                Open Paytm Checkout
                            </button>

                            {/* I Have Paid */}
                            <button
                                onClick={handleIHavePaid}
                                disabled={verifying}
                                className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors disabled:opacity-60"
                            >
                                <span className="material-symbols-outlined">
                                    {verifying ? "refresh" : "check_circle"}
                                </span>
                                {verifying ? "Verifying…" : "I Have Paid"}
                            </button>

                            {/* Cancel */}
                            <button
                                onClick={() => navigate("/courses")}
                                className="w-full h-12 rounded-2xl text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                Cancel &amp; Return to Courses
                            </button>
                        </div>

                        {/* Polling indicator */}
                        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Auto-detecting payment status…
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
