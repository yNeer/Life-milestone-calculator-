import React, { useEffect, useState } from 'react';
import { Milestone } from '../types';
import { differenceInSeconds, format } from 'date-fns';
import { Clock, Calendar } from 'lucide-react';
import ShareButton from './ShareButton';

interface Props {
  milestones: Milestone[];
  onShare: (title: string, text: string, milestone?: Milestone) => void;
}

const UpcomingShowcase: React.FC<Props> = ({ milestones, onShare }) => {
  const [timeLeft, setTimeLeft] = useState('');
  
  const upcoming = milestones.filter(m => !m.isPast).sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const mainEvent = upcoming[0];
  // Filter out the main event from next events list
  const nextEvents = upcoming.slice(1, 3); 

  useEffect(() => {
    if (!mainEvent) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diffSec = differenceInSeconds(mainEvent.date, now);
      
      if (diffSec <= 0) {
        setTimeLeft('Today!');
        return;
      }

      const days = Math.floor(diffSec / (3600 * 24));
      const hours = Math.floor((diffSec % (3600 * 24)) / 3600);
      const minutes = Math.floor((diffSec % 3600) / 60);
      const seconds = diffSec % 60;

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [mainEvent]);

  if (!mainEvent) return null;

  return (
    <div className="flex flex-col gap-4 h-full">
        {/* Main Hero Card - Compact Version */}
        <div className="flex-1 w-full bg-gradient-to-br from-skin-primary to-purple-600 rounded-[2rem] p-5 text-white shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 border border-white/20 group min-h-[180px] flex flex-col justify-between">
            
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            
            {/* Background Decorative Pattern */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-1.5 text-indigo-50 text-[10px] font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
                        <Clock className="w-3 h-3" />
                        <span>Up Next</span>
                    </div>
                    <ShareButton 
                        title={`My Next Milestone: ${mainEvent.title}`} 
                        text={`I'm hitting a major milestone: ${mainEvent.title} on ${format(mainEvent.date, 'MMM do, yyyy')}! (${mainEvent.description})`}
                        className="text-white bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 p-1.5"
                        iconSize={14}
                        onClick={() => onShare(mainEvent.title, mainEvent.description, mainEvent)}
                    />
                </div>

                <div className="text-left mb-3">
                    <h2 className="text-2xl md:text-3xl font-black mb-1 tracking-tight leading-none drop-shadow-sm truncate">
                        {mainEvent.title}
                    </h2>
                    <p className="text-sm text-indigo-100 font-medium leading-snug opacity-90 line-clamp-2">
                        {mainEvent.sourceEventName !== "Birth" ? `${mainEvent.sourceEventName}: ` : ''}
                        {mainEvent.description}
                    </p>
                </div>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-3 mt-auto">
                <div className="bg-white/20 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/20 shadow-sm">
                    <div className="text-sm md:text-base font-mono font-bold">{timeLeft}</div>
                </div>
                <div className="flex items-center gap-1.5 text-indigo-100 text-xs font-bold bg-black/10 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/5">
                    <Calendar className="w-3 h-3" />
                    {format(mainEvent.date, 'MMM d, yyyy')}
                </div>
            </div>
        </div>

        {/* Small Widgets Grid - Only show if space permits in layout or user desires */}
        {nextEvents.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
                {nextEvents.map((evt, idx) => (
                    <div key={evt.id} className="bg-skin-card/40 backdrop-blur-xl border border-white/20 p-4 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between min-h-[100px]">
                        <div>
                            <div className="text-[9px] uppercase font-bold text-skin-muted tracking-wider mb-1 opacity-70">
                                #{idx + 2} Next
                            </div>
                            <h4 className="font-bold text-skin-text text-xs mb-1 leading-tight line-clamp-2">{evt.title}</h4>
                        </div>
                        <div className="mt-2 pt-2 border-t border-skin-border/20 flex items-center gap-1 text-[10px] font-bold text-skin-muted">
                            <Calendar className="w-3 h-3" />
                            {format(evt.date, 'MMM d')}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default UpcomingShowcase;