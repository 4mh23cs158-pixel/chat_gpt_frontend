import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("token_type");
        navigate("/login");
    };

    const stats = [
        { label: "Total Chats", value: "128", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", color: "from-indigo-500 to-indigo-600" },
        { label: "Images Created", value: "34", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", color: "from-purple-500 to-purple-600" },
        { label: "Words Generated", value: "12.4k", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "from-pink-500 to-pink-600" },
        { label: "Time Saved", value: "48h", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "from-emerald-500 to-emerald-600" },
    ];

    const recentChats = [
        { title: "Help me write a Python script", time: "2 min ago" },
        { title: "Explain React hooks", time: "1 hour ago" },
        { title: "Generate a landing page design", time: "3 hours ago" },
        { title: "Debug my FastAPI application", time: "Yesterday" },
    ];

    return (
        <div className="min-h-screen bg-gray-950 relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full filter blur-3xl"></div>
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full filter blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Welcome section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">
                            Welcome back! 👋
                        </h1>
                        <p className="text-gray-400">
                            Here's what's happening with your PixelAI account.
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-700 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600 transition-all duration-200"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/60 rounded-2xl p-5 hover:border-gray-700 transition-all duration-300 hover:shadow-lg group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent chats */}
                    <div className="lg:col-span-2 bg-gray-900/60 backdrop-blur-sm border border-gray-800/60 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Recent Chats</h2>
                        <div className="space-y-3">
                            {recentChats.map((chat, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-800/50 transition-all duration-200 cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                            <svg className="h-4 w-4 text-gray-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-gray-300">{chat.title}</span>
                                    </div>
                                    <span className="text-xs text-gray-600">{chat.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/60 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            {[
                                { label: "New Chat", icon: "M12 4v16m8-8H4", color: "text-indigo-400" },
                                { label: "Create Image", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", color: "text-purple-400" },
                                { label: "Study Mode", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", color: "text-emerald-400" },
                                { label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", color: "text-gray-400" },
                            ].map((action) => (
                                <button
                                    key={action.label}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 transition-all duration-200 text-left group"
                                >
                                    <div className="h-9 w-9 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                                        <svg className={`h-4 w-4 ${action.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={action.icon} />
                                        </svg>
                                    </div>
                                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
