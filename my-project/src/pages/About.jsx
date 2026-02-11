import React from "react";

const About = () => {
  return (
    <div className="min-h-screen bg-gray-950 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 -left-40 w-80 h-80 bg-indigo-600/8 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 -right-40 w-80 h-80 bg-purple-600/8 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
          About PixelAI
        </h1>
        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
          PixelAI is a next-generation AI assistant designed to help you with anything — from creative tasks to complex problem-solving. Our mission is to make powerful AI accessible to everyone.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {[
            { title: "⚡ Lightning Fast", desc: "Get instant responses powered by cutting-edge AI models." },
            { title: "🔒 Secure & Private", desc: "Your data is encrypted and never shared with third parties." },
            { title: "🎨 Creative Partner", desc: "Generate images, write content, and brainstorm ideas together." },
            { title: "🌍 Always Available", desc: "Access PixelAI anytime, anywhere, on any device." },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-gray-900/60 backdrop-blur-sm border border-gray-800/60 rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;