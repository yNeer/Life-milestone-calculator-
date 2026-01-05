import React, { useEffect, useState } from 'react';
import { Milestone } from '../types';
import { differenceInSeconds, format } from 'date-fns';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import ShareButton from './ShareButton';

interface Props {
  milestones: Milestone[];
  onShare: (title: string, text: string, milestone?: Milestone) => void;
}

const UpcomingShowcase: React.FC<Props> = ({ milestones, onShare }) => {
  const [timeLeft, setTimeLeft] = useState('');
  
  // Filter only future milestones, sorted by date
  const upcoming = milestones.filter(m => !m.isPast).sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const mainEvent = upcoming[0];
  const nextEvents = upcoming.slice(1, 5); // Next 4 events

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
    <div className="space-y-4">
        {/* Main Hero Card */}
        <div className="w-full bg-gradient-to-r from-skin-primary to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            {/* Background Decorative Pattern */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-indigo-100 text-sm font-bold uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                        <Clock className="w-4 h-4" />
                        <span>Next Milestone</span>
                    </div>
                    <ShareButton 
                        title={`My Next Milestone: ${mainEvent.title}`} 
                        text={`I'm hitting a major milestone: ${mainEvent.title} on ${format(mainEvent.date, 'MMM do, yyyy')}! (${mainEvent.description})`}
                        className="text-white hover:bg-white/20"
                        onClick={() => onShare(mainEvent.title, mainEvent.description, mainEvent)}
                    />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="text-left">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-2 tracking-tight leading-tight">
                            {mainEvent.title}
                        </h2>
                        <p className="text-lg text-indigo-50 font-medium max-w-lg opacity-90">
                            {mainEvent.sourceEventName !== "Birth" ? `${mainEvent.sourceEventName}: ` : ''}
                            {mainEvent.description}
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 min-w-[200px] text-center border border-white/20 shadow-lg">
                        <div className="text-2xl md:text-3xl font-mono font-bold mb-1 shadow-black/10 drop-shadow-sm">{timeLeft}</div>
                        <div className="text-xs text-indigo-100 flex items-center justify-center gap-1 font-semibold uppercase tracking-wide">
                            <Calendar className="w-3 h-3" />
                            {format(mainEvent.date, 'MMM do, yyyy')}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Horizontal Slider for Next Events */}
        {nextEvents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {nextEvents.map((evt, idx) => (
                    <div key={evt.id} className="bg-skin-card border border-skin-border p-4 rounded-xl shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-2">
                             <div className="text-[10px] uppercase font-bold text-skin-muted tracking-wider">
                                {idx === 0 ? 'Following' : 'Upcoming'}
                             </div>
                             <ShareButton 
                                title={evt.title} 
                                text={`I will reach ${evt.title} on ${format(evt.date, 'MMM do, yyyy')}.`}
                                iconSize={14}
                                className="text-skin-muted hover:text-skin-primary -mt-2 -mr-2"
                                onClick={() => onShare(evt.title, evt.description, evt)}
                             />
                        </div>
                        <h4 className="font-bold text-skin-text text-sm mb-1 line-clamp-1 group-hover:text-skin-primary transition-colors">{evt.title}</h4>
                        <p className="text-xs text-skin-muted mb-3 line-clamp-2 h-8">{evt.description}</p>
                        <div className="flex items-center gap-1 text-xs font-medium text-skin-text bg-skin-input px-2 py-1 rounded-md w-fit">
                            <Calendar className="w-3 h-3 text-skin-primary" />
                            {format(evt.date, 'MMM d, yyyy')}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default UpcomingShowcase;