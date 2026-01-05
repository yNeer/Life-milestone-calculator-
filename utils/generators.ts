import { addDays, addHours, addWeeks, addMonths, addMinutes, addSeconds, addYears, isPast } from 'date-fns';
import { Milestone, MilestoneCategory, CustomEvent } from '../types';

// Constants
const MAX_YEARS = 100;
const DAYS_IN_100_YEARS = 36525;
const HOURS_IN_100_YEARS = DAYS_IN_100_YEARS * 24;

const CATEGORY_COLORS: Record<MilestoneCategory, string> = {
  [MilestoneCategory.Power]: '#3b82f6', // Blue
  [MilestoneCategory.Standard]: '#0ea5e9', // Sky
  [MilestoneCategory.Repdigit]: '#8b5cf6', // Violet
  [MilestoneCategory.Sequence]: '#ec4899', // Pink
  [MilestoneCategory.Math]: '#ef4444', // Red (Danger/Unique)
  [MilestoneCategory.Hourly]: '#f97316', // Orange
  [MilestoneCategory.Weeks]: '#14b8a6', // Teal
  [MilestoneCategory.Months]: '#10b981', // Emerald
  [MilestoneCategory.Minutes]: '#8b5cf6', // Violet
  [MilestoneCategory.Seconds]: '#d946ef', // Fuchsia
  [MilestoneCategory.Birthday]: '#f43f5e', // Rose
  [MilestoneCategory.Custom]: '#eab308', // Gold
};

// --- Number Generators ---

const generatePowerArray = (limit: number): number[] => {
  const nums: number[] = [];
  let current = 10;
  while (current <= limit) {
    nums.push(current);
    current *= 10;
  }
  return nums;
};

const generateStandardArray = (limit: number): number[] => {
  const nums: number[] = [1, 5, 10, 20, 25, 50, 75];
  for (let m = 100; m <= limit; m += 100) {
      if(m > limit) break;
      if (m % 500 === 0 || m % 1000 === 0 || m === 25000) {
           nums.push(m);
      }
  }
  [500, 1000, 1500, 2000, 2500, 5000, 7500, 15000, 25000, 30000].forEach(n => {
      if (n <= limit && !nums.includes(n)) nums.push(n);
  });
  return nums.sort((a, b) => a - b);
};

const generateRepdigits = (limit: number): number[] => {
  const nums: number[] = [];
  for (let d = 1; d <= 9; d++) {
    let current = d;
    while (current <= limit) {
      if (current > 10) { 
          nums.push(current);
      }
      current = current * 10 + d;
    }
  }
  return nums.sort((a, b) => a - b);
};

const generateSequences = (limit: number): number[] => {
    const seqs = [123, 1234, 12345, 123456, 12321, 121, 101, 1001, 2002];
    return seqs.filter(n => n <= limit);
};

const generateMath = (limit: number): { value: number, desc: string, subCat: string }[] => {
    const results: { value: number, desc: string, subCat: string }[] = [];

    // Pi
    const piNums = [314, 3141, 31415]; 
    piNums.forEach(n => {
        if(n <= limit) results.push({ value: n, desc: `A circular moment in time (Digits of Pi). Perfectly irrational.`, subCat: 'Pi' });
    });

    // Fibonacci
    let a = 0, b = 1;
    while (b <= limit) {
        if (b > 100) {
            results.push({ value: b, desc: 'Aligning with nature\'s Golden Ratio. A moment of perfect proportion.', subCat: 'Fibonacci' });
        }
        const temp = a + b;
        a = b;
        b = temp;
    }

    // Squares
    for (let i = 10; i * i <= limit; i++) {
        if (i % 25 === 0 || i === 12 || i === 100 || i === 50) {
            results.push({ value: i*i, desc: `A Perfect Square (${i}²). Your timeline is perfectly balanced today.`, subCat: 'Square' });
        }
    }

    return results;
};

// --- Helper for ordinals ---
const getOrdinalSuffix = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return (s[(v - 20) % 10] || s[v] || s[0]);
};

// --- Main Calculator ---

