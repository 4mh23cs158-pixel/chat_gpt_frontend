import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Home = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentMode, setCurrentMode] = useState("chat"); // modes: chat, image, study, settings, profile, history
    const [chatHistory, setChatHistory] = useState([]);
    const [userEmail, setUserEmail] = useState("");
    const [activeSidebarTab, setActiveSidebarTab] = useState("history"); // history, profile
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const [userBio, setUserBio] = useState(localStorage.getItem("user_bio") || "");
    const [profileImage, setProfileImage] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") !== "light");
    const [currentSessionId, setCurrentSessionId] = useState(null);

    const fetchSessions = async (token) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const backendSessions = res.data.sessions.map(s => ({
                id: s.session_id,
                title: s.title,
                timestamp: new Date(s.last_message_at).toLocaleString(),
                messages: [], // Will fetch on click
                isBackend: true
            }));
            setChatHistory(backendSessions);
        } catch (err) {
            console.error("Failed to fetch sessions", err);
        }
    };

    useEffect(() => {
        // Load session data
        const email = localStorage.getItem("email");
        const token = localStorage.getItem("access_token");
        setUserEmail(email || "Guest User");

        // Load correct history based on auth status
        if (token) {
            fetchSessions(token);
        } else {
            const savedHistory = JSON.parse(localStorage.getItem("guest_chat_history") || "[]");
            setChatHistory(savedHistory);
        }

        if (location.state?.mode) {
            setCurrentMode(location.state.mode);
        }
    }, [location.state]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(prev => prev + " " + transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop any current speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!inputValue.trim()) return;

        const userMessage = {
            role: "user",
            content: inputValue,
            attachment: selectedFile ? { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type } : null
        };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputValue("");
        setSelectedFile(null); // Clear file after sending
        setIsLoading(true);

        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/ask`,
                {
                    message: userMessage.content,
                    system_prompt: currentMode === "study" ? "You are a professional tutor. Help the user study this topic." : "You are a helpful assistant.",
                    session_id: currentSessionId
                },
                {
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        "Content-Type": "application/json"
                    }
                }
            );

            const aiContent = response.data.response || response.data.ai_response || response.data.content || "No response content from server.";
            const updatedMessages = [...newMessages, { role: "assistant", content: aiContent }];
            setMessages(updatedMessages);

            if (response.data.session_id && !currentSessionId) {
                setCurrentSessionId(response.data.session_id);
            }

            // Update History (only for guests or to trigger re-fetch)
            if (!token) {
                updateHistory(userMessage.content, updatedMessages);
            } else {
                fetchSessions(token);
            }
        } catch (error) {
            console.error("AI Error:", error);
            let aiResponse = "I'm having trouble connecting to the backend. (Error: " + error.message + ")";
            const errorMessages = [...newMessages, { role: "assistant", content: aiResponse }];
            setMessages(errorMessages);
        } finally {
            setIsLoading(false);
        }
    };

    const updateHistory = (title, fullChat) => {
        const token = localStorage.getItem("access_token");
        const historyKey = token ? "chat_history" : "guest_chat_history";

        const newHistoryItem = {
            id: Date.now(),
            title: title.substring(0, 30) + (title.length > 30 ? "..." : ""),
            messages: fullChat,
            timestamp: new Date().toLocaleString(),
            mode: currentMode
        };
        const updatedHistory = [newHistoryItem, ...chatHistory].slice(0, 20); // Keep last 20
        setChatHistory(updatedHistory);
        localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    };

    const loadSession = async (item) => {
        if (item.isBackend) {
            try {
                const token = localStorage.getItem("access_token");
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/history/${item.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(res.data.history);
                setCurrentSessionId(item.id);
            } catch (err) {
                console.error("Failed to load session history", err);
            }
        } else {
            setMessages(item.messages);
            setCurrentSessionId(null);
        }
        setCurrentMode(item.mode || "chat");
    };

    const handleNewChat = () => {
        setMessages([]);
        setCurrentMode("chat");
        setInputValue("");
        setCurrentSessionId(null);
        setActiveSidebarTab("actions");
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("token_type");
        localStorage.removeItem("email");
        localStorage.removeItem("chat_history"); // Explicitly clear history from storage
        setChatHistory([]);
        navigate("/login");
    };

    const exportChat = () => {
        const chatText = messages.map(m => `**${m.role === 'user' ? 'You' : 'PixelAI'}**: ${m.content}`).join('\n\n');
        const blob = new Blob([`# PixelAI Chat Export\n\n${chatText}`], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${Date.now()}.md`;
        a.click();
    };

    const quickActions = [
        { label: "New Chat", icon: "M12 4v16m8-8H4", color: "text-indigo-400", action: handleNewChat },
        { label: "Create Image", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", color: "text-purple-400", action: () => { setCurrentMode("image"); setActiveSidebarTab("actions"); } },
        { label: "Study Mode", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", color: "text-emerald-400", action: () => { setCurrentMode("study"); setActiveSidebarTab("actions"); } },
        { label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", color: "text-gray-400", action: () => { setCurrentMode("settings"); setActiveSidebarTab("actions"); } },
    ];

    const renderMainContent = () => {
        if (currentMode === "settings") {
            return (
                <div className={`flex flex-col items-center justify-center min-h-[60vh] text-center rounded-3xl border p-8 transition-all animate-in fade-in zoom-in duration-300 ${isDarkMode ? "bg-gray-900/40 border-gray-800" : "bg-white border-gray-200 shadow-xl"}`}>
                    <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Application Settings</h2>
                    <div className="w-full max-w-md space-y-4">
                        <div className={`flex items-center justify-between p-4 rounded-xl ${isDarkMode ? "bg-gray-800/50" : "bg-gray-100"}`}>
                            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>Dark Mode</span>
                            <div
                                onClick={() => {
                                    const nextTheme = !isDarkMode;
                                    setIsDarkMode(nextTheme);
                                    localStorage.setItem("theme", nextTheme ? "dark" : "light");
                                }}
                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${isDarkMode ? "bg-indigo-600" : "bg-gray-300"}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isDarkMode ? "right-1" : "left-1"}`}></div>
                            </div>
                        </div>
                        <div className={`flex items-center justify-between p-4 rounded-xl ${isDarkMode ? "bg-gray-800/50" : "bg-gray-100"}`}>
                            <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>AI Model</span>
                            <select className={`rounded-lg px-2 py-1 outline-none text-sm border transition-colors ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}>
                                <option>Pixel-LLM v2 (GPT-4o)</option>
                                <option>Pixel-Lite</option>
                            </select>
                        </div>
                        {userEmail !== "Guest User" ? (
                            <div className={`pt-6 border-t mt-4 ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}>
                                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all font-medium">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <div className={`pt-6 border-t mt-4 ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}>
                                <button onClick={() => navigate("/login")} className="w-full flex items-center justify-center gap-2 p-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-xl border border-indigo-500/20 transition-all font-medium">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign In to Save History
                                </button>
                            </div>
                        )}
                        <button onClick={() => setCurrentMode("chat")} className={`mt-4 transition-colors text-sm underline ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}>
                            Back to Chat
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-gray-400 text-sm font-medium">
                        {currentMode === "image" ? "Image Generation" : currentMode === "study" ? "Study Mode" : "AI Assistant"}
                    </h2>
                    {messages.length > 0 && (
                        <button onClick={exportChat} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs transition-all border border-gray-700">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export Markdown
                        </button>
                    )}
                </div>

                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                        <div className="mb-6">
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Powered by PixelAI
                            </span>
                        </div>
                        <h1 className={`text-3xl md:text-5xl font-bold mb-3 leading-tight tracking-tight transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {currentMode === "image" ? "What should I create?" : currentMode === "study" ? "What are we studying today?" : "What can I help with?"}
                        </h1>
                        <p className={`text-base md:text-lg mb-10 max-w-md mx-auto transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}>
                            {currentMode === "image" ? "Describe the image you want me to generate." : currentMode === "study" ? "Enter a topic or paste text to summarize." : "Ask anything — get instant, intelligent answers."}
                        </p>

                        {/* Quick Suggestion Tiles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                            {[
                                { title: "Write a code", desc: "Generate a function or debug a snippet", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
                                { title: "Write a blog", desc: "Create a post for your website or Social Media", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
                                { title: "Summarize text", desc: "Get the key points from long articles", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
                                { title: "Plan a trip", desc: "Create an itinerary for your next adventure", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
                            ].map((tile) => (
                                <button
                                    key={tile.title}
                                    onClick={() => setInputValue(tile.title + " ")}
                                    className={`flex flex-col items-start p-4 rounded-2xl border ${tile.color} hover:scale-[1.02] transition-all duration-300 text-left group shadow-lg ${isDarkMode ? "shadow-black/10" : "shadow-indigo-500/5 bg-white border-indigo-100"}`}
                                >
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${isDarkMode ? "bg-gray-900/60" : "bg-gray-100"}`}>
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tile.icon} />
                                        </svg>
                                    </div>
                                    <h3 className={`font-bold transition-colors ${isDarkMode ? "text-gray-200 group-hover:text-white" : "text-gray-800 group-hover:text-indigo-600"}`}>{tile.title}</h3>
                                    <p className={`text-xs mt-1 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{tile.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto max-h-[65vh] space-y-6 mb-4 pr-2 custom-scrollbar p-1">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-lg ${msg.role === "user" ? "bg-gradient-to-br from-indigo-500 to-purple-600" : "bg-gray-800 border border-gray-700"}`}>
                                    {msg.role === "user" ? (
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    ) : (
                                        <div className="relative">
                                            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 21h6l-.75-4M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-gray-900"></div>
                                        </div>
                                    )}
                                </div>
                                {/* Message Bubble */}
                                <div className={`flex flex-col space-y-1 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${msg.role === "user" ? "text-indigo-400" : "text-purple-400"} px-1`}>
                                        {msg.role === "user" ? "You" : "PixelAI"}
                                    </span>
                                    <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-xl backdrop-blur-sm transition-all duration-300 ${msg.role === "user"
                                        ? "bg-indigo-600/90 text-white rounded-tr-none border border-indigo-500/30"
                                        : isDarkMode
                                            ? "bg-gray-800/90 text-gray-200 rounded-tl-none border border-gray-700/50"
                                            : "bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-indigo-500/10 shadow-sm"
                                        }`}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: ({ node, ...props }) => <h1 className={`text-xl font-bold mb-2 border-b pb-1 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-md font-bold mb-1" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                code: ({ node, inline, ...props }) =>
                                                    inline ?
                                                        <code className={`px-1 rounded ${isDarkMode ? "bg-gray-700 text-indigo-300" : "bg-gray-100 text-indigo-600"}`} {...props} /> :
                                                        <pre className={`p-3 rounded-lg border overflow-x-auto my-2 ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                                                            <code className={isDarkMode ? "text-indigo-400" : "text-indigo-700"} {...props} />
                                                        </pre>
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>

                                        {msg.role === "assistant" && (
                                            <button
                                                onClick={() => speak(msg.content)}
                                                className="mt-2 p-1.5 rounded-lg bg-gray-700/30 hover:bg-gray-700 transition-colors text-gray-500 hover:text-white flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider group"
                                                title="Speak response"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">Listen</span>
                                            </button>
                                        )}
                                    </div>
                                    {msg.attachment && (
                                        <div className="flex items-center gap-2 mt-2 p-2 px-3 bg-gray-900/50 border border-gray-800 rounded-lg text-[11px] text-gray-400">
                                            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                            <span className="truncate max-w-[150px]">{msg.attachment.name}</span>
                                            <span className="text-[9px] opacity-50">({(msg.attachment.size / 1024).toFixed(1)} KB)</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-4 animate-pulse">
                                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 21h6l-.75-4M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <div className="flex flex-col space-y-1">
                                    <div className="bg-gray-800/60 p-4 rounded-2xl rounded-tl-none border border-gray-700/50 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-300"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                <div className={`w-full max-w-3xl mx-auto sticky bottom-0 backdrop-blur-md pb-4 pt-2 transition-colors ${isDarkMode ? "bg-gray-950/80" : "bg-gray-50/80"}`}>
                    {/* Floating Suggestion Tags above input */}
                    <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
                        {["Write code", "Write a Blog", "Summarize", "Mental Health Help"].map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setInputValue(tag + " ")}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all duration-300 ${isDarkMode
                                    ? "bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/5"
                                    : "bg-white border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50"}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    {/* File Attachment Preview */}
                    {selectedFile && (
                        <div className="flex items-center gap-2 mb-3 animate-in fade-in slide-in-from-bottom-1">
                            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs font-semibold shadow-lg">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span className="max-w-[120px] truncate">{selectedFile.name}</span>
                                <button onClick={removeFile} className="ml-1 p-0.5 hover:bg-indigo-500/20 rounded-md transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSend} className={`flex items-center gap-3 border rounded-2xl px-5 py-4 shadow-xl transition-all duration-300 ${isDarkMode
                        ? "bg-gray-900 border-gray-800 shadow-black/20 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50"
                        : "bg-white border-gray-200 shadow-indigo-500/5 focus-within:ring-2 focus-within:ring-indigo-600/10 focus-within:border-indigo-600/30"}`}>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <button type="button" onClick={triggerFileSelect} className={`p-1 transition-colors ${isDarkMode ? "hover:text-indigo-400 text-gray-500" : "hover:text-indigo-600 text-gray-400"}`} title="Attach file">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
                            placeholder={currentMode === "image" ? "Describe image..." : "Type something..."}
                            className={`flex-1 bg-transparent border-none outline-none text-sm resize-none h-6 mt-1.5 custom-scrollbar ${isDarkMode ? "text-white placeholder-gray-600" : "text-gray-900 placeholder-gray-400"}`}
                        />
                        <button
                            type="button"
                            onClick={toggleListening}
                            className={`p-1 transition-all duration-300 ${isListening ? "text-red-500 animate-pulse scale-125" : isDarkMode ? "text-gray-500 hover:text-indigo-400" : "text-gray-400 hover:text-indigo-600"}`}
                            title={isListening ? "Listening..." : "Voice input"}
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </button>
                        <svg className="h-5 w-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <input
                            type="text"
                            placeholder={currentMode === "image" ? "Describe an image..." : "Ask anything..."}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="flex-1 outline-none bg-transparent text-white placeholder-gray-500 text-base"
                        />
                        <button type="submit" className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 hover:scale-105 shadow-lg shadow-indigo-500/25">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className={`min-h-screen transition-colors duration-500 relative overflow-hidden ${isDarkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}`}>
            <style>
                {`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: ${isDarkMode ? "#334155" : "#cbd5e1"}; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${isDarkMode ? "#475569" : "#94a3b8"}; }
                `}
            </style>
            <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${isDarkMode ? "bg-indigo-600/10" : "bg-indigo-600/5"} rounded-full filter blur-3xl`}></div>
            <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${isDarkMode ? "bg-purple-600/10" : "bg-purple-600/5"} rounded-full filter blur-3xl`}></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Reorganized Sidebar */}
                    <div className="lg:col-span-1">
                        <div className={`backdrop-blur-md border rounded-3xl h-[80vh] flex flex-col sticky top-24 overflow-hidden shadow-2xl transition-all duration-500 ${isDarkMode ? "bg-gray-900/60 border-gray-800/60" : "bg-white/80 border-gray-200"}`}>
                            {/* Sidebar Header: Primary Actions */}
                            <div className={`p-4 space-y-3 border-b ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
                                <button
                                    onClick={handleNewChat}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 group"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                    New Chat
                                </button>
                                <button
                                    onClick={() => { setMessages([]); setCurrentMode("image"); }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left border ${currentMode === "image" ? "bg-gray-800 border-gray-700 shadow-lg text-white" : "hover:bg-gray-800/40 border-transparent text-gray-400 hover:text-white"}`}
                                >
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${currentMode === "image" ? "bg-purple-600 shadow-purple-500/40" : "bg-gray-800"}`}>
                                        <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Create Image</span>
                                </button>
                                <button
                                    onClick={() => { setMessages([]); setCurrentMode("study"); }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left border ${currentMode === "study" ? "bg-emerald-600/20 border-emerald-500/50 shadow-lg text-emerald-400" : isDarkMode ? "hover:bg-gray-800/40 border-transparent text-gray-400 hover:text-white" : "hover:bg-gray-200/40 border-transparent text-gray-500 hover:text-gray-900"}`}
                                >
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${currentMode === "study" ? "bg-emerald-600 shadow-emerald-500/40 text-white" : isDarkMode ? "bg-gray-800" : "bg-gray-200"}`}>
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Study Mode</span>
                                </button>
                                <button
                                    onClick={() => setCurrentMode("settings")}
                                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left border ${currentMode === "settings" ? "bg-gray-800 border-gray-700 shadow-lg text-white" : isDarkMode ? "hover:bg-gray-800/40 border-transparent text-gray-400 hover:text-white" : "hover:bg-gray-200/40 border-transparent text-gray-500 hover:text-gray-900"}`}
                                >
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${currentMode === "settings" ? "bg-indigo-600 shadow-indigo-500/40 text-white" : isDarkMode ? "bg-gray-800" : "bg-gray-200"}`}>
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Settings</span>
                                </button>
                            </div>

                            {/* Tabs Header */}
                            <div className={`flex border-b transition-colors ${isDarkMode ? "border-gray-800 bg-gray-900/40" : "border-gray-100 bg-gray-50/50"}`}>
                                {['history', 'profile'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveSidebarTab(tab)}
                                        className={`flex-1 py-3 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${activeSidebarTab === tab ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5 text-shadow-sm shadow-indigo-500/10" : "text-gray-500 hover:text-gray-400"}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {activeSidebarTab === 'history' && (
                                    <div className="p-4 space-y-2">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <h2 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Existing Chats</h2>
                                            <button onClick={() => { setChatHistory([]); localStorage.setItem(localStorage.getItem("access_token") ? "chat_history" : "guest_chat_history", "[]"); }} className="text-[9px] text-gray-600 hover:text-red-400 transition-colors uppercase font-bold">Clear All</button>
                                        </div>
                                        {chatHistory.length === 0 ? (
                                            <div className="text-center py-10">
                                                <p className="text-gray-600 text-[10px] font-medium uppercase tracking-tighter italic">No recent sessions found.</p>
                                            </div>
                                        ) : (
                                            chatHistory.map(item => (
                                                <button key={item.id} onClick={() => loadSession(item)} className={`w-full text-left p-3 rounded-xl border border-transparent transition-all group flex flex-col gap-1 ${isDarkMode ? "hover:bg-gray-800/40 hover:border-gray-800" : "hover:bg-gray-100 hover:border-gray-200"}`}>
                                                    <p className={`text-xs font-medium truncate transition-colors ${isDarkMode ? "text-gray-300 group-hover:text-white" : "text-gray-700 group-hover:text-indigo-600"}`}>{item.title}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-[9px] font-mono italic ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>{item.timestamp}</span>
                                                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${isDarkMode ? "bg-gray-800 text-gray-500" : "bg-gray-200 text-gray-500"}`}>{item.mode || 'chat'}</span>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeSidebarTab === 'profile' && (
                                    <div className="p-6 flex flex-col items-center text-center space-y-4">
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-xl shadow-indigo-500/20 overflow-hidden">
                                                <div className="w-full h-full rounded-3xl bg-gray-900 flex items-center justify-center relative">
                                                    <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                                        <span className="text-[10px] text-white font-bold uppercase">Upload</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1 w-full text-center">
                                            <h3 className={`font-black text-base uppercase tracking-tight transition-colors ${isDarkMode ? "text-white" : "text-gray-900"}`}>{userEmail === "Guest User" ? "Guest Identity" : "Pixel Master"}</h3>
                                            <p className={`text-[10px] font-mono truncate px-4 transition-colors ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{userEmail}</p>
                                        </div>

                                        <div className="w-full space-y-2">
                                            <p className={`text-[9px] uppercase font-black text-left pl-1 tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>About You</p>
                                            <textarea
                                                placeholder="Craft your bio here..."
                                                value={userBio}
                                                onChange={(e) => { setUserBio(e.target.value); localStorage.setItem("user_bio", e.target.value); }}
                                                className={`w-full border rounded-2xl p-4 text-[11px] placeholder-gray-500 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none resize-none h-24 shadow-inner transition-all duration-300 ${isDarkMode ? "bg-gray-900/80 border-gray-800 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"}`}
                                            ></textarea>
                                        </div>

                                        <div className="w-full space-y-3">
                                            <button className="w-full p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                                                Upgrade to Pro
                                            </button>
                                            {userEmail !== "Guest User" ? (
                                                <button onClick={handleLogout} className="w-full p-4 bg-gray-800/50 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-2xl text-xs font-bold transition-all border border-gray-700 hover:border-red-500/20">
                                                    Sign Out
                                                </button>
                                            ) : (
                                                <button onClick={() => navigate("/login")} className="w-full p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20">
                                                    Sign In
                                                </button>
                                            )}
                                        </div>

                                        <div className="w-full pt-4 space-y-3 text-left">
                                            <div className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-indigo-500/5 border-indigo-500/10" : "bg-indigo-50 border-indigo-100"}`}>
                                                <p className={`text-[10px] uppercase font-bold mb-1 tracking-wider ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Plan</p>
                                                <p className="text-indigo-400 text-xs font-bold">{userEmail === "Guest User" ? "Limited Guest Explorer" : "Pixel Master"}</p>
                                            </div>
                                            <div className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? "bg-gray-800/30 border-gray-800" : "bg-gray-50 border-gray-200"}`}>
                                                <p className={`text-[10px] uppercase font-bold mb-1 tracking-wider ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Status</p>
                                                <p className={`${userEmail === "Guest User" ? "text-orange-400" : "text-emerald-400"} text-xs font-bold flex items-center gap-1.5`}>
                                                    <span className={`w-1.5 h-1.5 ${userEmail === "Guest User" ? "bg-orange-500" : "bg-emerald-500"} rounded-full animate-pulse`}></span>
                                                    {userEmail === "Guest User" ? "Guest Access" : "Certified Pro"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Footer User Info */}
                            <div className={`p-4 border-t transition-colors ${isDarkMode ? "border-gray-800 bg-gray-900/20" : "border-gray-100 bg-gray-50/80"}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-lg shadow-indigo-500/20">
                                        {userEmail.charAt(0)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className={`text-[10px] font-bold truncate uppercase tracking-tighter ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{userEmail.split('@')[0]}</p>
                                        <div className={`w-full h-1 rounded-full mt-1 ${isDarkMode ? "bg-gray-800" : "bg-gray-200"}`}>
                                            <div className={`h-full transition-all duration-1000 ${userEmail === "Guest User" ? "w-1/4 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" : "w-3/4 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"} rounded-full`}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        {renderMainContent()}
                        {currentMode !== "settings" && (
                            <p className="text-xs text-gray-700 mt-6 text-center max-w-md mx-auto">
                                PixelAI is powered by GPT-4o architecture. {userEmail === "Guest User" ? "Public Edition" : "Pro Plan active"}.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
