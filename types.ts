
export enum MilestoneCategory {
  Power = 'Power',          // Powers of 10
  Standard = 'Standard',    // 1k, 5k, 25k
  Repdigit = 'Repdigit',    // 11, 222, 1111
  Sequence = 'Sequence',    // 12345
  Math = 'Math',            // Pi, Fib, Squares
  Hourly = 'Hourly',        // 10k hours
  Weeks = 'Weeks',          // 1000 weeks
  Months = 'Months',        // 500 months
  Minutes = 'Minutes',      // 1 million minutes
  Seconds = 'Seconds',      // 1 billion seconds
  Birthday = 'Birthday',    // Annual birthdays
  Custom = 'Custom'         // User events
}

export enum CustomEventCategory {
  Personal = 'Personal',
  Career = 'Career',
  Relationship = 'Relationship',
  Other = 'Other'
}

export interface Milestone {
  id: string;
  value: number; // The number (days or hours)
  unit: 'days' | 'hours' | 'weeks' | 'months' | 'minutes' | 'seconds' | 'years';
  date: Date;
  category: MilestoneCategory;
  title: string;
  description: string;
  isPast: boolean;
  color: string;
  sourceEventName?: string; // If derived from a custom event
}

export interface CustomEvent {
  id: string;
  name: string;
  date: Date;
  category: CustomEventCategory;
}

export type ThemeId = 'light' | 'dark' | 'amoled' | 'acidic' | 'cyberpunk' | 'retro' | 'futuristic' | 'historical' | 'nature' | 'ocean' | 'sunset';

export interface Theme {
  id: ThemeId;
  name: string;
  colors: {
    base: string;     // Main background
    card: string;     // Card background
    text: string;     // Primary text
    muted: string;    // Secondary text
    primary: string;  // Primary accent
    border: string;   // Borders
    input: string;    // Input backgrounds
  };
}

export interface UserProfile {
  name: string;
  dob: string;
  tob: string;
  theme: ThemeId;
  avatar?: string; // Base64 string of user image
}
