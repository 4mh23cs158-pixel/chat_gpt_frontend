import React from "react";

const Home = () => {
    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Background glow effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full filter blur-3xl"></div>

            {/* Main content */}
            <div className="relative z-10 text-center">
                <div className="mb-6">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Powered by PixelAI
                    </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
                    What can I help with?
                </h1>
                <p className="text-gray-500 text-base md:text-lg mb-8 max-w-md mx-auto">
                    Ask anything — get instant, intelligent answers.
                </p>

                {/* Input box */}
                <div className="w-full max-w-xl mx-auto">
                    <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 shadow-xl shadow-black/20 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all duration-300">
                        <svg className="h-5 w-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Ask anything..."
                            className="flex-1 outline-none bg-transparent text-white placeholder-gray-500 text-base"
                        />
                        <button className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 hover:scale-105 shadow-lg shadow-indigo-500/25">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-5 justify-center">
                        {[
                            { label: "Attach", icon: "M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" },
                            { label: "Search", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
                            { label: "Study", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
                            { label: "Create image", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
                        ].map((item) => (
                            <button
                                key={item.label}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-800/60 hover:border-gray-700 transition-all duration-200"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer text */}
            <p className="text-xs text-gray-600 mt-16 text-center max-w-md relative z-10">
                By messaging PixelAI, you agree to our Terms and have read our Privacy
                Policy.
            </p>
        </div>
    );
};

export default Home;