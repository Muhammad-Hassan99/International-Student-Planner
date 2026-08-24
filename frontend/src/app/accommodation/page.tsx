"use client";

import Link from "next/link";
import { useState } from "react";

export default function Accommodation() {
    const [search, setSearch] = useState("");

    const providers = [
        {
            name: "AmberStudent",
            desc: "The largest global student accommodation platform with secure booking and no hidden fees.",
            link: "https://amberstudent.com/",
            img: "https://upload.wikimedia.org/wikipedia/commons/4/4e/House_icon.svg",
            tags: ["Global", "Verified Properties"]
        },
        {
            name: "Uniplaces",
            desc: "Find secure and affordable mid to long-term student housing primarily across Europe.",
            link: "https://www.uniplaces.com/",
            img: "https://upload.wikimedia.org/wikipedia/commons/4/4e/House_icon.svg",
            tags: ["Europe Focus", "Security"]
        },
        {
            name: "HousingAnywhere",
            desc: "The international booking platform for student accommodation and young professionals.",
            link: "https://housinganywhere.com/",
            img: "https://upload.wikimedia.org/wikipedia/commons/4/4e/House_icon.svg",
            tags: ["Tenant Protection", "Global"]
        }
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="text-center mb-16">
                <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest uppercase bg-rose-500/10 text-rose-500 rounded-full">
                    Student Housing
                </span>
                <h1 className="text-4xl md:text-5xl font-black mb-6">Find Your Home Abroad</h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10">
                    Finding safe, affordable, and convenient accommodation is a critical part of your journey. We partner with the best verified providers globally.
                </p>

                <div className="max-w-xl mx-auto relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors">search</span>
                    <input
                        type="text"
                        placeholder="Where are you going? (e.g., London, Berlin)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl py-5 pl-12 pr-32 shadow-sm focus:outline-none focus:border-rose-500 transition-all font-medium"
                    />
                    <a
                        href={`https://amberstudent.com/places/search?q=${encodeURIComponent(search || 'London')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-rose-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-600 transition-colors"
                    >
                        Search
                    </a>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {providers.map((p, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-500 mb-6">
                            <span className="material-symbols-outlined text-3xl">home_work</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-3">{p.name}</h3>
                        <p className="text-slate-500 mb-6 flex-1">{p.desc}</p>
                        <div className="flex flex-wrap gap-2 justify-center mb-8">
                            {p.tags.map(t => (
                                <span key={t} className="px-3 py-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full">
                                    {t}
                                </span>
                            ))}
                        </div>
                        <a href={p.link} target="_blank" rel="noreferrer" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all">
                            Visit Website
                        </a>
                    </div>
                ))}
            </div>

            <div className="mt-20 bg-rose-50 dark:bg-rose-900/10 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-rose-100 dark:border-rose-800/20">
                <div>
                    <h3 className="text-2xl font-bold mb-2">Need a personalized strategy?</h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-lg">
                        Use our AI planner to get city-specific budget estimates and university housing portal recommendations.
                    </p>
                </div>
                <Link href="/plan" className="shrink-0 bg-white dark:bg-slate-800 text-rose-500 font-bold border border-rose-200 dark:border-rose-800 px-8 py-4 rounded-xl shadow-sm hover:shadow-md transition-all">
                    Go to Planner
                </Link>
            </div>
        </div>
    );
}
