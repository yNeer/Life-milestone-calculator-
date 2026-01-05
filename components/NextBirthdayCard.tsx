import React, { useEffect, useState } from 'react';
import { differenceInDays, addYears, isPast, isSameDay } from 'date-fns';
import { Cake, Gift } from 'lucide-react';
import ShareButton from './ShareButton';
import { Milestone } from '../types';

interface Props {
  dob: string;
  onShare: (title: string, text: string, milestone?: Milestone) => void;
}

const NextBirthdayCard: React.FC<Props> = ({ dob, onShare }) => {
  const [nextBirthday, setNextBirthday] = useState<Date | null>(null);
  const [turningAge, setTurningAge] = useState<number>(0);
  const [daysLeft, setDaysLeft] = useState<number>(0);

  useEffect(() => {
    if (!dob) return;
    const birthDate = new Date(dob);
    const now = new Date();
    
    let nextBday = new Date(birthDate);
    nextBday.setFullYear(now.getFullYear());

    if (isPast(nextBday) && !isSameDay(nextBday, now)) {
        nextBday = addYears(nextBday, 1);
    }

    setNextBirthday(nextBday);
    setTurningAge(nextBday.getFullYear() - birthDate.getFullYear());
    setDaysLeft(differenceInDays(nextBday, now));

  }, [dob]);

  if (!nextBirthday) return null;

  return (
    <div className="bg-gradient-to-br from-rose-500/90 to-pink-600/90 backdrop-blur-xl rounded-[2rem] shadow-xl p-6 text-white relative overflow-hidden flex flex-col justify-between border border-white/20 h-full">
       <div className="absolute top-0 right-0 p-4 opacity-10">
            <Cake size={120} />
       </div>

       <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="flex items-center gap-2 bg-black/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                <Gift className="w-3 h-3" />
                <span className="text-xs font-bold uppercase tracking-wider">Countdown</span>
            </div>
            <ShareButton 
                title="My Upcoming Birthday"
                text={`I'm turning ${turningAge} in just ${daysLeft} days!`}
                className="text-white hover:bg-white/20 bg-white/10 backdrop-blur-md"
                onClick={() => onShare("My Upcoming Birthday", `I'm turning ${turningAge} in just ${daysLeft} days! The countdown is on.`)}
            />
       </div>

       <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-1">Turning {turningAge}</h3>
            <p className="text-sm text-pink-100 font-medium mb-4 opacity-90">
                {nextBirthday.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
            </p>
            
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex items-center justify-between">
                <div className="flex flex-col px-2">
                    <span className="text-xs uppercase font-bold opacity-80">Days Left</span>
                    <span className="text-2xl font-mono font-bold">{daysLeft}</span>
                </div>
                <div className="h-8 w-px bg-white/30"></div>
                <div className="px-2">
                   <Cake className="w-6 h-6 opacity-80" />
                </div>
            </div>
       </div>
    </div>
  );
};

export default NextBirthdayCard;