import React, { useEffect, useState } from 'react';
import { differenceInDays, addYears, isPast, setYear, isSameDay } from 'date-fns';
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
    
    // Calculate next birthday
    const currentYear = now.getFullYear();
    let nextBday = setYear(birthDate, currentYear);
    
    if (isPast(nextBday) && !isSameDay(nextBday, now)) {
        nextBday = addYears(nextBday, 1);
    }

    setNextBirthday(nextBday);
    setTurningAge(nextBday.getFullYear() - birthDate.getFullYear());
    setDaysLeft(differenceInDays(nextBday, now));

  }, [dob]);

  if (!nextBirthday) return null;

  return (
    <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-md p-6 text-white relative overflow-hidden mb-6">
       {/* Decor */}
       <div className="absolute top-0 right-0 p-4 opacity-10">
            <Cake size={100} />
       </div>

       <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 mb-2 opacity-90 text-sm font-semibold uppercase tracking-wider">
                <Gift className="w-4 h-4" />
                <span>Birthday Countdown</span>
            </div>
            <ShareButton 
                title={`My Upcoming Birthday`}
                text={`I'm turning ${turningAge} in just ${daysLeft} days! The countdown is on.`}
                className="text-white hover:bg-white/20"
                onClick={() => onShare("My Upcoming Birthday", `I'm turning ${turningAge} in just ${daysLeft} days! The countdown is on.`)}
            />
          </div>

          <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
            <div>
                 <h3 className="text-3xl font-bold">Turning {turningAge}</h3>
                 <p className="text-rose-100">on {nextBirthday.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 px-5 text-center min-w-[120px]">
                <div className="text-3xl font-mono font-bold">{daysLeft}</div>
                <div className="text-xs uppercase tracking-wide opacity-80">Days Left</div>
            </div>
          </div>
       </div>
    </div>
  );
};

export default NextBirthdayCard;