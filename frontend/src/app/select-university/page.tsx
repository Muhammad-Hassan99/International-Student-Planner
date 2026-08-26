"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function UniversityContent() {
    const searchParams = useSearchParams();
    const country = searchParams.get("country");
    const returnTo = searchParams.get("returnTo") || "/plan";

    const [universities, setUniversities] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!country) {
            setLoading(false);
            return;
        }

        fetch(`http://https://international-student-planner-production-c1eb.up.railway.app/universities/${encodeURIComponent(country)}`)
            .then(res => res.json())
            .then(data => {
                if (data.universities) setUniversities(data.universities);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [country]);

    if (!country) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h1 className="text-2xl font-bold mb-4">Please select a destination first</h1>
                <Link href="/select-country" className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-md">
                    Go to Destinations
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest uppercase bg-primary/10 text-primary rounded-full">
                    Step 2: University
                </span>
                <h1 className="text-4xl font-bold mb-4">Select a University in {country}</h1>
                <p className="text-slate-500 max-w-2xl mx-auto mb-8">
                    Browse the top institutions in your selected destination, or choose "Help me decide" to let our AI pick the best one for your profile.
                </p>

                <div className="max-w-xl mx-auto relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder={`Search universities in ${country}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full py-4 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all pb-4"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col justify-center items-center py-20 gap-4">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary">autorenew</span>
                    <p className="text-slate-500 font-medium animate-pulse">Fetching prestigious universities in {country}...</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link href={`${returnTo}?country=${encodeURIComponent(country)}&university=Any`} className="p-6 bg-primary/5 rounded-2xl border-2 border-primary/20 shadow-sm hover:shadow-lg hover:border-primary transition-all flex items-start gap-4 cursor-pointer group text-left">
                            <div className="p-3 bg-primary/20 rounded-xl text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">auto_awesome</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1 text-primary leading-tight">Help me decide</h3>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    I am not sure yet. Let the AI recommend the best university for my budget and degree!
                                </p>
                            </div>
                        </Link>

                        {universities
                            .filter(u => u.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((uni) => (
                                <Link href={`${returnTo}?country=${encodeURIComponent(country)}&university=${encodeURIComponent(uni)}`} key={uni} className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all flex items-start gap-4 cursor-pointer group">
                                    <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-500 shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <span className="material-symbols-outlined">account_balance</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors leading-tight">{uni}</h3>
                                        <p className="text-sm font-medium text-slate-500 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                                            {country}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default function SelectUniversity() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center py-20">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">autorenew</span>
            </div>
        }>
            <UniversityContent />
        </Suspense>
    );
}
