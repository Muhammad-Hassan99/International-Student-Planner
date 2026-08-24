"use client";

import { useState } from "react";

export default function ROICalculator() {
    const [tuition, setTuition] = useState<number>(25000);
    const [living, setLiving] = useState<number>(15000);
    const [duration, setDuration] = useState<number>(2);
    const [salary, setSalary] = useState<number>(70000);
    const [savingsRate, setSavingsRate] = useState<number>(30);

    const totalCost = (tuition + living) * duration;
    const yearlySavings = salary * (savingsRate / 100);
    const paybackYears = yearlySavings > 0 ? (totalCost / yearlySavings).toFixed(1) : "Infinity";

    return (
        <div className="max-w-5xl mx-auto px-4 py-16">
            <div className="text-center mb-12">
                <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-600 rounded-full">
                    Financial Planning
                </span>
                <h1 className="text-4xl md:text-5xl font-black mb-4">Study Abroad <span className="text-emerald-600">ROI Calculator</span></h1>
                <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                    Find out exactly how long it takes to recover your investment when studying abroad.
                </p>
            </div>

            <div className="grid md:grid-cols-5 gap-8">
                {/* Sliders Input */}
                <div className="md:col-span-3 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500">tune</span>
                        Your Variables
                    </h2>

                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="font-bold text-slate-700 dark:text-slate-300">Annual Tuition Fee ($)</label>
                                <span className="font-bold text-emerald-600">${tuition.toLocaleString()}</span>
                            </div>
                            <input type="range" min="0" max="100000" step="1000" value={tuition} onChange={e => setTuition(Number(e.target.value))} className="w-full accent-emerald-500" />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="font-bold text-slate-700 dark:text-slate-300">Annual Living Expenses ($)</label>
                                <span className="font-bold text-emerald-600">${living.toLocaleString()}</span>
                            </div>
                            <input type="range" min="5000" max="50000" step="1000" value={living} onChange={e => setLiving(Number(e.target.value))} className="w-full accent-emerald-500" />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="font-bold text-slate-700 dark:text-slate-300">Degree Duration (Years)</label>
                                <span className="font-bold text-emerald-600">{duration} Years</span>
                            </div>
                            <input type="range" min="1" max="5" step="0.5" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full accent-emerald-500" />
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
                            <div className="flex justify-between mb-2">
                                <label className="font-bold text-slate-700 dark:text-slate-300">Expected Post-Grad Salary ($)</label>
                                <span className="font-bold text-emerald-600">${salary.toLocaleString()}</span>
                            </div>
                            <input type="range" min="30000" max="200000" step="5000" value={salary} onChange={e => setSalary(Number(e.target.value))} className="w-full accent-emerald-500" />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="font-bold text-slate-700 dark:text-slate-300">Savings Rate (%)</label>
                                <span className="font-bold text-emerald-600">{savingsRate}%</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-2">What % of your salary will you save strictly to pay off education costs?</p>
                            <input type="range" min="5" max="80" step="5" value={savingsRate} onChange={e => setSavingsRate(Number(e.target.value))} className="w-full accent-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="md:col-span-2 bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>

                    <h2 className="text-2xl font-bold mb-8 relative z-10 flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-400">monitoring</span>
                        ROI Results
                    </h2>

                    <div className="space-y-6 relative z-10">
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <p className="text-sm text-slate-400 uppercase tracking-widest font-bold mb-1">Total Education Cost</p>
                            <p className="text-3xl font-black text-rose-400">${totalCost.toLocaleString()}</p>
                        </div>

                        <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <p className="text-sm text-slate-400 uppercase tracking-widest font-bold mb-1">Amount Saved Annually</p>
                            <p className="text-3xl font-black text-emerald-400">${yearlySavings.toLocaleString()}</p>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/20">
                            <p className="text-sm text-slate-400 uppercase tracking-widest font-bold mb-2">Break-even / Payback Time</p>
                            <p className="text-6xl font-black text-white">{paybackYears} <span className="text-2xl text-slate-400">Yrs</span></p>
                            <p className="text-sm mt-3 text-emerald-400 font-semibold">After {paybackYears} years of working, your degree is entirely paid off and pure profit.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
