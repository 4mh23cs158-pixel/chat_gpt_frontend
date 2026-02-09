import React from "react";

const Home = () => {
    return (
        <div className="w-full h-screen bg-white flex flex-col items-center pt-20 px-4">
            {/* Heading */}
            <h1 className="text-3xl font-semibold text-gray-800 mb-10">
                What’s on your mind today?
            </h1>

            {/* Search / Ask anything */}
            <div className="w-full max-w-3xl">
                <div className="flex items-center bg-gray-100 rounded-full px-5 py-3 shadow-sm">
                    <input
                        type="text"
                        placeholder="Ask anything"
                        className="flex-1 bg-transparent outline-none text-gray-700"
                    />
                    <button className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-full">
                        ●
                    </button>
                </div>

                {/* Options below the bar */}
                <div className="flex justify-center flex-wrap gap-3 mt-6">
                    <button className="px-4 py-2 bg-gray-100 rounded-full text-sm hover:bg-gray-200">
                        Create images
                    </button>
                    <button className="px-4 py-2 bg-gray-100 rounded-full text-sm hover:bg-gray-200">
                        Learn something
                    </button>
                    <button className="px-4 py-2 bg-gray-100 rounded-full text-sm hover:bg-gray-200">
                        Write or edit
                    </button>
                    <button className="px-4 py-2 bg-gray-100 rounded-full text-sm hover:bg-gray-200">
                        Step-by-step help
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Home;
