import React, { useEffect, useState } from 'react';
import { 
  differenceInSeconds, differenceInMinutes, differenceInHours, 
  differenceInDays, differenceInWeeks, differenceInMonths, differenceInYears, format
} from 'date-fns';
import { Timer, Calendar, Clock, Hourglass, Hash, Flag } from 'lucide-react';
import ShareButton from './ShareButton';
import { Milestone } from '../types';
import { getGeneration, getCentury } from '../utils/generators';

interface Props {
  dob: string;
  tob: string;
  onShare: (title: string, text: string, milestone?: Milestone, type?: string, extraData?: any) => void;
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

  const StatTile = ({ label, value, icon: Icon, color, subLabel }: any) => (
    <div className="bg-skin-card/40 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group min-h-[90px]">
      <div className={`absolute top-0 left-0 w-full h-1 bg-${color}-500 opacity-50`}></div>
      <Icon className={`w-4 h-4 mb-1 text-${color}-500 opacity-70`} />
      <div className="text-lg font-bold text-skin-text tabular-nums leading-none mb-1 break-all">
        {value.toLocaleString()}
      </div>
      <div className="text-[9px] text-skin-muted font-bold uppercase tracking-wide opacity-80">{label}</div>
      {subLabel && <div className="text-[8px] text-skin-muted/60 font-medium">{subLabel}</div>}
    </div>
  );

  return (
    <div className="bg-skin-card/30 backdrop-blur-2xl rounded-[2rem] shadow-xl border border-white/20 p-5 flex flex-col gap-4 relative">
        <div className="absolute top-4 right-4 z-10">
             <ShareButton 
                title="My Life Matrix" 
                text={shareText} 
                className="text-skin-muted hover:text-skin-primary bg-skin-card/50" 
                onClick={() => onShare("My Life Matrix", shareText, undefined, 'age', stats)}
             />
        </div>

        {/* Identity Header */}
        <div className="flex flex-col gap-2 pt-2">
            <h3 className="text-sm font-bold text-skin-muted uppercase tracking-wider flex items-center gap-2">
                <Hourglass className="w-4 h-4" /> Total Existence
            </h3>
            
            <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full">
                    <Flag size={12} className="text-purple-500" />
                    <span className="text-xs font-bold text-skin-text">{generation}</span>
                </div>
                <div className="flex items-center gap-2 bg-skin-card/50 border border-skin-border/50 px-3 py-1.5 rounded-full">
                    <Calendar size={12} className="text-skin-muted" />
                    <span className="text-xs font-bold text-skin-muted">{century} Birth</span>
                </div>
            </div>
        </div>

        {/* Mosaic Grid of Stats - All Units */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="col-span-2 md:col-span-4 bg-skin-card/40 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col items-center justify-center shadow-sm">
                 <div className="text-xs font-bold text-skin-muted uppercase mb-1">Current Age</div>
                 <div className="text-4xl font-black text-skin-text tabular-nums">
                    {(stats.years / 10).toFixed(1)} <span className="text-lg font-bold text-skin-muted">Decades</span>
                 </div>
                 <div className="text-xs text-skin-muted/70 mt-1 font-mono">
                    {stats.years} Years • {stats.days % 365} Days
                 </div>
            </div>

            <StatTile label="Years" value={stats.years} icon={Calendar} color="rose" />
            <StatTile label="Months" value={stats.months} icon={Calendar} color="emerald" />
            <StatTile label="Weeks" value={stats.weeks} icon={Calendar} color="teal" />
            <StatTile label="Days" value={stats.days} icon={Calendar} color="blue" />
            
            <StatTile label="Hours" value={stats.hours} icon={Clock} color="indigo" />
            <StatTile label="Minutes" value={stats.minutes} icon={Clock} color="violet" />
            <div className="col-span-2 md:col-span-2">
                <div className="bg-skin-card/40 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex flex-row items-center justify-between px-6 shadow-sm relative overflow-hidden h-full">
                    <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500 opacity-50"></div>
                    <div className="flex flex-col items-start">
                        <div className="text-[10px] text-fuchsia-500 font-bold uppercase tracking-wide">Total Seconds</div>
                        <div className="text-xl md:text-2xl font-black text-skin-text tabular-nums leading-none">
                            {stats.seconds.toLocaleString()}
                        </div>
                    </div>
                    <Timer className="w-6 h-6 text-fuchsia-500 opacity-50" />
                </div>
            </div>
        </div>
    </div>
  );
};

export default CurrentAgeCard;