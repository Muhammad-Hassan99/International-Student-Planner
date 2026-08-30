"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        // Keep unexpected route failures visible to the framework without logging normal chat errors.
        console.error(error);
    }, [error]);

    return (
        <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
            <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-lg dark:border-rose-900 dark:bg-slate-800">
                <span className="material-symbols-outlined text-4xl text-rose-500">error</span>
                <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This page could not be loaded. Your saved planning data is unchanged.</p>
                <button onClick={() => reset()} className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:opacity-90">Try again</button>
            </div>
        </main>
    );
}
