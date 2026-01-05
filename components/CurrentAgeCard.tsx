import React, { useEffect, useState } from 'react';
import { 
  differenceInSeconds, 
  differenceInMinutes, 
  differenceInHours, 
  differenceInDays, 
  differenceInWeeks, 
  differenceInMonths,
  format
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
    months: 0,
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate stats whenever 'now' or inputs change
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

  const shareText = `I have been alive for ${stats.days.toLocaleString()} days, ${stats.hours.toLocaleString()} hours, and counting! Check your milestones.`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StatBox = ({ label, value, icon: Icon, colorClass }: any) => (
    <div className="bg-skin-card p-3 md:p-4 rounded-xl border border-skin-border shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-all hover:-translate-y-1">
      <div className={`p-2 rounded-full ${colorClass} bg-opacity-10 mb-2`}>
        <Icon className={`w-4 h-4 md:w-5 md:h-5 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <div className="text-xl md:text-2xl font-bold text-skin-text tabular-nums break-all">
        {value.toLocaleString()}
      </div>
      <div className="text-[10px] md:text-xs text-skin-muted font-medium uppercase tracking-wide">{label}</div>
    </div>
  );

  return (
    <div className="bg-skin-card rounded-xl shadow-sm border border-skin-border overflow-hidden mb-6 relative">
        <div className="absolute top-2 right-2 z-10">
             <ShareButton 
                title="My Life Stats" 
                text={shareText} 
                className="text-skin-muted hover:text-skin-primary" 
                onClick={() => onShare("My Life Stats", shareText)}
             />
        </div>

        {/* Header with Live Clock */}
        <div className="bg-skin-input p-4 border-b border-skin-border flex flex-col items-center justify-center text-center">
            <div className="text-xs font-semibold text-skin-muted uppercase tracking-widest mb-1">Current Time</div>
            <div className="text-2xl md:text-3xl font-mono font-bold text-skin-text tabular-nums">
                {format(now, 'HH:mm:ss')}
            </div>
            <div className="text-sm text-skin-muted font-medium">
                {format(now, 'EEEE, d MMMM yyyy')}
            </div>
        </div>

        {/* Stats Grid */}
        <div className="p-4 md:p-6">
            <h3 className="text-sm font-bold text-skin-text flex items-center gap-2 mb-4">
                <Hourglass className="w-4 h-4 text-skin-primary" />
                Time Lived So Far
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatBox label="Months" value={stats.months} icon={Calendar} colorClass="bg-emerald-500 text-emerald-600" />
                <StatBox label="Weeks" value={stats.weeks} icon={Calendar} colorClass="bg-teal-500 text-teal-600" />
                <StatBox label="Days" value={stats.days} icon={Calendar} colorClass="bg-blue-500 text-blue-600" />
                <StatBox label="Hours" value={stats.hours} icon={Clock} colorClass="bg-indigo-500 text-indigo-600" />
                <StatBox label="Minutes" value={stats.minutes} icon={Clock} colorClass="bg-violet-500 text-violet-600" />
                <StatBox label="Seconds" value={stats.seconds} icon={Timer} colorClass="bg-fuchsia-500 text-fuchsia-600" />
            </div>
        </div>
    </div>
  );
};

export default CurrentAgeCard;