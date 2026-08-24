export default function Scholarships() {
    const steps = [
        { title: "Profile Analysis", icon: "person_search", text: "We analyze your academic history and target degree." },
        { title: "Global Database Match", icon: "database", text: "We scan 50,000+ scholarships globally in seconds." },
        { title: "Personalized Roadmap", icon: "alt_route", text: "You get a tailored plan with links to apply." }
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4">Scholarship Finder</h1>
                <p className="text-slate-500 max-w-2xl mx-auto">
                    Our AI helps you find the funding you need. Just enter your destination and budget on the home page.
                </p>
            </div>

            <div className="relative max-w-4xl mx-auto">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 hidden md:block"></div>
                <div className="grid md:grid-cols-3 gap-8 relative z-10">
                    {steps.map((step, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl text-center">
                            <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
                                <span className="material-symbols-outlined text-3xl">{step.icon}</span>
                            </div>
                            <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                            <p className="text-slate-500 text-sm">{step.text}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-20 text-center">
                <a href="/plan#planner-form" className="bg-primary text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:opacity-90 transition-opacity">
                    Find Scholarships Now
                </a>
            </div>
        </div>
    );
}
