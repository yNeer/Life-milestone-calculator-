import React, { useEffect, useState } from 'react';
import { 
  differenceInSeconds, 
  differenceInMinutes, 
  differenceInHours, 
  differenceInDays, 
  differenceInWeeks, 
  differenceInMonths,
  differenceInYears,
  format
} from 'date-fns';
import { Timer, Calendar, Clock, Layers, Zap, Activity, Crown, Flag } from 'lucide-react';
import ShareButton from './ShareButton';
import { Milestone, MilestoneCategory } from '../types';

interface Props {
  dob: string;
  tob: string;
  onShare: (title: string, text: string, milestone?: Milestone) => void;
}

const CurrentAgeCard: React.FC<Props> = ({ dob, tob, onShare }) => {
  const [now, setNow] = useState(new Date());
  const [stats, setStats] = useState({
    decades: 0,
    years: 0,
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

    const years = differenceInYears(now, birthDate);

    setStats({
      decades: Math.floor(years / 10),
      years: years,
      months: differenceInMonths(now, birthDate),
      weeks: differenceInWeeks(now, birthDate),
      days: differenceInDays(now, birthDate),
      hours: differenceInHours(now, birthDate),
      minutes: differenceInMinutes(now, birthDate),
      seconds: differenceInSeconds(now, birthDate),
    });
  }, [now, dob, tob]);

  const shareText = `I have been alive for ${stats.days.toLocaleString()} days, ${stats.hours.toLocaleString()} hours, and counting! Check your milestones.`;
  
  const handleShare = (e: React.MouseEvent) => {
      const ageMilestone: Milestone = {
          id: 'current-age-stats',
          title: 'My Current Age Stats',
          description: shareText,
          date: new Date(), 
          category: MilestoneCategory.Custom,
          isPast: true,
          color: '#3b82f6', 
          value: stats.days,
          unit: 'days'
      };
      onShare("My Current Age", shareText, ageMilestone);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StatBox = ({ label, value, icon: Icon, gradientFrom, gradientTo, delay }: any) => (
    <div 
        className={`
            relative overflow-hidden rounded-2xl p-4 
            bg-gradient-to-br from-white/20 to-white/5 dark:from-white/10 dark:to-white/5
            backdrop-blur-md border border-white/20 shadow-lg 
            hover:scale-[1.02] hover:shadow-xl hover:border-white/30 transition-all duration-300 group
            animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards
        `}
        style={{ animationDelay: `${delay}ms` }}
    >
        {/* Glow effect on hover */}
        <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity rounded-full`} />
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
             <div className={`mb-3 p-2.5 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-lg group-hover:rotate-12 transition-transform duration-300`}>
                <Icon size={20} strokeWidth={2.5} />
             </div>
             <div className="text-xl md:text-3xl font-black tracking-tight text-skin-text tabular-nums break-all">
                {value.toLocaleString()}
             </div>
             <div className="text-[10px] font-bold uppercase tracking-widest text-skin-muted opacity-80 mt-1">{label}</div>
        </div>
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-3xl bg-skin-card/30 backdrop-blur-xl border border-white/20 shadow-2xl mb-8 group/card">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden pointer-events-none opacity-30">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/30 rounded-full blur-3xl animate-blob mix-blend-multiply dark:mix-blend-screen"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/30 rounded-full blur-3xl animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen"></div>
            <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-pink-500/30 rounded-full blur-3xl animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-screen"></div>
        </div>

        <div className="absolute top-4 right-4 z-20">
             <ShareButton 
                title="My Life Stats" 
                text={shareText} 
                className="text-skin-muted hover:text-skin-primary hover:bg-white/20 bg-white/10 backdrop-blur-md shadow-sm border border-white/10" 
                onClick={handleShare}
             />
        </div>

        {/* Header / Clock */}
        <div className="relative z-10 p-8 pb-4 text-center border-b border-white/10">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-skin-muted mb-4 shadow-inner">
                <Clock size={12} className="animate-[spin_4s_linear_infinite]" />
                <span className="uppercase tracking-wider">Live Chronometer</span>
            </div>

            <div className="mb-4">
                <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 drop-shadow-sm tabular-nums leading-none pb-2">
                    {format(now, 'HH:mm:ss')}
                </h2>
                <div className="text-sm font-semibold text-skin-muted tracking-wide mt-2 uppercase opacity-80">
                    {format(now, 'EEEE, d MMMM yyyy')}
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="relative z-10 p-6 pt-6">
            <div className="flex items-center justify-center gap-2 mb-6 opacity-80">
                <Activity size={16} className="text-skin-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-skin-muted">Time Lived So Far</span>
                <div className="h-px w-12 bg-skin-border/50"></div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <StatBox 
                    label="Decades" 
                    value={stats.decades} 
                    icon={Crown} 
                    gradientFrom="from-yellow-400" 
                    gradientTo="to-orange-500" 
                    delay={0} 
                 />
                 <StatBox 
                    label="Years" 
                    value={stats.years} 
                    icon={Flag} 
                    gradientFrom="from-orange-400" 
                    gradientTo="to-red-500" 
                    delay={100} 
                 />
                 <StatBox 
                    label="Months" 
                    value={stats.months} 
                    icon={Calendar} 
                    gradientFrom="from-red-400" 
                    gradientTo="to-pink-500" 
                    delay={200} 
                 />
                 <StatBox 
                    label="Weeks" 
                    value={stats.weeks} 
                    icon={Layers} 
                    gradientFrom="from-pink-400" 
                    gradientTo="to-purple-500" 
                    delay={300} 
                 />
                 <StatBox 
                    label="Days" 
                    value={stats.days} 
                    icon={Calendar} 
                    gradientFrom="from-purple-400" 
                    gradientTo="to-indigo-500" 
                    delay={400} 
                 />
                 <StatBox 
                    label="Hours" 
                    value={stats.hours} 
                    icon={Clock} 
                    gradientFrom="from-indigo-400" 
                    gradientTo="to-blue-500" 
                    delay={500} 
                 />
                 <StatBox 
                    label="Minutes" 
                    value={stats.minutes} 
                    icon={Timer} 
                    gradientFrom="from-blue-400" 
                    gradientTo="to-cyan-500" 
                    delay={600} 
                 />
                 <StatBox 
                    label="Seconds" 
                    value={stats.seconds} 
                    icon={Zap} 
                    gradientFrom="from-cyan-400" 
                    gradientTo="to-emerald-500" 
                    delay={700} 
                 />
            </div>
        </div>
    </div>
  );
};

export default CurrentAgeCard;