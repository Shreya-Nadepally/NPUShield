import React from 'react';

export const NavButton = ({ active, icon: Icon, label, onClick, color = "blue" }) => {
    const colorClasses = {
        blue: active ? "from-blue-500/20 to-indigo-500/5 text-blue-400 border-blue-500/30 shadow-blue-500/10" : "",
        rose: active ? "from-rose-500/20 to-orange-500/5 text-rose-400 border-rose-500/30 shadow-rose-500/10" : "",
        emerald: active ? "from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10" : ""
    };

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 border ${active
                ? `bg-gradient-to-r ${colorClasses[color]} shadow-lg translate-x-1`
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
        >
            <Icon className={`w-5 h-5 ${active ? "animate-pulse" : ""}`} />
            {label}
        </button>
    );
};
