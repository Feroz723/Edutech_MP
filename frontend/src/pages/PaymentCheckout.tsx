import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Button from "@/components/ui/Button";

type PaymentSession = {
    orderId: string;
    amount: string;
    mid: string;
    txnToken: string;
    paymentUrl: string;
    qrData?: string | null;
    qrExpiresAt?: string;
};

type PaymentState = "pending" | "completed" | "failed";

const sessionKeyFor = (orderId: string) => `paytm_checkout_session:${orderId}`;

function parseQrContent(qrData?: string | null) {
    if (!qrData) return { imageSrc: null, deepLink: null, raw: null };

    if (qrData.startsWith("data:image/")) {
        return { imageSrc: qrData, deepLink: null, raw: qrData };
    }

    if (qrData.startsWith("http://") || qrData.startsWith("https://")) {
        return { imageSrc: qrData, deepLink: qrData, raw: qrData };
    }

    if (qrData.startsWith("upi://")) {
        return { imageSrc: null, deepLink: qrData, raw: qrData };
    }

    return { imageSrc: null, deepLink: null, raw: qrData };
}

export default function PaymentCheckout() {
    const { orderId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [session, setSession] = useState<PaymentSession | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isRecovering, setIsRecovering] = useState(true);
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
    const [paymentState, setPaymentState] = useState<PaymentState>("pending");

    const terminalNotifiedRef = useRef(false);

    const saveSession = useCallback((value: PaymentSession) => {
        setSession(value);
        if (value.orderId) {
            sessionStorage.setItem(sessionKeyFor(value.orderId), JSON.stringify(value));
        }
    }, []);

    useEffect(() => {
        const boot = async () => {
            if (!orderId) {
                setIsRecovering(false);
                return;
            }

            const stateSession = (location.state as { paymentSession?: PaymentSession } | null)?.paymentSession;
            if (stateSession && stateSession.orderId === orderId) {
                saveSession(stateSession);
                setIsRecovering(false);
                return;
            }

            const persisted = sessionStorage.getItem(sessionKeyFor(orderId));
            if (persisted) {
                try {
                    const parsed = JSON.parse(persisted) as PaymentSession;
                    saveSession(parsed);
                    setIsRecovering(false);
                    return;
                } catch {
                    sessionStorage.removeItem(sessionKeyFor(orderId));
                }
            }

            // Recover session for pending orders if user refreshed the page
            try {
                const createRes = await api.post("/payments/create", { orderId });
                saveSession({ ...createRes.data, orderId });
                showToast("Checkout session refreshed.", "info");
            } catch (error: any) {
                const message = error?.response?.data?.message || "Unable to recover checkout session";
                showToast(message, "error");
            } finally {
                setIsRecovering(false);
            }
        };

        boot();
    }, [location.state, orderId, saveSession, showToast]);

    useEffect(() => {
        if (!session?.qrExpiresAt) {
            setSecondsLeft(null);
            return;
        }

        const tick = () => {
            const left = Math.max(0, Math.floor((new Date(session.qrExpiresAt as string).getTime() - Date.now()) / 1000));
            setSecondsLeft(left);
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [session?.qrExpiresAt]);

    useEffect(() => {
        if (!orderId || paymentState !== "pending") return;

        let active = true;

        const poll = async () => {
            try {
                const res = await api.get(`/payments/status/${orderId}`);
                const status = (res.data.status || "pending") as PaymentState;
                setPaymentState(status);

                if (status === "completed" && !terminalNotifiedRef.current) {
                    terminalNotifiedRef.current = true;
                    showToast("Payment confirmed! Course unlocked.", "success");
                    sessionStorage.removeItem(sessionKeyFor(orderId));
                    navigate("/my-courses");
                    return;
                }

                if (status === "failed" && !terminalNotifiedRef.current) {
                    terminalNotifiedRef.current = true;
                    showToast("Payment failed. Please initiate a new order.", "error");
                    return;
                }
            } catch {
                // silent polling failure
            }

            if (active) {
                setTimeout(poll, 5000);
            }
        };

        poll();

        return () => {
            active = false;
        };
    }, [navigate, orderId, paymentState, showToast]);

    const qrInfo = useMemo(() => parseQrContent(session?.qrData), [session?.qrData]);

    const openHostedCheckout = () => {
        if (!session?.mid || !session?.txnToken || !session?.paymentUrl || !orderId) {
            showToast("Invalid checkout session", "error");
            return;
        }

        const form = document.createElement("form");
        form.method = "POST";
        form.action = session.paymentUrl;

        const fields: Record<string, string> = {
            mid: session.mid,
            orderId,
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

    const verifyNow = async () => {
        if (!orderId) return;
        setIsVerifying(true);
        try {
            await api.post("/payments/verify", { orderId });
            showToast("Payment verified successfully", "success");
            sessionStorage.removeItem(sessionKeyFor(orderId));
            navigate("/my-courses");
        } catch (error: any) {
            const message = error?.response?.data?.message || "Payment not completed yet";
            showToast(message, "info");
        } finally {
            setIsVerifying(false);
        }
    };

    const copyPayload = async () => {
        if (!qrInfo.raw) return;
        try {
            await navigator.clipboard.writeText(qrInfo.raw);
            showToast("Payment payload copied", "success");
        } catch {
            showToast("Unable to copy payload", "error");
        }
    };

    if (isRecovering) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-12 text-center shadow-xl max-w-xl w-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-6"></div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Preparing secure checkout</h1>
                    <p className="text-slate-500 font-medium">Please wait while we initialize your payment session.</p>
                </div>
            </div>
        );
    }

    if (!session || !orderId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-10 text-center max-w-lg w-full">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Checkout session unavailable</h1>
                    <p className="text-slate-500 mb-8">Please restart the purchase flow from the course page.</p>
                    <Button onClick={() => navigate("/courses")} className="w-full h-12 rounded-2xl">Back to Courses</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pt-24 pb-16 px-6">
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 md:p-10 shadow-xl">
                <p className="text-xs font-black tracking-[0.2em] uppercase text-primary mb-3">Secure Dynamic QR Checkout</p>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Complete your payment</h1>
                <p className="text-slate-500 font-medium mb-2">Order: <span className="font-bold text-slate-700 dark:text-slate-300">{orderId}</span></p>
                <p className={`text-sm font-bold mb-6 ${paymentState === "completed" ? "text-emerald-600" : paymentState === "failed" ? "text-red-600" : "text-amber-600"}`}>
                    Status: {paymentState}
                </p>

                <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        {qrInfo.imageSrc ? (
                            <img src={qrInfo.imageSrc} alt="Dynamic payment QR" className="w-full rounded-xl bg-white p-2" />
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-4 text-sm text-slate-600 dark:text-slate-300 space-y-3">
                                <p className="font-semibold">Scan-ready QR image not available from gateway response.</p>
                                {qrInfo.deepLink ? (
                                    <a
                                        href={qrInfo.deepLink}
                                        className="text-primary font-bold underline break-all"
                                    >
                                        Open UPI App
                                    </a>
                                ) : null}
                                {qrInfo.raw ? (
                                    <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-widest text-slate-400">Payment payload</p>
                                        <div className="max-h-24 overflow-auto rounded-lg bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-700 break-all text-xs">{qrInfo.raw}</div>
                                        <Button onClick={copyPayload} variant="secondary" className="w-full h-10 rounded-xl">Copy Payload</Button>
                                    </div>
                                ) : (
                                    <p className="text-xs">Use the hosted checkout button to complete payment securely.</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <p className="text-xs uppercase tracking-widest font-black text-slate-400">Amount</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">₹{Number(session.amount || 0).toLocaleString()}</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <p className="text-xs uppercase tracking-widest font-black text-slate-400 mb-1">QR Expiry</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {secondsLeft === null ? "Waiting..." : `${Math.floor(secondsLeft / 60)}m ${String(secondsLeft % 60).padStart(2, "0")}s`}
                            </p>
                        </div>

                        <Button onClick={openHostedCheckout} className="w-full h-12 rounded-2xl">Open Paytm Checkout</Button>
                        <Button onClick={verifyNow} disabled={isVerifying || paymentState === "completed"} variant="secondary" className="w-full h-12 rounded-2xl">
                            {isVerifying ? "Verifying..." : "I Have Paid"}
                        </Button>
                        <Button onClick={() => navigate("/courses")} variant="outline" className="w-full h-12 rounded-2xl">
                            Cancel & Return to Courses
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
