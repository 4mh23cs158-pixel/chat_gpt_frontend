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
    const [activeSidebarTab, setActiveSidebarTab] = useState("actions"); // actions, history, profile
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        // Load session data
        const email = localStorage.getItem("email");
        const token = localStorage.getItem("access_token");
        setUserEmail(email || "Guest User");

        // Only load history if authenticated to prevent leakage into Guest Mode
        if (token) {
            const savedHistory = JSON.parse(localStorage.getItem("chat_history") || "[]");
            setChatHistory(savedHistory);
        } else {
            setChatHistory([]); // Ensure empty history for guests
        }

        if (location.state?.mode) {
            setCurrentMode(location.state.mode);
        }
    }, [location.state]);

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
                "http://127.0.0.1:8000/ask",
                {
                    message: userMessage.content,
                    system_prompt: currentMode === "study" ? "You are a professional tutor. Help the user study this topic." : "You are a helpful assistant."
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

            // Update History
            updateHistory(userMessage.content, updatedMessages);
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

        const newHistoryItem = {
            id: Date.now(),
            title: title.substring(0, 30) + (title.length > 30 ? "..." : ""),
            messages: fullChat,
            timestamp: new Date().toLocaleString(),
            mode: currentMode
        };
        const updatedHistory = [newHistoryItem, ...chatHistory].slice(0, 20); // Keep last 20
        setChatHistory(updatedHistory);

        // Only persist to localStorage if logged in
        if (token) {
            localStorage.setItem("chat_history", JSON.stringify(updatedHistory));
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setCurrentMode("chat");
        setInputValue("");
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
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center bg-gray-900/40 rounded-3xl border border-gray-800 p-8 transition-all animate-in fade-in zoom-in duration-300">
                    <h2 className="text-2xl font-bold text-white mb-6">Application Settings</h2>
                    <div className="w-full max-w-md space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                            <span className="text-gray-300">Dark Mode</span>
                            <div className="w-12 h-6 bg-indigo-600 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                            <span className="text-gray-300">AI Model</span>
                            <select className="bg-gray-700 text-white rounded-lg px-2 py-1 outline-none text-sm border border-gray-600">
                                <option>Pixel-LLM v2 (GPT-4o)</option>
                                <option>Pixel-Lite</option>
                            </select>
                        </div>
                        <div className="pt-6 border-t border-gray-800 mt-4">
                            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all font-medium">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                        <button onClick={() => setCurrentMode("chat")} className="mt-4 text-gray-400 hover:text-white transition-colors text-sm underline">
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
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight tracking-tight">
                            {currentMode === "image" ? "What should I create?" : currentMode === "study" ? "What are we studying today?" : "What can I help with?"}
                        </h1>
                        <p className="text-gray-500 text-base md:text-lg mb-10 max-w-md mx-auto">
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
                                    className={`flex flex-col items-start p-4 rounded-2xl border ${tile.color} hover:scale-[1.02] transition-all duration-300 text-left group shadow-lg shadow-black/10`}
                                >
                                    <div className="h-10 w-10 rounded-xl bg-gray-900/60 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tile.icon} />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-gray-200 group-hover:text-white transition-colors">{tile.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{tile.desc}</p>
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
                                    <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-xl backdrop-blur-sm ${msg.role === "user"
                                        ? "bg-indigo-600/90 text-white rounded-tr-none border border-indigo-500/30"
                                        : "bg-gray-800/90 text-gray-200 rounded-tl-none border border-gray-700/50"
                                        }`}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 border-b border-gray-700 pb-1" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-md font-bold mb-1" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                code: ({ node, inline, ...props }) =>
                                                    inline ?
                                                        <code className="bg-gray-700 px-1 rounded text-indigo-300" {...props} /> :
                                                        <pre className="bg-gray-900 p-3 rounded-lg border border-gray-700 overflow-x-auto my-2">
                                                            <code className="text-indigo-400" {...props} />
                                                        </pre>
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
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

                <div className="w-full max-w-3xl mx-auto sticky bottom-0 bg-gray-950/80 backdrop-blur-md pb-4 pt-2">
                    {/* Floating Suggestion Tags above input */}
                    <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
                        {["Write code", "Write a Blog", "Summarize", "Mental Health Help"].map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setInputValue(tag + " ")}
                                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-gray-400 text-[11px] font-medium hover:text-white hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-300"
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

                    <form onSubmit={handleSend} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 shadow-xl shadow-black/20 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all duration-300">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <button type="button" onClick={triggerFileSelect} className="p-1 hover:text-indigo-400 text-gray-500 transition-colors">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
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
        <div className="min-h-screen bg-gray-950 px-4 py-8 md:py-12 relative overflow-hidden">
            <style>
                {`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
                `}
            </style>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Reorganized Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800/60 rounded-3xl h-[80vh] flex flex-col sticky top-24 overflow-hidden shadow-2xl">
                            {/* Tabs Header */}
                            <div className="flex border-b border-gray-800">
                                {['actions', 'history', 'profile'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveSidebarTab(tab)}
                                        className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase transition-all duration-300 ${activeSidebarTab === tab ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5" : "text-gray-500 hover:text-gray-300"}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                                {activeSidebarTab === 'actions' && (
                                    <div className="p-4 space-y-3">
                                        <h2 className="text-sm font-semibold text-gray-400 mb-4 px-2 tracking-wide uppercase">Quick Actions</h2>
                                        {quickActions.map((action) => (
                                            <button
                                                key={action.label}
                                                onClick={action.action}
                                                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left group ${(action.label === "New Chat" && currentMode === "chat") || (action.label === "Create Image" && currentMode === "image") || (action.label === "Study Mode" && currentMode === "study") || (action.label === "Settings" && currentMode === "settings") ? "bg-gray-800 shadow-lg border border-gray-700" : "hover:bg-gray-800/40 border border-transparent"}`}
                                            >
                                                <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 ${(action.label === "New Chat" && currentMode === "chat") ? "bg-indigo-600 text-white shadow-indigo-500/40 scale-110" : "bg-gray-800 group-hover:bg-gray-700"}`}>
                                                    <svg className={`h-4.5 w-4.5 ${action.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={action.icon} /></svg>
                                                </div>
                                                <span className={`text-sm font-medium transition-colors ${(action.label === "New Chat" && currentMode === "chat") ? "text-white" : "text-gray-400 group-hover:text-white"}`}>{action.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {activeSidebarTab === 'history' && (
                                    <div className="p-4 space-y-2">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <h2 className="text-sm font-semibold text-gray-400 tracking-wide uppercase">History</h2>
                                            <button onClick={() => { setChatHistory([]); localStorage.setItem("chat_history", "[]"); }} className="text-[10px] text-gray-600 hover:text-red-400 transition-colors uppercase font-bold">Clear All</button>
                                        </div>
                                        {chatHistory.length === 0 ? (
                                            <div className="text-center py-10">
                                                <p className="text-gray-600 text-xs">No recent chats.</p>
                                            </div>
                                        ) : (
                                            chatHistory.map(item => (
                                                <button key={item.id} onClick={() => { setMessages(item.messages); setCurrentMode(item.mode); }} className="w-full text-left p-3 rounded-xl hover:bg-gray-800/40 border border-transparent hover:border-gray-800 transition-all group">
                                                    <p className="text-xs text-gray-300 font-medium truncate group-hover:text-white">{item.title}</p>
                                                    <span className="text-[9px] text-gray-600">{item.timestamp}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeSidebarTab === 'profile' && (
                                    <div className="p-6 flex flex-col items-center text-center space-y-4">
                                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-xl shadow-indigo-500/20">
                                            <div className="w-full h-full rounded-3xl bg-gray-900 flex items-center justify-center">
                                                <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-white font-bold text-lg">{userEmail === "Guest User" ? "Guest Identity" : "Active User"}</h3>
                                            <p className="text-gray-500 text-xs font-medium">{userEmail}</p>
                                        </div>
                                        <div className="w-full pt-4 space-y-3">
                                            <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-left">
                                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-wider">Plan</p>
                                                <p className="text-indigo-400 text-xs font-bold">{userEmail === "Guest User" ? "Limited Guest Explorer" : "Pixel Pro Explorer"}</p>
                                            </div>
                                            <div className="p-4 bg-gray-800/30 rounded-2xl border border-gray-800 text-left">
                                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-wider">Status</p>
                                                <p className={`${userEmail === "Guest User" ? "text-orange-400" : "text-emerald-400"} text-xs font-bold flex items-center gap-1.5`}>
                                                    <span className={`w-1.5 h-1.5 ${userEmail === "Guest User" ? "bg-orange-500" : "bg-emerald-500"} rounded-full animate-pulse`}></span>
                                                    {userEmail === "Guest User" ? "Guest Access" : "Authenticated"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Footer User Info */}
                            <div className="p-4 border-t border-gray-800 bg-gray-900/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                        {userEmail.charAt(0)}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-[10px] font-bold text-gray-400 truncate uppercase tracking-tighter">{userEmail.split('@')[0]}</p>
                                        <div className="w-full h-1 bg-gray-800 rounded-full mt-1">
                                            <div className={`h-full ${userEmail === "Guest User" ? "w-1/4 bg-orange-500" : "w-3/4 bg-indigo-500"} rounded-full`}></div>
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
