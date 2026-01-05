import React, { useEffect, useState } from 'react';
import { Milestone } from '../types';
import { differenceInDays, differenceInSeconds, format } from 'date-fns';
import { Clock, Share2, Calendar } from 'lucide-react';

interface Props {
  milestone: Milestone;
}

const NextBigOne: React.FC<Props> = ({ milestone }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diffSec = differenceInSeconds(milestone.date, now);
      
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
  }, [milestone]);

  const handleShare = () => {
    // Simulation of share
    alert(`Ready to share: "I will turn ${milestone.title} on ${format(milestone.date, 'MMM do, yyyy')}!"`);
  };

  return (
    <div className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
      {/* Background Decorative Pattern */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start text-indigo-200 mb-1 text-sm font-semibold uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>The Next Big One</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">{milestone.title}</h2>
          <p className="text-lg text-indigo-100 max-w-lg">
            {milestone.sourceEventName !== "Birth" ? `${milestone.sourceEventName}: ` : ''}
            {milestone.description}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 min-w-[200px] text-center border border-white/20">
          <div className="text-3xl font-mono font-bold mb-1">{timeLeft}</div>
          <div className="text-sm text-indigo-200 flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(milestone.date, 'MMMM do, yyyy')}
          </div>
        </div>
      </div>
      
      <button 
        onClick={handleShare}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
        title="Share this milestone"
      >
        <Share2 className="w-5 h-5 text-white" />
      </button>
    </div>
  );
};

export default NextBigOne;