import React, { useEffect, useState } from 'react';
import { 
  differenceInSeconds, differenceInMinutes, differenceInHours, 
  differenceInDays, differenceInWeeks, differenceInMonths, format
} from 'date-fns';
import { Timer, Calendar, Clock, Hourglass } from 'lucide-react';
import ShareButton from './ShareButton';
import { Milestone } from '../types';

interface Props {
  dob: string;
  tob: string;
  onShare: (title: string, text: string, milestone?: Milestone) => void;
}

const CurrentAgeCard: React.FC<Props> = ({ dob, tob, onShare }) => {
  const [now, setNow] = useState(new Date());
  const [stats, setStats] = useState({
    months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0
  });

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
      months: differenceInMonths(now, birthDate),
      weeks: differenceInWeeks(now, birthDate),
      days: differenceInDays(now, birthDate),
      hours: differenceInHours(now, birthDate),
      minutes: differenceInMinutes(now, birthDate),
      seconds: differenceInSeconds(now, birthDate),
    });
  }, [now, dob, tob]);

  const shareText = `I have been alive for ${stats.days.toLocaleString()} days, ${stats.hours.toLocaleString()} hours!`;

  const StatTile = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-skin-card/40 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-full h-1 bg-${color}-500 opacity-50`}></div>
      <Icon className={`w-4 h-4 mb-1 text-${color}-500`} />
      <div className="text-lg font-bold text-skin-text tabular-nums leading-none mb-1">
        {value.toLocaleString()}
      </div>
      <div className="text-[9px] text-skin-muted font-bold uppercase tracking-wide opacity-80">{label}</div>
    </div>
  );

  return (
    <div className="bg-skin-card/30 backdrop-blur-2xl rounded-[2rem] shadow-xl border border-white/20 p-5 flex flex-col gap-4 relative">
        <div className="absolute top-4 right-4">
             <ShareButton 
                title="Life Stats" 
                text={shareText} 
                className="text-skin-muted hover:text-skin-primary bg-skin-card/50" 
                onClick={() => onShare("My Life Stats", shareText)}
             />
        </div>

        <div className="flex flex-col">
            <h3 className="text-sm font-bold text-skin-muted uppercase tracking-wider mb-1 flex items-center gap-2">
                <Hourglass className="w-4 h-4" /> Time Alive
            </h3>
            <div className="text-2xl font-mono font-bold text-skin-text tabular-nums">
                {format(now, 'HH:mm:ss')}
            </div>
        </div>

        {/* Mosaic Grid of Stats */}
        <div className="grid grid-cols-2 gap-2">
            <StatTile label="Months" value={stats.months} icon={Calendar} color="emerald" />
            <StatTile label="Weeks" value={stats.weeks} icon={Calendar} color="teal" />
            <StatTile label="Days" value={stats.days} icon={Calendar} color="blue" />
            <StatTile label="Hours" value={stats.hours} icon={Clock} color="indigo" />
        </div>
        
        {/* Full width bottom tiles */}
        <div className="grid grid-cols-1 gap-2">
             <div className="bg-skin-card/40 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 flex justify-between items-center shadow-sm">
                <div className="flex flex-col text-left">
                    <span className="text-[10px] uppercase font-bold text-violet-500">Minutes</span>
                    <span className="text-lg font-bold text-skin-text tabular-nums">{stats.minutes.toLocaleString()}</span>
                </div>
                <Clock className="w-5 h-5 text-violet-500 opacity-50" />
             </div>
             <div className="bg-skin-card/40 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 flex justify-between items-center shadow-sm">
                <div className="flex flex-col text-left">
                    <span className="text-[10px] uppercase font-bold text-fuchsia-500">Seconds</span>
                    <span className="text-lg font-bold text-skin-text tabular-nums">{stats.seconds.toLocaleString()}</span>
                </div>
                <Timer className="w-5 h-5 text-fuchsia-500 opacity-50" />
             </div>
        </div>
    </div>
  );
};

export default CurrentAgeCard;