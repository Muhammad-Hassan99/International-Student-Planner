"use client";

import { useState, useRef, useEffect } from "react";
import { getAuthHeaders, getAuthToken } from "@/lib/api";

type Message = {
    role: "user" | "model" | "assistant" | "tool";
    content: string;
    toolState?: "input-streaming" | "input-available" | "output-available" | "output-error";
    toolData?: {
        university: string;
        country: string;
        location: string;
        programs: string[];
        estimatedTuition: string;
    };
    toolError?: string;
};
type DebugFailure = "" | "api" | "stream" | "rate-limit";
type FailedRequest = { content: string; history: Message[] };

type SpeechRecognitionLike = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
};

function UniversityToolCard({ message }: { message: Message }) {
    if (message.toolState === "output-available" && message.toolData) {
        return (
            <div className="max-w-full self-start rounded-2xl rounded-tl-sm border border-indigo-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:max-w-[92%]">
                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                    <span className="material-symbols-outlined text-base">account_balance</span>
                    University Information
                </div>
                <div className="space-y-3 p-4 text-sm">
                    <div>
                        <h4 className="wrap-break-word text-base font-bold text-slate-900 dark:text-white">{message.toolData.university}</h4>
                        <p className="mt-1 flex items-start gap-1.5 text-slate-500 dark:text-slate-400"><span className="material-symbols-outlined text-base">public</span>{message.toolData.country}</p>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300"><span className="material-symbols-outlined text-base text-indigo-500">location_on</span><span className="wrap-break-word">{message.toolData.location}</span></div>
                    <div>
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Programs</p>
                        <p className="wrap-break-word text-slate-600 dark:text-slate-300">{message.toolData.programs.join(", ")}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <p className="text-xs font-bold uppercase tracking-wide opacity-75">Estimated tuition</p>
                        <p className="wrap-break-word font-semibold">{message.toolData.estimatedTuition}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (message.toolState === "output-error") {
        return <div className="max-w-[92%] self-start rounded-2xl rounded-tl-sm border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"><div className="flex items-center gap-2 font-bold"><span className="material-symbols-outlined text-base">error</span>University information unavailable</div><p className="mt-1 wrap-break-word">{message.toolError || "The university details could not be loaded."}</p></div>;
    }

    return <div className="max-w-[92%] self-start rounded-2xl rounded-tl-sm border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300"><span className="flex items-center gap-2"><span className="material-symbols-outlined animate-spin text-base">progress_activity</span>{message.toolState === "input-available" ? "Looking up university information..." : "Preparing university information..."}</span></div>;
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [inputError, setInputError] = useState("");
    const [chatError, setChatError] = useState<{ message: string; retryable: boolean } | null>(null);
    const [failedRequest, setFailedRequest] = useState<FailedRequest | null>(null);
    const [debugFailure, setDebugFailure] = useState<DebugFailure>("");
    const [loading, setLoading] = useState(false);
    const [streamingStarted, setStreamingStarted] = useState(false);
    const [isNearBottom, setIsNearBottom] = useState(true);
    const [showJumpToLatest, setShowJumpToLatest] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [language, setLanguage] = useState("English");
    const [mode, setMode] = useState("Mentor Mode");
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    // Initialize messages from sessionStorage on mount
    useEffect(() => {
        const stored = sessionStorage.getItem("chat_history");
        if (stored) {
            try {
                setMessages(JSON.parse(stored));
            } catch {
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
            const speechWindow = window as Window & {
                SpeechRecognition?: new () => SpeechRecognitionLike;
                webkitSpeechRecognition?: new () => SpeechRecognitionLike;
            };
            const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;

                recognitionRef.current.onresult = (event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => {
                    const transcript = event.results[0][0].transcript;
                    setInput(transcript);
                };

                recognitionRef.current.onerror = (event: { error: string }) => {
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
            utterance.onerror = () => {
                console.error("TTS error");
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

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
        setShowJumpToLatest(false);
    };

    const handleMessagesScroll = () => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
        setIsNearBottom(nearBottom);
        setShowJumpToLatest(!nearBottom);
    };

    useEffect(() => {
        if (isOpen && isNearBottom) setTimeout(() => scrollToBottom("auto"), 0);
    }, [messages, isOpen, isNearBottom]);

    const sendMessage = async (content: string, retryRequest?: FailedRequest) => {
        if (loading) return;

        const trimmedContent = content.trim();
        if (!trimmedContent) return;
        const userMsg: Message = { role: "user", content: trimmedContent };
        const requestHistory = retryRequest?.history || [...messages, userMsg];
        if (!retryRequest) setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setInputError("");
        setChatError(null);
        setLoading(true);
        setStreamingStarted(false);
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const token = getAuthToken();

        if (!token) {
            setMessages((prev) => [...prev, { role: "assistant", content: "Please log in to use the AI chat." }]);
            setLoading(false);
            return;
        }

        try {
            const history = requestHistory.filter(m => m.role === "user" || m.role === "assistant");
            if (!retryRequest) setFailedRequest({ content: trimmedContent, history });

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ history, language, mode, ...(debugFailure ? { debugFailure } : {}) }),
                signal: abortController.signal
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("unauthorized");
                }
                if (response.status === 429) throw new Error("rate-limit");
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || "The AI service is temporarily unavailable.");
            }
            if (!response.body) throw new Error("stream_unavailable");
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let reply = "";
            let pending = "";
            let streamFailed = false;
            const handleEvent = (event: { type?: string; text?: string; state?: Message["toolState"]; result?: Message["toolData"]; error?: string; code?: string; message?: string; retryable?: boolean }) => {
                if (event.type === "text" && event.text) {
                    reply += event.text;
                    setStreamingStarted(true);
                    setMessages((prev) => {
                        const next = [...prev];
                        const last = next.length - 1;
                        if (next[last]?.role === "assistant") next[last] = { ...next[last], content: reply };
                        else next.push({ role: "assistant", content: reply });
                        return next;
                    });
                }
                if (event.type === "tool" && event.state) {
                    setMessages((prev) => {
                        const withoutTool = prev.filter((message) => message.role !== "tool");
                        return [...withoutTool, { role: "tool", content: "", toolState: event.state, toolData: event.result, toolError: event.error }];
                    });
                }
                if (event.type === "error") {
                    streamFailed = true;
                    setChatError({ message: event.message || "The response was interrupted. Your partial answer is preserved.", retryable: event.retryable !== false });
                }
            };
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                pending += decoder.decode(value, { stream: true });
                const lines = pending.split("\n");
                pending = lines.pop() || "";
                for (const line of lines) {
                    if (!line.trim()) continue;
                    try { handleEvent(JSON.parse(line)); } catch { /* Ignore incomplete wire events. */ }
                }
            }
            if (pending.trim()) {
                try { handleEvent(JSON.parse(pending)); } catch { /* Ignore incomplete wire events. */ }
            }
            if (reply) speakText(reply);
            else if (!streamFailed) {
                setMessages((prev) => [...prev, { role: "assistant", content: "I couldn't find a response for that request. Please try again." }]);
            }
        } catch (error: unknown) {
            if (error instanceof DOMException && error.name === "AbortError") return;
            if (error instanceof Error && error.message === "unauthorized") {
                setMessages((prev) => [...prev, { role: "assistant", content: "Please log in to use the AI chat." }]);
            } else if (error instanceof Error && error.message === "rate-limit") {
                setChatError({ message: "You have reached the request limit. Please wait a moment and retry.", retryable: true });
            } else {
                setChatError({ message: error instanceof Error ? error.message : "The AI service could not complete this request.", retryable: true });
            }
        } finally {
            setLoading(false);
            setStreamingStarted(false);
            abortControllerRef.current = null;
        }
    };

    const handleSend = () => {
        if (!input.trim()) {
            setInputError("Enter a question to get started.");
            return;
        }
        void sendMessage(input);
    };

    const handleRetry = () => {
        if (failedRequest) void sendMessage(failedRequest.content, failedRequest);
    };

    const handleStop = () => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        setLoading(false);
        setStreamingStarted(false);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end sm:bottom-6 sm:right-6">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 flex h-[min(82dvh,720px)] max-h-[calc(100dvh-5rem)] w-[min(28rem,calc(100vw-2rem))] min-w-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 animate-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between bg-primary p-4 text-white">
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
                    <div className="z-10 flex shrink-0 gap-2 border-b border-slate-200 bg-slate-100 px-4 py-2 shadow-inner dark:border-slate-700 dark:bg-slate-900/80">
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
                        {process.env.NODE_ENV === "development" && (
                            <select value={debugFailure} onChange={(event) => setDebugFailure(event.target.value as DebugFailure)} aria-label="Chat failure simulation" className="max-w-24 rounded border border-amber-300 bg-amber-50 px-2 py-1.5 text-[10px] text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                                <option value="">Test</option>
                                <option value="api">API fail</option>
                                <option value="stream">Stream fail</option>
                                <option value="rate-limit">429 limit</option>
                            </select>
                        )}
                    </div>

                    {/* Messages */}
                    <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-4 flex flex-col gap-3 bg-slate-50 dark:bg-slate-900/50">
                        {messages.length === 0 && !loading && (
                            <div className="my-auto flex flex-col items-center px-2 py-6 text-center">
                                <span className="material-symbols-outlined mb-2 text-3xl text-primary">waving_hand</span>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">What can I help you plan?</p>
                                <div className="mt-4 grid w-full gap-2 text-left">
                                    {["Tell me about University of Toronto in Canada", "What documents do I need for a student visa?", "Compare study costs in Germany and Canada"].map((prompt) => (
                                        <button key={prompt} onClick={() => void sendMessage(prompt)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">{prompt}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {messages.map((msg, i) => msg.role === "tool" ? (
                            <UniversityToolCard key={i} message={msg} />
                        ) : (
                            <div key={i} className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === "user"
                                ? "bg-primary text-white self-end rounded-tr-sm"
                                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 self-start rounded-tl-sm shadow-sm"
                                }`}>
                                {msg.content}
                            </div>
                        ))}
                        {loading && !streamingStarted && (
                            <div className="bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 self-start rounded-2xl rounded-tl-sm shadow-sm p-3 max-w-[85%] flex items-center gap-2">
                                <span className="animate-bounce">●</span>
                                <span className="animate-bounce delay-100">●</span>
                                <span className="animate-bounce delay-200">●</span>
                            </div>
                        )}
                        {chatError && (
                            <div className="self-start rounded-2xl rounded-tl-sm border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                                <div className="flex items-center gap-2 font-bold"><span className="material-symbols-outlined text-base">cloud_off</span>Something went wrong</div>
                                <p className="mt-1 wrap-break-word">{chatError.message}</p>
                                {chatError.retryable && failedRequest && <button onClick={handleRetry} disabled={loading} className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">Retry</button>}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                        {showJumpToLatest && (
                            <button onClick={() => scrollToBottom()} className="sticky bottom-1 self-center bg-primary text-white text-xs px-3 py-1.5 rounded-full shadow-lg">
                                Jump to latest
                            </button>
                        )}
                    </div>

                    {/* Input */}
                    <div className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
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
                            onChange={(e) => { setInput(e.target.value); setInputError(""); }}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Ask or speak..."
                            className="min-w-0 flex-1 rounded-xl bg-slate-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900"
                            disabled={loading}
                        />
                        <button
                            onClick={loading ? handleStop : handleSend}
                            disabled={!loading && !input.trim()}
                            className="bg-primary text-white p-2 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center w-10 h-10 shrink-0 shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-sm">{loading ? "stop" : "send"}</span>
                        </button>
                    </div>
                    {inputError && <p className="shrink-0 border-t border-rose-100 bg-rose-50 px-3 py-1 text-xs text-rose-600 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">{inputError}</p>}
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
