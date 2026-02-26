import React from 'react';

export const StatCard = ({ label, value, subValue, icon: Icon, color }) => {
    const colorStyles = {
        blue: { icon: "bg-blue-500/10 text-blue-400", sub: "text-blue-500/70", bg: "bg-blue-500/5" },
        emerald: { icon: "bg-emerald-500/10 text-emerald-400", sub: "text-emerald-500/70", bg: "bg-emerald-500/5" },
        indigo: { icon: "bg-indigo-500/10 text-indigo-400", sub: "text-indigo-500/70", bg: "bg-indigo-500/5" },
        orange: { icon: "bg-orange-500/10 text-orange-400", sub: "text-orange-500/70", bg: "bg-orange-500/5" }
    };

    const theme = colorStyles[color] || colorStyles.blue;

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 ${theme.bg} rounded-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-110`} />
            <div className="flex items-center gap-4 relative z-10">
                <div className={`p-3 rounded-xl ${theme.icon}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
                    <h3 className="text-2xl font-black text-white">{value}</h3>
                    {subValue && <p className={`text-[10px] font-bold ${theme.sub} mt-0.5`}>{subValue}</p>}
                </div>
            </div>
        </div>
    );
};
