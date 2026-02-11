import React from "react";

const Contacts = () => {
  return (
    <div className="min-h-screen bg-gray-950 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 -right-40 w-80 h-80 bg-indigo-600/8 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 -left-40 w-80 h-80 bg-purple-600/8 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-xl mx-auto">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
          Contact Us
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Have a question or feedback? We'd love to hear from you.
        </p>

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">Name</label>
            <input
              type="text"
              placeholder="Your name"
              className="appearance-none block w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl shadow-sm placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all duration-200 hover:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="appearance-none block w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl shadow-sm placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all duration-200 hover:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1">Message</label>
            <textarea
              rows="4"
              placeholder="Write your message..."
              className="appearance-none block w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl shadow-sm placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all duration-200 hover:bg-gray-800 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/25 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-[1.02]"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contacts;