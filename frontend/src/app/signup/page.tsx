"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("http://localhost:8000/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to create account");

            localStorage.setItem("token", data.access_token);
            window.dispatchEvent(new Event("auth-change"));
            router.push("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <h2 className="text-3xl font-bold text-center mb-2">Create Account</h2>
                <p className="text-center text-slate-500 mb-6 text-sm">Join EduGlobal AI to start planning your future.</p>

                {error && (
                    <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1">Full Name</label>
                        <input
                            type="text" required
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1">Email</label>
                        <input
                            type="email" required
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1">Password</label>
                        <input
                            type="password" required
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex justify-center mt-2"
                    >
                        {loading ? <span className="material-symbols-outlined animate-spin">autorenew</span> : "Sign Up"}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                    Already have an account? <Link href="/login" className="text-primary hover:underline font-bold">Log In</Link>
                </p>
            </div>
        </div>
    );
}
