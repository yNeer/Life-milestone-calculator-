import React, { useEffect, useState } from 'react';
import { 
  differenceInSeconds, differenceInMinutes, differenceInHours, 
  differenceInDays, differenceInWeeks, differenceInMonths, differenceInYears
} from 'date-fns';
import { Heart, Calendar, Clock, Activity, Flag, Layers, Zap, Hourglass, Video } from 'lucide-react';
import ShareButton from './ShareButton';
import { Milestone } from '../types';
import { getGeneration, getCentury } from '../utils/generators';

interface Props {
  dob: string;
  tob: string;
  onShare: (title: string, text: string, milestone?: Milestone, type?: 'milestone' | 'age' | 'progress' | 'zodiac' | 'clock', extraData?: any) => void;
}

const CurrentAgeCard: React.FC<Props> = ({ dob, tob, onShare }) => {
  const [now, setNow] = useState(new Date());
  const [stats, setStats] = useState({
    years: 0, months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0
  });
  const [generation, setGeneration] = useState('');
  const [century, setCentury] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!dob) return;
    const [h, m] = tob.split(':').map(Number);
    const birthDate = new Date(dob);
    birthDate.setHours(h || 0, m || 0, 0, 0);

    setStats({
      years: differenceInYears(now, birthDate),
      months: differenceInMonths(now, birthDate),
      weeks: differenceInWeeks(now, birthDate),
      days: differenceInDays(now, birthDate),
      hours: differenceInHours(now, birthDate),
      minutes: differenceInMinutes(now, birthDate),
      seconds: differenceInSeconds(now, birthDate),
    });

    setGeneration(getGeneration(birthDate.getFullYear()));
    setCentury(getCentury(birthDate.getFullYear()));

  }, [now, dob, tob]);

  const shareText = `I have been alive for ${stats.seconds.toLocaleString()} seconds! That's ${stats.years} years of life. (${generation}, Born in ${century})`;

  // Minimalist Tile Component
  const StatTile = ({ label, value, icon: Icon, delay, colorClass }: { label: string, value: number, icon: any, delay: string, colorClass: string }) => (
    <div 
        className="relative overflow-hidden rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm border border-white/20 bg-skin-card/40 hover:bg-skin-card/60 transition-all group backdrop-blur-xl" 
        style={{ animationDelay: delay }}
    >
      <div className={`absolute -right-3 -bottom-3 opacity-[0.08] transform rotate-12 group-hover:scale-110 transition-transform duration-500 ${colorClass}`}>
         <Icon size={56} />
      </div>
      
      <div className="relative z-10 w-full">
        <div className="text-xl md:text-2xl font-black text-skin-text tabular-nums leading-none mb-1 tracking-tight">
          {value.toLocaleString()}
        </div>
        <div className="text-[10px] font-bold text-skin-muted uppercase tracking-widest opacity-80">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="bg-skin-card/20 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/20 p-6 flex flex-col gap-6 relative overflow-hidden group h-full">
      
      {/* 72 BPM Heartbeat Animation (60s / 72 = 0.833s) */}
      <style>{`
        @keyframes lubdub {
          0% { transform: scale(1); }
          14% { transform: scale(1.15); }
          28% { transform: scale(1); }
          42% { transform: scale(1.15); }
          70% { transform: scale(1); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Modern Header */}
      <div className="flex justify-between items-start relative z-10 px-1">
        <div className="flex flex-col gap-1">
            <h3 className="text-xs font-black text-skin-muted uppercase tracking-[0.2em] flex items-center gap-2">
                <Activity size={14} className="text-rose-500" /> Total Existence
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
                 <div className="flex items-center gap-1.5 bg-skin-card/60 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md shadow-sm">
                    <Flag size={10} className="text-indigo-500"/>
                    <span className="text-[10px] font-bold text-skin-text opacity-80">{generation}</span>
                 </div>
                 <div className="flex items-center gap-1.5 bg-skin-card/60 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md shadow-sm">
                    <Layers size={10} className="text-amber-500"/>
                    <span className="text-[10px] font-bold text-skin-text opacity-80">{century}</span>
                 </div>
            </div>
        </div>
        <div className="flex items-center gap-2">
             <button 
                onClick={() => onShare("My Life Matrix", shareText, undefined, 'age', stats)}
                className="p-2.5 rounded-full text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 shadow-sm"
                title="Create Video"
             >
                 <Video size={18} />
             </button>
             <ShareButton 
                title="My Life Matrix" 
                text={shareText} 
                className="text-skin-muted hover:text-skin-primary hover:bg-skin-primary/10 shadow-sm border border-white/10 backdrop-blur-md transition-all rounded-full p-2.5" 
                onClick={() => onShare("My Life Matrix", shareText, undefined, 'age', stats)}
             />
        </div>
      </div>

      {/* Clean Mosaic Layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10 flex-1">
          
          {/* Hero: Seconds (Clean & Airy) */}
          <div className="col-span-2 row-span-2 bg-gradient-to-b from-white/40 to-white/10 dark:from-white/10 dark:to-transparent backdrop-blur-2xl p-6 rounded-[2rem] border border-white/30 shadow-sm flex flex-col items-center justify-center gap-3 text-center relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500">
              
              <div className="absolute top-4 right-4 opacity-5">
                 <Activity size={60} className="text-skin-text" />
              </div>

              {/* Pulse Badge */}
               <div className="flex items-center gap-2 bg-rose-500/5 px-3 py-1.5 rounded-full border border-rose-500/10 mb-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                 <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Live • 72 BPM</span>
              </div>

              {/* Heart Animation */}
              <div className="relative mb-1">
                 {/* Soft shadow heart */}
                 <Heart size={64} className="text-rose-500/20 absolute top-1 left-1 blur-sm" style={{ animation: 'lubdub 0.833s infinite ease-in-out' }} />
                 <Heart size={64} className="text-rose-500 fill-rose-500/10 drop-shadow-md" style={{ animation: 'lubdub 0.833s infinite ease-in-out' }} />
              </div>

              <div className="relative z-10">
                <div className="text-4xl sm:text-5xl font-black text-skin-text tracking-tighter tabular-nums leading-none drop-shadow-sm">
                    {stats.seconds.toLocaleString()}
                </div>
                <div className="text-[10px] font-bold text-skin-muted uppercase tracking-[0.3em] mt-2 opacity-60">Seconds Alive</div>
              </div>
          </div>

          {/* Years (Wide Tile) */}
          <div className="col-span-2 bg-gradient-to-r from-amber-50/40 to-orange-50/40 dark:from-amber-900/10 dark:to-orange-900/10 backdrop-blur-xl p-5 rounded-[1.5rem] border border-white/20 flex items-center justify-between shadow-sm group hover:bg-white/10 transition-colors">
               <div className="flex flex-col">
                  <div className="text-3xl font-black text-skin-text tabular-nums">{stats.years}</div>
                  <div className="text-[10px] font-bold text-skin-muted uppercase tracking-wider opacity-80">Years</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/10">
                  <Calendar size={20} />
              </div>
          </div>

          {/* Standard Tiles - Clean Glass */}
          <StatTile label="Months" value={stats.months} icon={Calendar} delay="100ms" colorClass="text-emerald-500" />
          <StatTile label="Weeks" value={stats.weeks} icon={Layers} delay="200ms" colorClass="text-teal-500" />
          <StatTile label="Days" value={stats.days} icon={Zap} delay="300ms" colorClass="text-blue-500" />
          <StatTile label="Hours" value={stats.hours} icon={Hourglass} delay="400ms" colorClass="text-violet-500" />

           {/* Minutes (Wide Tile) */}
          <div className="col-span-2 bg-gradient-to-r from-indigo-50/40 to-blue-50/40 dark:from-indigo-900/10 dark:to-blue-900/10 backdrop-blur-xl p-5 rounded-[1.5rem] border border-white/20 flex items-center justify-between shadow-sm group hover:bg-white/10 transition-colors">
               <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10">
                  <Clock size={20} />
              </div>
              <div className="flex flex-col text-right">
                  <div className="text-2xl font-black text-skin-text tabular-nums">{stats.minutes.toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-skin-muted uppercase tracking-wider opacity-80">Minutes</div>
              </div>
          </div>

      </div>
    </div>
  );
};

export default CurrentAgeCard;