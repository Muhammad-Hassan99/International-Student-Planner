"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthToken, getStoredUser, clearAuthSession, fetchCurrentUser, UserProfile } from "@/lib/api";

export default function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    const syncAuthState = async () => {
        const currentToken = getAuthToken();
        const storedUser = getStoredUser();

        setToken(currentToken);
        setUser(storedUser);

        if (currentToken) {
            // Verify token validity with backend
            const backendUser = await fetchCurrentUser(currentToken);
            if (backendUser) {
                setUser(backendUser);
                localStorage.setItem("user", JSON.stringify(backendUser));
            } else if (currentToken && !backendUser && storedUser === null) {
                // If token invalid and cannot fetch user, clear
                clearAuthSession();
                setToken(null);
                setUser(null);
            }
        }
    };

    useEffect(() => {
        setIsMounted(true);
        syncAuthState();

        const handleAuthChange = () => {
            const currentToken = getAuthToken();
            const storedUser = getStoredUser();
            setToken(currentToken);
            setUser(storedUser);
        };

        window.addEventListener("storage", handleAuthChange);
        window.addEventListener("auth-change", handleAuthChange);

        return () => {
            window.removeEventListener("storage", handleAuthChange);
            window.removeEventListener("auth-change", handleAuthChange);
        };
    }, [pathname]);

    const handleLogout = () => {
        clearAuthSession();
        setToken(null);
        setUser(null);
        router.push("/");
    };

    const navLinks = [
        { name: "My Roadmap", href: "/plan" },
        { name: "Compare Countries", href: "/compare" },
        { name: "ROI Calculator", href: "/roi" },
        { name: "Trends", href: "/trends" },
        { name: "Tracker", href: "/tracker" },
    ];

    const displayName = user?.name || (user?.email ? user.email.split("@")[0] : "Student");
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl">school</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">EduGlobal AI</h2>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`text-sm font-medium transition-colors hover:text-primary ${
                                    pathname === link.href ? "text-primary font-bold" : "text-slate-600 dark:text-slate-300"
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3 justify-end">
                        {!isMounted ? (
                            <div className="w-24 h-9" />
                        ) : token ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                                        {initial}
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 max-w-[120px] sm:max-w-[160px] truncate">
                                        {displayName}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-red-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                                    title="Log out of your account"
                                >
                                    <span className="material-symbols-outlined text-base leading-none">logout</span>
                                    <span>Log Out</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="text-sm font-semibold px-4 py-2 text-slate-700 dark:text-slate-200 hover:text-primary transition-colors"
                                >
                                    Log In
                                </Link>
                                <Link
                                    href="/signup"
                                    className="bg-primary hover:opacity-90 text-white text-sm font-bold px-4 sm:px-5 py-2 rounded-xl shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
