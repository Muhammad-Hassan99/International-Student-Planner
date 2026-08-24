"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Check authentication on client
        setToken(localStorage.getItem("token"));
        
        const handleAuthChange = () => {
            setToken(localStorage.getItem("token"));
        };
        
        window.addEventListener("storage", handleAuthChange);
        window.addEventListener("auth-change", handleAuthChange);
        
        return () => {
            window.removeEventListener("storage", handleAuthChange);
            window.removeEventListener("auth-change", handleAuthChange);
        };
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setToken(null);
        window.dispatchEvent(new Event("auth-change"));
        router.push("/");
    };

    const navLinks = [
        { name: "My Roadmap", href: "/plan" },
        { name: "Compare Countries", href: "/compare" },
        { name: "ROI Calculator", href: "/roi" },
        { name: "Trends", href: "/trends" },
        { name: "Tracker", href: "/tracker" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="text-primary">
                            <span className="material-symbols-outlined text-3xl">school</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">EduGlobal AI</h2>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === link.href ? "text-primary font-bold" : "text-slate-600 dark:text-slate-300"
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-4 min-w-[140px] justify-end">
                        {!isMounted ? null : token ? (
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                Log Out
                            </button>
                        ) : (
                            <>
                                <Link href="/login" className="hidden sm:flex text-sm font-semibold px-4 py-2 hover:text-primary transition-colors">
                                    Log In
                                </Link>
                                <Link href="/signup" className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
