export default function Degrees() {
    const degrees = [
        { title: "Bachelor's Degree", icon: "school", desc: "Undergraduate programs typically lasting 3-4 years.", color: "bg-blue-50 text-blue-600" },
        { title: "Master's Degree", icon: "workspace_premium", desc: "Postgraduate specialization usually lasting 1-2 years.", color: "bg-purple-50 text-purple-600" },
        { title: "PhD / Doctorate", icon: "science", desc: "Advanced research degrees taking 3-5+ years.", color: "bg-amber-50 text-amber-600" },
        { title: "Post-graduate Diploma", icon: "assignment", desc: "Short intensive programs for specific skill building.", color: "bg-emerald-50 text-emerald-600" }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Supported Degrees</h1>
                <p className="text-slate-500 max-w-2xl mx-auto">
                    Whether you are just starting out or looking to do advanced research, our AI can plan your journey.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {degrees.map((deg) => (
                    <div key={deg.title} className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:-translate-y-1 transition-transform">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${deg.color}`}>
                            <span className="material-symbols-outlined text-3xl">{deg.icon}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{deg.title}</h3>
                        <p className="text-slate-500 text-sm">{deg.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
