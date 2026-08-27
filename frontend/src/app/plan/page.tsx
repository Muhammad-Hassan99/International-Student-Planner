"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

// Currency and cost mapping based on country
const COUNTRY_STATS: Record<string, { currency: string, baseCost: number }> = {
  "United States": { currency: "$", baseCost: 30000 },
  "United Kingdom": { currency: "£", baseCost: 20000 },
  "Canada": { currency: "CAD", baseCost: 25000 },
  "Australia": { currency: "AUD", baseCost: 35000 },
  "Germany": { currency: "€", baseCost: 12000 },
  "France": { currency: "€", baseCost: 15000 }
};

function PlanContent() {
  const [formData, setFormData] = useState({
    country: "",
    degree: "",
    budget: "",
    preferred_city: "Any",
    preferred_university: "Any",
  });

  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [universities, setUniversities] = useState<string[]>([]);

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [expandedUni, setExpandedUni] = useState<number | null>(null);

  useEffect(() => {
    // Fetch all countries on load
    fetch(`${API_BASE_URL}/countries`)
      .then((res) => res.json())
      .then((data) => {
        if (data.countries) setCountries(data.countries);
      })
      .catch(err => console.error("Error loading countries", err));
  }, []);

  const handleCountryChange = async (selectedCountry: string, defaultUniversity: string = "Any") => {
    let newBudget = "";
    if (selectedCountry && COUNTRY_STATS[selectedCountry]) {
      newBudget = String(COUNTRY_STATS[selectedCountry].baseCost);
    }

    setFormData((prev) => ({
      ...prev,
      country: selectedCountry,
      preferred_city: "Any",
      preferred_university: defaultUniversity,
      budget: newBudget
    }));

    setCities([]);
    // Only reset universities if not prepopulating
    if (defaultUniversity === "Any") {
      setUniversities([]);
    }

    if (selectedCountry) {
      setLoadingConfig(true);
      try {
        const [citiesRes, unisRes] = await Promise.all([
          fetch(`${API_BASE_URL}/cities/${selectedCountry}`),
          fetch(`${API_BASE_URL}/universities/${selectedCountry}`)
        ]);
        const citiesData = await citiesRes.json();
        const unisData = await unisRes.json();

        if (citiesData.cities) setCities(citiesData.cities);
        if (unisData.universities) {
          setUniversities(unisData.universities);
          // If the defaultUniversity isn't in the fetched list but was provided via URL, add it so the dropdown is valid.
          if (defaultUniversity !== "Any" && !unisData.universities.includes(defaultUniversity)) {
            setUniversities((prev) => [defaultUniversity, ...prev]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingConfig(false);
      }
    }
  };

  const searchParams = useSearchParams();
  const urlCountry = searchParams.get("country");
  const urlUniversity = searchParams.get("university");

  useEffect(() => {
    if (urlCountry && urlCountry !== formData.country) {
      handleCountryChange(urlCountry, urlUniversity || "Any");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCountry, urlUniversity]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generatePlan = async () => {
    if (
      !formData.country ||
      !formData.degree ||
      !formData.budget
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setPlan(null);

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/generate-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...formData,
          budget: parseFloat(formData.budget),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        if (response.status === 401) {
          throw new Error("Please log in to use AI planning.");
        }
        throw new Error(errData.detail || "Failed to generate plan.");
      }

      const data = await response.json();
      setPlan(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = () => {
    if (formData.country && COUNTRY_STATS[formData.country]) {
      return COUNTRY_STATS[formData.country].currency;
    }
    return "$"; // Default fallback
  };

  return (
    <>
      <section className="relative px-4 py-12 md:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="z-10 text-center lg:text-left">
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest uppercase bg-primary/10 text-primary rounded-full">
              Powered by Advanced AI
            </span>
            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight mb-6">
              Your Global Education <span className="text-primary">Journey Starts Here</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto lg:mx-0">
              AI-powered planning for your international degree. Get a personalized roadmap, budget estimation, and destination matching in seconds.
            </p>
          </div>
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl group-hover:bg-primary/30 transition-all"></div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                className="w-full h-[400px] object-cover"
                alt="Group of diverse international students"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHSmB9ezB4cUXDNcWKhETjg7U4bA0nBgjD58jcA6t1A31fe6wuh-mOQZEkNVk1VuAOPQKXt000rOjIBMAY1WdnBNj2xw4AVZME4ELiKAP0o6Z5j2X4FUv7m_evN_5fjEyRxsdccrpBScDyon7wmx06y3NKh1zFV97Slvrwt3ppMQJHOP_B7w3oSa5lvkP42z12dTIq7m7xUwRo-rOdKViWI72EkIq3tG-z16BqlCuS0KXl1mHx_DmUfFWiVOq0X1pHoayFHqmF3hI"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 bg-slate-100 dark:bg-slate-900/50" id="planner-form">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 md:p-10 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold">Customize Your Plan</h2>
                <p className="text-slate-500 dark:text-slate-400">
                  Tell us your preferences to generate your custom education roadmap.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">

              {loadingConfig && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 z-10 flex items-center justify-center backdrop-blur-sm rounded-xl">
                  <span className="material-symbols-outlined text-primary text-4xl animate-spin">autorenew</span>
                </div>
              )}

              <div className="flex flex-col gap-2 relative">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">public</span>
                  Destination Country
                </label>
                <Link
                  href="/select-country?returnTo=/plan"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer flex justify-between items-center hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className={formData.country ? "font-bold" : "text-slate-400"}>{formData.country || "Select Destination"}</span>
                  <span className="material-symbols-outlined text-slate-400">flight_takeoff</span>
                </Link>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="degree" className="text-sm font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">workspace_premium</span>
                  Degree Level
                </label>
                <select
                  id="degree"
                  name="degree"
                  value={formData.degree}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                >
                  <option value="">Select Degree</option>
                  <option value="Bachelors">Bachelor's</option>
                  <option value="Masters">Master's</option>
                  <option value="PhD">PhD</option>
                  <option value="Diploma">Diploma</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="budget" className="text-sm font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">payments</span>
                  Annual Budget
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{getCurrencySymbol()}</span>
                  <input
                    id="budget"
                    name="budget"
                    type="number"
                    value={formData.budget}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 pl-8 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                    placeholder="e.g. 25000"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 relative">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">school</span>
                  Preferred University
                </label>
                {formData.country ? (
                  <Link
                    href={`/select-university?country=${encodeURIComponent(formData.country)}&returnTo=/plan`}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer flex justify-between items-center hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className={formData.preferred_university !== "Any" ? "font-bold truncate max-w-[90%]" : "text-slate-400"}>
                      {formData.preferred_university !== "Any" ? formData.preferred_university : "Help me decide (AI Match)"}
                    </span>
                    <span className="material-symbols-outlined text-slate-400">school</span>
                  </Link>
                ) : (
                  <div className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-3 text-sm flex justify-between items-center opacity-50 cursor-not-allowed">
                    <span className="text-slate-400 hover:text-slate-400">Select Country First</span>
                    <span className="material-symbols-outlined text-slate-400">school</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10">
              <button
                onClick={generatePlan}
                disabled={loading}
                className="w-full bg-primary text-white text-lg font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined ${loading ? "animate-spin" : ""}`}>
                  {loading ? "refresh" : "auto_awesome"}
                </span>
                {loading ? "Generating Your Roadmap..." : "Generate My AI Roadmap"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Generated Plan Section */}
      {plan && (
        <section className="px-4 py-16 max-w-5xl mx-auto animate-in fade-in duration-500">
          <h2 className="text-3xl font-bold mb-10 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-4xl">map</span>
            Your Personalized Education Roadmap
          </h2>

          <div className="grid md:grid-cols-2 gap-8">

            {/* Massive Primary University Spotlight */}
            {plan.universities && plan.universities.length > 0 && (() => {
              const primaryUni = plan.universities[0];
              return (
                <div className="md:col-span-2 relative overflow-hidden bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <span className="material-symbols-outlined text-[200px]">school</span>
                  </div>
                  <div className="relative p-8 md:p-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
                    <span className="inline-block mb-4 px-3 py-1 text-xs font-bold tracking-widest uppercase bg-primary text-white rounded-full shadow-md">
                      Top Recommendation
                    </span>
                    <h3 className="text-3xl md:text-4xl font-black mb-2 text-slate-800 dark:text-white leading-tight">
                      {primaryUni.name}
                    </h3>

                    {primaryUni.ranking && (
                      <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-amber-500">military_tech</span>
                        <span className="font-bold text-amber-600 dark:text-amber-500">{primaryUni.ranking}</span>
                      </div>
                    )}

                    <p className="text-slate-600 dark:text-slate-300 text-lg mb-8 max-w-3xl leading-relaxed">
                      {primaryUni.description}
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      {/* Admissions Dates */}
                      {primaryUni.admissions_start_date && primaryUni.admissions_closing_date && (
                        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                          <h4 className="text-xs uppercase tracking-widest font-black text-slate-400 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined">event</span>
                            Admissions Timeline
                          </h4>
                          <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-xl border border-blue-100 dark:border-blue-800/30">
                              <span className="font-bold text-blue-600 dark:text-blue-400">Opens</span>
                              <span className="font-black text-slate-800 dark:text-white">{primaryUni.admissions_start_date}</span>
                            </div>
                            <div className="flex justify-between items-center bg-rose-50 dark:bg-rose-900/20 px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-800/30">
                              <span className="font-bold text-rose-600 dark:text-rose-400">Deadlines</span>
                              <span className="font-black text-slate-800 dark:text-white">{primaryUni.admissions_closing_date}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Required Documents for Primary Uni */}
                      {primaryUni.required_documents && primaryUni.required_documents.length > 0 && (
                        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
                          <h4 className="text-xs uppercase tracking-widest font-black text-slate-400 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined">folder</span>
                            Application Checklist
                          </h4>
                          <ul className="space-y-2">
                            {primaryUni.required_documents.slice(0, 4).map((doc: string, i: number) => (
                              <li key={i} className="flex gap-2 items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                                <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>
                                {doc}
                              </li>
                            ))}
                            {primaryUni.required_documents.length > 4 && (
                              <li className="text-xs text-slate-400 font-bold ml-6">+ {primaryUni.required_documents.length - 4} more required docs</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* How to Apply Guide */}
                    {primaryUni.how_to_fill_application && primaryUni.how_to_fill_application.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-xs uppercase tracking-widest font-black text-slate-400 mb-4 flex items-center gap-2">
                          <span className="material-symbols-outlined">format_list_numbered</span>
                          Step-by-Step Application Guide
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {primaryUni.how_to_fill_application.map((step: string, i: number) => (
                            <div key={i} className="flex gap-3 items-start bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-black shrink-0">{i + 1}</span>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 mt-6 border-t border-slate-200 dark:border-slate-700/50 pt-8">
                      {primaryUni.application_form_link && (
                        <a href={primaryUni.application_form_link} target="_blank" rel="noreferrer" className="bg-primary text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-primary/30 hover:-translate-y-1 transition-all flex items-center gap-2">
                          <span className="material-symbols-outlined">drive_file_rename_outline</span>
                          Start Official Application
                        </a>
                      )}

                      {primaryUni.tuition_fees && (
                        <div className="bg-slate-100 dark:bg-slate-800 px-6 py-4 rounded-xl flex items-center gap-3">
                          <span className="material-symbols-outlined text-slate-400">payments</span>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-500">Est. Tuition</p>
                            <p className="font-black text-slate-800 dark:text-white">{primaryUni.tuition_fees}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Blocked Account Standalone Section */}
            {plan.block_account_details && (
              <div className={`md:col-span-2 p-8 rounded-3xl border shadow-lg relative overflow-hidden ${plan.block_account_details.is_required ? 'bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-800 border-amber-200 dark:border-amber-800/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <div className="absolute -right-10 -bottom-10 opacity-10">
                  <span className="material-symbols-outlined text-[250px] text-amber-500">lock</span>
                </div>
                <div className="relative z-10">
                  <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-700">
                    <span className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${plan.block_account_details.is_required ? 'text-amber-600 dark:text-amber-500' : 'text-slate-500'}`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {plan.block_account_details.is_required ? 'verified_user' : 'info'}
                      </span>
                      {plan.block_account_details.is_required ? 'Mandatory Blocked Account Required' : 'Financial Proof Requirements'}
                    </span>
                  </div>

                  <h3 className="text-3xl font-bold mb-4 flex items-center gap-3 text-slate-800 dark:text-white">
                    Visa & Financial Setup Process
                  </h3>

                  <p className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-8 max-w-3xl leading-relaxed">
                    {plan.block_account_details.description}
                  </p>

                  {plan.block_account_details.steps_to_open && plan.block_account_details.steps_to_open.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-sm uppercase tracking-widest font-black text-slate-500 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined">menu_book</span>
                        How to Open & Secure Your Account
                      </h4>
                      <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-amber-200 before:to-transparent dark:before:from-amber-800">
                        {plan.block_account_details.steps_to_open.map((step: string, idx: number) => (
                          <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-amber-500 text-white shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                              <span className="text-xs font-bold">{idx + 1}</span>
                            </div>
                            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-white dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                              <div className="font-bold text-slate-700 dark:text-slate-200">{step}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {plan.block_account_details.providers_link && (
                    <div className="mt-8">
                      <a href={plan.block_account_details.providers_link} target="_blank" rel="noreferrer" className="inline-flex bg-amber-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all items-center gap-2">
                        <span className="material-symbols-outlined">account_balance</span>
                        Proceed to Certified Provider
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">school</span>
                Alternative Universities
              </h3>
              <div className="space-y-4">
                {plan.universities.slice(1).map((uni: any, idx: number) => {
                  const isExpanded = expandedUni === idx + 1; // offset by 1 since we hide idx 0
                  return (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all">
                      <div
                        className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50"
                        onClick={() => setExpandedUni(isExpanded ? null : idx + 1)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-bold text-base leading-tight mb-1">{uni.name}</h4>
                            {uni.ranking && (
                              <span className="inline-block mb-2 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-md">
                                {uni.ranking}
                              </span>
                            )}
                          </div>
                          <span className="material-symbols-outlined text-slate-400 shrink-0 mt-1 transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                            expand_more
                          </span>
                        </div>
                        {uni.tuition_fees && (
                          <div className="mt-2 text-xs font-bold text-primary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">payments</span>
                            {uni.tuition_fees}
                          </div>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                          <p className={`text-sm text-slate-600 dark:text-slate-400 mb-4`}>{uni.description}</p>
                          {uni.admissions_start_date && uni.admissions_closing_date && (
                            <div className="mb-4">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">calendar_month</span> Admissions</p>
                              <div className="flex flex-wrap gap-4 text-xs font-bold">
                                <div><span className="text-slate-500">Starts:</span> <span className="text-slate-800 dark:text-white">{uni.admissions_start_date}</span></div>
                                <div><span className="text-slate-500">Closes:</span> <span className="text-slate-800 dark:text-white">{uni.admissions_closing_date}</span></div>
                              </div>
                            </div>
                          )}

                          <div className="mt-4 flex gap-2">
                            <a href={uni.link || `https://duckduckgo.com/?q=${encodeURIComponent(uni.name)}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg flex items-center gap-1.5 flex-1 justify-center">
                              Website
                            </a>
                            {uni.application_form_link && (
                              <a href={uni.application_form_link} target="_blank" rel="noreferrer" className="text-xs font-bold text-white bg-primary px-3 py-2 rounded-lg flex items-center gap-1.5 flex-1 justify-center">
                                Apply
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">account_balance</span>
                Budget & Finances
              </h3>
              {plan.estimated_total_annual_budget && (
                <div className="mb-6 bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[16px]">pie_chart</span>
                    Est. Total Annual Budget
                  </p>
                  <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{plan.estimated_total_annual_budget}</p>
                </div>
              )}
              <div className="mb-4 flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-bold">Estimated Monthly Cost</p>
                <p className="text-xl font-black text-slate-800 dark:text-white">{plan.monthly_cost}</p>
              </div>
            </div>

            {plan.university_application_steps && plan.university_application_steps.length > 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-2">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">app_registration</span>
                  General Platform Guide
                </h3>
                <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                  {plan.university_application_steps.map((step: string, idx: number) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white dark:border-slate-900 bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <span className="text-[10px] font-bold">{idx + 1}</span>
                      </div>
                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-sm">
                        <div className="font-bold text-sm text-slate-700 dark:text-slate-300">{step}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">emoji_events</span>
                Scholarship Opportunities
              </h3>
              <div className="space-y-4">
                {plan.scholarships.map((schol: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl flex justify-between items-start border border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="font-bold text-sm leading-tight mb-2">{schol.name}</h4>
                      <a href={schol.link} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline bg-primary/10 px-3 py-1.5 rounded-lg inline-block">View Details</a>
                    </div>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded text-sm whitespace-nowrap">
                      {schol.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">home</span>
                Accommodation Guidance
              </h3>
              <div className="space-y-4">
                {plan.accommodation.map((acc: any, idx: number) => (
                  <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-base leading-tight">{acc.type}</h4>
                      <span className="font-black whitespace-nowrap ml-4 text-primary bg-primary/10 px-2 py-1.5 rounded-lg text-sm">
                        {acc.estimated_cost}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{acc.description}</p>
                    {acc.how_to_get && (
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex gap-2 items-start">
                          <span className="material-symbols-outlined text-sm text-sky-500 shrink-0 mt-0.5">info</span>
                          <span>{acc.how_to_get}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {plan.visa_process && (
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-[28px]">fact_check</span>
                    General Visa Instructions
                  </h3>
                  <a href={`https://www.ivisa.com/`} target="_blank" rel="noreferrer" className="text-sm font-bold bg-primary/10 text-primary px-5 py-2.5 rounded-xl hover:bg-primary/20 transition-colors flex items-center gap-2 w-fit">
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    Official Visa Portal
                  </a>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs uppercase tracking-widest font-black text-slate-500 mb-5">Key Application Steps</h4>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                      {plan.visa_process.steps.map((step: string, idx: number) => (
                        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <span className="text-[10px] font-bold">{idx + 1}</span>
                          </div>
                          <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-sm">
                            <div className="font-bold text-sm text-slate-700 dark:text-slate-300">{step}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs uppercase tracking-widest font-black text-slate-500 mb-5">Common Documents Required</h4>
                    <ul className="space-y-3">
                      {plan.visa_process.required_documents.map((doc: string, idx: number) => (
                        <li key={idx} className="flex gap-3 text-sm items-center">
                          <span className="material-symbols-outlined text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 rounded-full p-1 border border-emerald-100 dark:border-emerald-800/50 text-[16px]">verified</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">g_translate</span>
                Requirements & Rules
              </h3>

              <div className="space-y-4">
                {plan.english_test_requirements && (
                  <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                    <p className="flex items-center gap-2 text-xs uppercase tracking-widest font-black text-indigo-500 mb-2">
                      <span className="material-symbols-outlined text-[16px]">forum</span>
                      Language Test
                    </p>
                    <p className="font-medium text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">{plan.english_test_requirements}</p>
                  </div>
                )}
                {plan.part_time_work_rules && (
                  <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                    <p className="flex items-center gap-2 text-xs uppercase tracking-widest font-black text-emerald-600 mb-2">
                      <span className="material-symbols-outlined text-[16px]">work</span>
                      Part-Time Work Rules
                    </p>
                    <p className="font-medium text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">{plan.part_time_work_rules}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 md:col-span-2">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">checklist</span>
                Final Preparation Checklist
              </h3>
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {plan.checklist.map((item: string, idx: number) => {
                    const isChecked = checkedItems.has(idx);
                    return (
                      <li key={idx}
                        onClick={() => {
                          const newSet = new Set(checkedItems);
                          if (newSet.has(idx)) newSet.delete(idx);
                          else newSet.add(idx);
                          setCheckedItems(newSet);
                        }}
                        className={`flex gap-3 px-4 py-4 rounded-xl items-center border cursor-pointer transition-all ${isChecked ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:shadow-sm'}`}>
                        <span className={`material-symbols-outlined text-2xl shrink-0 transition-colors ${isChecked ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}>
                          {isChecked ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className={`font-semibold text-sm transition-all flex-1 ${isChecked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                          {item}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">autorenew</span>
      </div>
    }>
      <PlanContent />
    </Suspense>
  );
}
