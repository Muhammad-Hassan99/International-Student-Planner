"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

function CountryContent() {
    const searchParams = useSearchParams();
    const returnTo = searchParams.get("returnTo") || "/plan";
    const [countries, setCountries] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const FALLBACK_COUNTRIES = [
        "United States", "United Kingdom", "Canada", "Australia", "Germany",
        "France", "Netherlands", "Sweden", "Switzerland", "New Zealand",
        "Ireland", "Italy", "Spain", "Singapore", "Japan", "South Korea",
        "China", "India", "Brazil", "Mexico", "United Arab Emirates",
        "Malaysia", "Finland", "Norway", "Denmark", "Austria", "Belgium",
        "Poland", "Portugal", "Russia", "South Africa", "Turkey", "Argentina",
        "Chile", "Colombia", "Egypt", "Saudi Arabia", "Thailand", "Vietnam"
    ].sort();

    useEffect(() => {
        fetch(`${API_BASE_URL}/countries`)
            .then(res => res.json())
            .then(data => {
                if (data.countries && data.countries.length > 0) {
                    setCountries(data.countries);
                } else {
                    setCountries(FALLBACK_COUNTRIES);
                }
                setLoading(false);
            })
            .catch(() => {
                setCountries(FALLBACK_COUNTRIES);
                setLoading(false);
            });
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest uppercase bg-primary/10 text-primary rounded-full">
                    Step 1: Destination
                </span>
                <h1 className="text-4xl font-bold mb-4">Select Your Destination Country</h1>
                <p className="text-slate-500 max-w-2xl mx-auto mb-8">
                    Choose the country you want to study in.
                </p>

                <div className="max-w-xl mx-auto relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder="Search for a country..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full py-4 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all pb-4"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary">autorenew</span>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {countries
                        .filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
                        .slice(0, searchTerm ? countries.length : 60)
                        .map((country) => (
                            <Link href={`${returnTo}?country=${encodeURIComponent(country)}`} key={country} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer group">
                                <span className="font-semibold text-sm group-hover:text-primary transition-colors">{country}</span>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-sm">flight_takeoff</span>
                            </Link>
                        ))}
                </div>
            )}
        </div>
    );
}

export default function SelectCountry() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center py-20">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">autorenew</span>
            </div>
        }>
            <CountryContent />
        </Suspense>
    );
}
