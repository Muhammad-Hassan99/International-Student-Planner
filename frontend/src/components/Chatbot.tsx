"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
    role: "user" | "model" | "assistant";
    content: string;
};

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hi! I'm your AI counselor. Ask me anything about universities, visas, or budget planning!" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [language, setLanguage] = useState("English");
    const [mode, setMode] = useState("Mentor Mode");
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    // Initialize messages from sessionStorage on mount
    useEffect(() => {
        const stored = sessionStorage.getItem("chat_history");
        if (stored) {
            try {
                setMessages(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse chat history");
            }
        }
    }, []);

    // Save messages to sessionStorage whenever they change
    useEffect(() => {
        sessionStorage.setItem("chat_history", JSON.stringify(messages));
    }, [messages]);

    // Initialize Web Speech API
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;

                recognitionRef.current.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setInput(transcript);
                };

                recognitionRef.current.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    setIsRecording(false);
                };

                recognitionRef.current.onend = () => {
                    setIsRecording(false);
                };
            }
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    // Update recognition language dynamically
    useEffect(() => {
        if (recognitionRef.current) {
            const langMap: Record<string, string> = {
                "English": "en-US",
                "Urdu": "ur-PK",
                "Hindi": "hi-IN",
                "Arabic": "ar-SA",
                "Turkish": "tr-TR"
            };
            recognitionRef.current.lang = langMap[language] || "en-US";
        }
    }, [language]);

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsRecording(true);
        }
    };

    const speakText = (text: string) => {
        try {
            if (!synthRef.current) return;
            synthRef.current.cancel(); // Stop any ongoing speech
            const utterance = new SpeechSynthesisUtterance(text);
            const langMap: Record<string, string> = {
                "English": "en-US",
                "Urdu": "ur-PK",
                "Hindi": "hi-IN",
                "Arabic": "ar-SA",
                "Turkish": "tr-TR"
            };
            const targetLang = langMap[language] || "en-US";
            utterance.lang = targetLang;

            const voices = synthRef.current.getVoices();
            if (voices.length > 0) {
                const targetPrefix = targetLang.split('-')[0];
                const voice = voices.find(v => v.lang.startsWith(targetPrefix)) || voices[0];
                utterance.voice = voice;
            }

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = (e) => {
                console.error("TTS error:", e);
                setIsSpeaking(false);
            };
            synthRef.current.speak(utterance);
        } catch (error) {
            console.error("Speech synthesis failed:", error);
            setIsSpeaking(false);
        }
    };

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            setTimeout(scrollToBottom, 100);
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        const token = localStorage.getItem("token");

        try {
            // Map "assistant" space to "model" for backend if needed, but backend expects "user" and "model"/"assistant".
            const history = messages.filter(m => m.role !== "assistant" || m.content !== "Hi! I'm your AI counselor. Ask me anything about universities, visas, or budget planning!");

            const response = await fetch("http://https://international-student-planner-production-c1eb.up.railway.app/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ message: userMsg.content, history, language, mode })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("unauthorized");
                }
                throw new Error("Network response was not ok");
            }
            const data = await response.json();

            setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
            speakText(data.reply);
        } catch (error: any) {
            if (error.message === "unauthorized") {
                setMessages((prev) => [...prev, { role: "assistant", content: "Please log in to use the AI chat." }]);
            } else {
                setMessages((prev) => [...prev, { role: "assistant", content: "Oops, I had trouble connecting to the server. Try again!" }]);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="bg-primary text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined">smart_toy</span>
                            <h3 className="font-bold">AI Voice Counselor</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {isSpeaking && (
                                <button onClick={stopSpeaking} className="hover:bg-white/20 p-1 rounded transition-colors animate-pulse text-red-300" title="Stop Speaking">
                                    <span className="material-symbols-outlined text-sm">volume_off</span>
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Settings / Filters */}
                    <div className="bg-slate-100 dark:bg-slate-900/80 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex gap-2 shadow-inner z-10">
                        <select
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded px-2 py-1.5 flex-1 outline-none text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-primary/50 cursor-pointer"
                        >
                            <option value="English">English</option>
                            <option value="Urdu">Urdu</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Arabic">Arabic</option>
                            <option value="Turkish">Turkish</option>
                        </select>
                        <select
                            value={mode}
                            onChange={e => setMode(e.target.value)}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded px-2 py-1.5 flex-1 outline-none text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-primary/50 cursor-pointer"
                        >
                            <option value="Mentor Mode">Mentor Mode</option>
                            <option value="Parent Explanation Mode">Parent Mode</option>
                            <option value="Motivational Mode">Motivational</option>
                            <option value="Quick Summary Mode">Summary Mode</option>
                        </select>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-slate-50 dark:bg-slate-900/50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === "user"
                                ? "bg-primary text-white self-end rounded-tr-sm"
                                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 self-start rounded-tl-sm shadow-sm"
                                }`}>
                                {msg.content}
                            </div>
                        ))}
                        {loading && (
                            <div className="bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 self-start rounded-2xl rounded-tl-sm shadow-sm p-3 max-w-[85%] flex items-center gap-2">
                                <span className="animate-bounce">●</span>
                                <span className="animate-bounce delay-100">●</span>
                                <span className="animate-bounce delay-200">●</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2 items-center">
                        <button
                            onClick={toggleRecording}
                            className={`p-2 rounded-xl flex items-center justify-center w-10 h-10 shrink-0 transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-primary hover:bg-primary/10'}`}
                            title={isRecording ? "Stop Recording" : "Start Voice Input"}
                        >
                            <span className="material-symbols-outlined text-sm">mic</span>
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Ask or speak..."
                            className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            disabled={loading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="bg-primary text-white p-2 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center w-10 h-10 shrink-0 shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-sm">send</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            >
                <span className="material-symbols-outlined text-2xl">
                    {isOpen ? 'close' : 'chat'}
                </span>
            </button>
        </div>
    );
}
