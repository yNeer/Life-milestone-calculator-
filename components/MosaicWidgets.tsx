import React, { useState, useEffect } from 'react';
import { Sun, Moon, Calendar, TrendingUp, Clock } from 'lucide-react';
import { format, getDayOfYear, isLeapYear, differenceInDays } from 'date-fns';

// --- Helper Functions ---

const getZodiacSign = (date: Date) => {
    const days = [21, 20, 21, 20, 21, 22, 23, 23, 23, 24, 22, 22];
    const signs = ["Aquarius", "Pisces", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn"];
    let month = date.getMonth();
    let day = date.getDate();
    if (month === 0 && day <= 20) {
        month = 11;
    } else if (day < days[month]) {
        month--;
    }
    return signs[month];
};

// --- Widgets ---

export const LiveClockWidget: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="bg-skin-card/40 backdrop-blur-2xl p-5 rounded-[2rem] shadow-lg border border-white/20 flex flex-col justify-center items-center h-full relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-skin-primary opacity-50"></div>
             <div className="text-[10px] font-bold uppercase tracking-widest text-skin-muted mb-1 flex items-center gap-1">
                <Clock size={10} /> Live Time
             </div>
             <div className="text-4xl md:text-5xl font-black text-skin-text tabular-nums tracking-tighter leading-none">
                 {format(time, 'HH:mm')}
                 <span className="text-lg md:text-xl text-skin-muted font-bold ml-1">{format(time, 'ss')}</span>
             </div>
             <div className="text-xs font-bold text-skin-primary mt-1">
                 {format(time, 'EEEE, MMM d')}
             </div>
        </div>
    );
};

export const ZodiacWidget: React.FC<{ dob: Date }> = ({ dob }) => {
    const sign = getZodiacSign(dob);
    return (
        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/20 flex flex-col items-center justify-center text-center h-full">
            <div className="p-2 bg-indigo-500/20 text-indigo-500 rounded-full mb-2">
                <Moon size={18} />
            </div>
            <div className="text-[10px] uppercase font-bold text-skin-muted tracking-widest">Zodiac</div>
            <div className="text-xl font-black text-skin-text mt-1">{sign}</div>
        </div>
    );
};

export const DayBornWidget: React.FC<{ dob: Date }> = ({ dob }) => {
    const dayName = format(dob, 'EEEE');
    return (
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/20 flex flex-col items-center justify-center text-center h-full">
            <div className="p-2 bg-amber-500/20 text-amber-500 rounded-full mb-2">
                <Sun size={18} />
            </div>
            <div className="text-[10px] uppercase font-bold text-skin-muted tracking-widest">Born On A</div>
            <div className="text-xl font-black text-skin-text mt-1">{dayName}</div>
        </div>
    );
};

export const YearProgressWidget: React.FC = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const isLeap = isLeapYear(now);
    const day = getDayOfYear(now);
    const totalDays = isLeap ? 366 : 365;
    const progress = (day / totalDays) * 100;

    return (
        <div className="bg-skin-card/40 backdrop-blur-2xl p-5 rounded-[2rem] shadow-lg border border-white/20 flex flex-col justify-center h-full">
             <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center gap-2">
                     <TrendingUp size={16} className="text-emerald-500"/>
                     <span className="text-xs font-bold text-skin-text">{now.getFullYear()} Progress</span>
                 </div>
                 <span className="text-xs font-bold text-emerald-500">{progress.toFixed(1)}%</span>
             </div>
             
             <div className="w-full h-3 bg-skin-base/50 rounded-full overflow-hidden border border-white/10">
                 <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                 />
             </div>
             <div className="text-[10px] text-skin-muted font-bold mt-2 text-right">
                 {totalDays - day} days left
             </div>
        </div>
    );
};