export const calculateMilestones = (
  baseDate: Date, 
  baseTimeStr: string = "00:00", 
  sourceName: string = "Birth",
  customEvents: CustomEvent[] = []
): Milestone[] => {
  const milestones: Milestone[] = [];
  
  const [hours, minutes] = baseTimeStr.split(':').map(Number);
  const startDateTime = new Date(baseDate);
  startDateTime.setHours(hours || 0, minutes || 0, 0, 0);

  // 1. Days Calculation
  const powerDays = generatePowerArray(DAYS_IN_100_YEARS);
  const standardDays = generateStandardArray(DAYS_IN_100_YEARS);
  const repDays = generateRepdigits(DAYS_IN_100_YEARS);
  const seqDays = generateSequences(DAYS_IN_100_YEARS);
  const mathData = generateMath(DAYS_IN_100_YEARS);

  const addDayMilestone = (val: number, cat: MilestoneCategory, desc: string, title?: string) => {
    const mDate = addDays(startDateTime, val);
    milestones.push({
      id: `${sourceName}-${cat}-${val}-days`,
      value: val,
      unit: 'days',
      date: mDate,
      category: cat,
      title: title || `${val.toLocaleString()} Days`,
      description: desc,
      isPast: isPast(mDate),
      color: CATEGORY_COLORS[cat],
      sourceEventName: sourceName
    });
  };

  powerDays.forEach(d => {
      let desc = "A monumental Power of 10.";
      if (d === 100) desc = "Your first triple-digit day! The trial period is officially over.";
      if (d === 1000) desc = "The Kilo-day! You've hit four digits (approx 2.7 years). Walking and talking like a pro.";
      if (d === 10000) desc = "The 10k Club! You've lived 10,000 days – that's roughly 27 years of experience.";
      if (d === 100000) desc = "The Centennial of Days. A legendary feat achieved by very few.";
      addDayMilestone(d, MilestoneCategory.Power, desc);
  });

  standardDays.forEach(d => {
      let desc = "A nice round number to celebrate.";
      if (d === 5000) desc = "5,000 Days. You're deep into childhood/adolescence (approx 13.6 years).";
      if (d === 10000) desc = "10,000 Days. Welcome to the 5-digit club. You're getting serious now.";
      if (d === 15000) desc = "15,000 Days. You're roughly 41 years young. Wisdom is setting in.";
      if (d === 20000) desc = "20,000 Days. Over 54 years of life lived. A substantial archive of memories.";
      if (d === 25000) desc = "25,000 Days. The Quarter Century of Days (approx 68 years). A golden era.";
      if (d === 30000) desc = "30,000 Days. An incredible 82 years of journeying around the sun.";
      addDayMilestone(d, MilestoneCategory.Standard, desc);
  });

  repDays.forEach(d => {
      let desc = "A lucky repdigit! All the numbers align.";
      if (d === 11111) desc = "The Picket Fence. 11,111 days. Make a big wish on this singular sensation!";
      if (d === 22222) desc = "Deuces Wild. 22,222 days. Balance and duality in perfect harmony.";
      if (d === 33333) desc = "Threes Company. 33,333 days. A trifecta of luck.";
      addDayMilestone(d, MilestoneCategory.Repdigit, desc, `${d.toLocaleString()} Days`);
  });

  seqDays.forEach(d => {
      let desc = "A unique sequential pattern in time.";
      if (d === 12345) desc = "1-2-3-4-5. The Great Sequence. Life is as easy as counting.";
      if (d === 12321) desc = "A Palindrome Day. 12,321 reads the same forwards and backwards.";
      addDayMilestone(d, MilestoneCategory.Sequence, desc);
  });

  mathData.forEach(m => addDayMilestone(m.value, MilestoneCategory.Math, m.desc, `${m.value} Days`));

  // 2. Hourly Calculation
  const hourlyUnits = [10000, 50000, 100000, 200000, 250000, 500000];
  hourlyUnits.forEach(h => {
      if (h <= HOURS_IN_100_YEARS) {
          const mDate = addHours(startDateTime, h);
          let desc = "An hourly jubilee.";
          if (h === 10000) desc = "The Mastery Milestone. 10,000 hours to master a skill—you've mastered existing.";
          if (h === 100000) desc = "100,000 Hours. Welcome to double-digit age in hours (approx 11.4 years).";
          if (h === 200000) desc = "200,000 Hours. Breathing for over 22 years. That's a lot of breaths.";
          if (h === 500000) desc = "Half a Million Hours. You are a chrononaut of the highest order (approx 57 years).";
          milestones.push({
            id: `${sourceName}-hourly-${h}`,
            value: h,
            unit: 'hours',
            date: mDate,
            category: MilestoneCategory.Hourly,
            title: `${h.toLocaleString()} Hours`,
            description: desc,
            isPast: isPast(mDate),
            color: CATEGORY_COLORS[MilestoneCategory.Hourly],
            sourceEventName: sourceName
          });
      }
  });

  // 3. Weeks Calculation
  const weekUnits = [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000];
  weekUnits.forEach(w => {
    if (w * 7 <= DAYS_IN_100_YEARS) {
        const mDate = addWeeks(startDateTime, w);
        let desc = `You have lived ${w} weeks.`;
        if (w === 1000) desc = "1,000 Weeks. Approx 19 years old. Childhood officially complete.";
        if (w === 2000) desc = "2,000 Weeks. Approx 38 years. Approaching the prime of life.";
        if (w === 3000) desc = "3,000 Weeks. Approx 57 years. A wealth of weekly wisdom.";
        if (w === 4000) desc = "4,000 Weeks. Approx 76 years. Four thousand weekends experienced.";
        milestones.push({
            id: `${sourceName}-weeks-${w}`,
            value: w,
            unit: 'weeks',
            date: mDate,
            category: MilestoneCategory.Weeks,
            title: `${w.toLocaleString()} Weeks`,
            description: desc,
            isPast: isPast(mDate),
            color: CATEGORY_COLORS[MilestoneCategory.Weeks],
            sourceEventName: sourceName
        });
    }
  });

  // 4. Months Calculation
  const monthUnits = [200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200];
  monthUnits.forEach(m => {
    if (m * 30 <= DAYS_IN_100_YEARS) {
        const mDate = addMonths(startDateTime, m);
        let desc = "A massive monthly milestone.";
        if (m === 300) desc = "300 Months. That's your Silver Jubilee (25 years) in months!";
        if (m === 500) desc = "500 Months. You are roughly 41 years old. Halfway to a thousand!";
        if (m === 600) desc = "600 Months. You've hit the half-century mark (50 years).";
        if (m === 1000) desc = "A Millennium of Months. 83 years of turning calendar pages.";
        milestones.push({
            id: `${sourceName}-months-${m}`,
            value: m,
            unit: 'months',
            date: mDate,
            category: MilestoneCategory.Months,
            title: `${m.toLocaleString()} Months`,
            description: desc,
            isPast: isPast(mDate),
            color: CATEGORY_COLORS[MilestoneCategory.Months],
            sourceEventName: sourceName
        });
    }
  });

  // 5. Minutes
  const minuteUnits = [10000000, 50000000, 100000000, 500000000]; 
  minuteUnits.forEach(m => {
    if (m < 52600000 * 2) { 
        const mDate = addMinutes(startDateTime, m);
        let desc = "Count them if you dare.";
        if (m === 10000000) desc = "10 Million Minutes. Roughly 19 years of time ticking away.";
        if (m === 50000000) desc = "50 Million Minutes. Nearly a century of minutes (approx 95 years).";
        milestones.push({
            id: `${sourceName}-minutes-${m}`,
            value: m,
            unit: 'minutes',
            date: mDate,
            category: MilestoneCategory.Minutes,
            title: `${(m/1000000).toString()}M Minutes`,
            description: desc,
            isPast: isPast(mDate),
            color: CATEGORY_COLORS[MilestoneCategory.Minutes],
            sourceEventName: sourceName
        });
    }
  });

  // 6. Seconds
  const secondUnits = [1000000000, 1500000000, 2000000000, 3000000000];
  secondUnits.forEach(s => {
      if (s < 3155760000) { 
        const mDate = addSeconds(startDateTime, s);
        let desc = "Another billion seconds tick by.";
        if (s === 1000000000) desc = "The Gigasecond. 1 Billion seconds (approx 31.7 years). A computational epoch.";
        if (s === 2000000000) desc = "2 Billion Seconds. Approx 63.4 years. You are a time billionaire twice over.";
        milestones.push({
            id: `${sourceName}-seconds-${s}`,
            value: s,
            unit: 'seconds',
            date: mDate,
            category: MilestoneCategory.Seconds,
            title: `${(s/1000000000).toString()} Billion Seconds`,
            description: desc,
            isPast: isPast(mDate),
            color: CATEGORY_COLORS[MilestoneCategory.Seconds],
            sourceEventName: sourceName
        });
      }
  });

  // 7. Birthdays
  for (let i = 1; i <= MAX_YEARS; i++) {
    const mDate = addYears(startDateTime, i);
    milestones.push({
        id: `${sourceName}-birthday-${i}`,
        value: i,
        unit: 'years',
        date: mDate,
        category: MilestoneCategory.Birthday,
        title: `${i}${getOrdinalSuffix(i)} Birthday`,
        description: `Completing orbit number ${i} around the sun.`,
        isPast: isPast(mDate),
        color: CATEGORY_COLORS[MilestoneCategory.Birthday],
        sourceEventName: sourceName
    })
  }

  return milestones.sort((a, b) => a.date.getTime() - b.date.getTime());
};

export const getAllMilestones = (
  dob: Date | null, 
  tob: string, 
  customEvents: CustomEvent[]
): Milestone[] => {
  if (!dob) return [];

  let allMilestones = calculateMilestones(dob, tob, "Birth");

  customEvents.forEach(evt => {
     const evtMilestones = calculateMilestones(evt.date, "00:00", evt.name);
     const coloredMilestones = evtMilestones.map(m => ({
         ...m,
         color: CATEGORY_COLORS[MilestoneCategory.Custom], 
         category: MilestoneCategory.Custom,
         description: `${m.description} (since ${evt.name})`
     }));
     allMilestones = [...allMilestones, ...coloredMilestones];
  });

  return allMilestones.sort((a, b) => a.date.getTime() - b.date.getTime());
};