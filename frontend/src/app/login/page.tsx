"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL, setAuthSession } from "@/lib/api";

export default function Login() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const cleanEmail = formData.email.trim();
        const cleanPassword = formData.password;

        if (!cleanEmail || !cleanPassword) {
            setError("Please fill in both email and password.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: cleanEmail,
                    password: cleanPassword
                }),
            });

            const data = await res.json().catch(() => ({}));
            
            if (!res.ok) {
                let errorMsg = "Failed to log in";
                if (typeof data.detail === "string") {
                    errorMsg = data.detail;
                } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
                    errorMsg = data.detail[0].msg;
                }
                throw new Error(errorMsg);
            }

            if (!data.access_token) {
                throw new Error("No authentication token received");
            }

            setAuthSession(data.access_token, data.user);
            router.push("/");
        } catch (err: any) {
            if (err.message && err.message.includes("Failed to fetch")) {
                setError("Unable to connect to the authentication server. Please check your network or try again.");
            } else {
                setError(err.message || "Failed to login. Please check your credentials.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <h2 className="text-3xl font-bold text-center mb-6">Welcome Back</h2>

                {error && (
                    <div className="mb-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-200 dark:border-red-800 flex items-start gap-2">
                        <span className="material-symbols-outlined text-lg leading-none shrink-0 mt-0.5">error</span>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1">Email</label>
                        <input
                            type="email"
                            required
                            placeholder="name@example.com"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-slate-100"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1">Password</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-slate-100"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-xl">autorenew</span>
                                <span>Logging in...</span>
                            </>
                        ) : (
                            "Log In"
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                    Don't have an account? <Link href="/signup" className="text-primary hover:underline font-bold">Sign Up</Link>
                </p>
            </div>
        </div>
    );
}
