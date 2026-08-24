"use client";

import Link from "next/link";

export default function VisaGuide() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="text-center mb-16">
                <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest uppercase bg-indigo-500/10 text-indigo-500 rounded-full">
                    Immigration & Visa
                </span>
                <h1 className="text-4xl md:text-5xl font-black mb-6">Student Visa Guidelines</h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                    Navigating the student visa process can be complex. Here is your comprehensive guide to understanding what you need before you pack your bags.
                </p>
            </div>

            <div className="space-y-12">
                <section className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <span className="material-symbols-outlined text-indigo-500 text-3xl">task</span>
                        Before You Apply
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Before starting your visa application, ensure you have received an unconditional offer letter from a recognized educational institution.
                    </p>
                    <ul className="grid md:grid-cols-2 gap-4">
                        <li className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <span className="material-symbols-outlined text-green-500">check_circle</span>
                            <span className="text-sm font-medium">Valid Passport (at least 6 months validity)</span>
                        </li>
                        <li className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <span className="material-symbols-outlined text-green-500">check_circle</span>
                            <span className="text-sm font-medium">Acceptance Letter (e.g., CAS for UK, I-20 for US)</span>
                        </li>
                    </ul>
                </section>

                <section className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <span className="material-symbols-outlined text-indigo-500 text-3xl">account_balance</span>
                        Financial Requirements
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        Most countries require you to prove you have enough money to support yourself. This usually covers your first year of tuition plus living costs.
                    </p>
                    <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                        <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">Block Accounts (Germany/Europe)</h3>
                        <p className="text-sm text-indigo-800 dark:text-indigo-200 mb-4">
                            For countries like Germany, a Blocked Account (Sperrkonto) is required. You must deposit a fixed amount (e.g., ~€11,208) which is then disbursed monthly.
                        </p>
                        <a href="https://www.fintiba.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold bg-white text-indigo-600 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all">
                            Explore Fintiba Blocked Accounts
                            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        </a>
                    </div>
                </section>

                <section className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <span className="material-symbols-outlined text-indigo-500 text-3xl">translate</span>
                        Language Proficiency
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                        A recognized English language test is usually mandatory for countries like the UK, Australia, Canada, and the US unless you are from an exempt country.
                    </p>
                    <div className="flex gap-4">
                        <a href="https://www.ielts.org" target="_blank" rel="noreferrer" className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors group">
                            <span className="font-black text-2xl text-slate-800 dark:text-white mb-2">IELTS</span>
                            <span className="text-sm text-slate-500 group-hover:text-indigo-500 font-medium">Book your test</span>
                        </a>
                        <a href="https://www.ets.org/toefl" target="_blank" rel="noreferrer" className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors group">
                            <span className="font-black text-2xl text-slate-800 dark:text-white mb-2">TOEFL</span>
                            <span className="text-sm text-slate-500 group-hover:text-indigo-500 font-medium">Book your test</span>
                        </a>
                    </div>
                </section>

                <div className="text-center pt-8">
                    <Link href="/plan" className="inline-flex items-center gap-2 bg-indigo-500 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity">
                        Generate Your Custom Visa Checklist
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
