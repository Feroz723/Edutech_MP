import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { GoogleLogin } from "@react-oauth/google";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function Auth() {
    const { user, login, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode");

    const [isLogin, setIsLogin] = useState(mode !== "signup");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    // Update isLogin if mode changes
    useEffect(() => {
        if (mode === "signup") setIsLogin(false);
        else if (mode === "login") setIsLogin(true);
    }, [mode]);

    // Redirect if already logged in and auth is initialized
    useEffect(() => {
        if (!authLoading && user) {
            const redirectPath = searchParams.get("redirect");
            if (redirectPath) {
                navigate(decodeURIComponent(redirectPath));
            } else if (user.role === "admin") {
                navigate("/admin/dashboard");
            } else {
                navigate("/student/dashboard");
            }
        }
    }, [user, authLoading, navigate, searchParams]);

    if (authLoading) return (
        <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            showToast("Please fill in all required fields", "error");
            return;
        }

        if (!isLogin && !formData.name) {
            showToast("Name is required", "error");
            return;
        }

        if (!isLogin && formData.password !== formData.confirmPassword) {
            showToast("Passwords do not match", "error");
            return;
        }

        setLoading(true);
        try {
            const endpoint = isLogin ? "/auth/login" : "/auth/register";
            const payload = isLogin
                ? { email: formData.email, password: formData.password }
                : { name: formData.name, email: formData.email, password: formData.password };

            const response = await api.post(endpoint, payload);
            login(response.data.token);
            showToast(isLogin ? "Welcome back!" : "Account created successfully!", "success");
        } catch (error: any) {
            console.error("Auth error:", error);
            const message = error.response?.data?.message || "Authentication failed";
            showToast(message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        const googleToken = credentialResponse.credential;
        setLoading(true);
        try {
            const response = await api.post("/auth/google", {
                token: googleToken,
            });
            login(response.data.token);
            showToast("Access Granted: Welcome to the Academy", "success");
        } catch (error) {
            console.error("Google login failed:", error);
            showToast("Identity verification failed. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col bg-background-light dark:bg-background-dark">

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Side: Visuals */}
                <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center p-12 overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-800 opacity-90"></div>
                        <img
                            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"
                            alt="Student success"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="relative z-10 max-w-lg text-white">
                        <div className="mb-8">
                            <span className="material-symbols-outlined text-6xl text-white/40">format_quote</span>
                        </div>
                        <h1 className="text-4xl xl:text-5xl font-black leading-tight mb-6">
                            {isLogin ? "Welcome back to your Learning Journey." : "Start Your Learning Journey Today"}
                        </h1>
                        <p className="text-xl font-light leading-relaxed text-blue-50/80 mb-8 italic">
                            "The beautiful thing about learning is that no one can take it away from you."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-1 bg-white/30 rounded-full"></div>
                            <span className="font-semibold tracking-wide uppercase text-sm">B.B. KING</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-20 bg-white dark:bg-slate-950 overflow-y-auto">
                    <div className="w-full max-w-md">
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                {isLogin ? "Log In" : "Create an account"}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                {isLogin
                                    ? "Please enter your credentials to continue"
                                    : "Join thousands of students learning new skills every day."}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {!isLogin && (
                                <Input
                                    label="Full Name"
                                    name="name"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    icon={<span className="material-symbols-outlined text-xl">person</span>}
                                />
                            )}

                            <Input
                                label="Email Address"
                                name="email"
                                type="email"
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={handleChange}
                                icon={<span className="material-symbols-outlined text-xl">mail</span>}
                            />

                            <div className="relative">
                                <Input
                                    label="Password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    icon={<span className="material-symbols-outlined text-xl">lock</span>}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-[38px] text-slate-400 hover:text-primary transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>

                            {!isLogin && (
                                <Input
                                    label="Confirm Password"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    icon={<span className="material-symbols-outlined text-xl">lock</span>}
                                />
                            )}

                            {isLogin && (
                                <div className="flex justify-end">
                                    <Link to="#" className="text-sm text-primary font-medium hover:underline">
                                        Forgot Password?
                                    </Link>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                isLoading={loading}
                            >
                                {isLogin ? "Log In" : "Create Account"}
                            </Button>
                        </form>

                        <div className="relative flex items-center py-8">
                            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                            <span className="flex-shrink mx-4 text-slate-400 text-sm font-medium whitespace-nowrap">Or continue with</span>
                            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                        </div>

                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => showToast("Google login failed", "error")}
                                theme="outline"
                                shape="pill"
                                size="large"
                                text={isLogin ? "signin_with" : "signup_with"}
                                width="400"
                            />
                        </div>

                        {!isLogin && (
                            <div className="mt-8 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    By creating an account, you agree to our
                                    <Link to="#" className="text-primary hover:underline font-medium mx-1">Terms of Service</Link>
                                    and
                                    <Link to="#" className="text-primary hover:underline font-medium mx-1">Privacy Policy</Link>.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
