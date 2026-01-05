import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, Bar, CartesianGrid, Legend, Cell, PieChart, Pie,
  XAxis, YAxis, Tooltip
} from 'recharts';
import { Milestone, MilestoneCategory } from '../types';
import { format, differenceInDays } from 'date-fns';
import TimelineGraph from './TimelineGraph';

interface Props {
  milestones: Milestone[];
  dob: Date;
}

const VisualizationsPage: React.FC<Props> = ({ milestones, dob }) => {
  const [chartType, setChartType] = useState<'scatter' | 'bar' | 'pie' | 'birthdays'>('scatter');

  // --- Data Prep for Bar (Count by Category) ---
  const barDataRaw = milestones.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const barData = Object.entries(barDataRaw).map(([name, value]) => ({
    name,
    value: Number(value),
    // Find color from first milestone of this category
    color: milestones.find(m => m.category === name)?.color || '#ccc'
  })).sort((a, b) => b.value - a.value);

  // --- Data Prep for Birthdays ---
  const now = new Date();
  const birthdayData = milestones
    .filter(m => m.category === MilestoneCategory.Birthday && !m.isPast)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5) // Next 5 birthdays
    .map(m => ({
        age: m.value,
        days: differenceInDays(m.date, now),
        dateStr: format(m.date, 'MMM d, yyyy')
    }));

  // --- Stats Calculation ---
  const currentYear = now.getFullYear();
  const eventsThisYear = milestones.filter(m => m.date.getFullYear() === currentYear).length;

  // --- Render Functions ---

  const renderBar = () => (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart data={barData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" opacity={0.5}/>
        <XAxis type="number" hide />
        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
        <Tooltip 
          cursor={{fill: 'var(--color-input)'}}
          contentStyle={{ 
            borderRadius: '8px', 
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-card)',
            color: 'var(--color-text)'
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
          {barData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPie = () => (
     <ResponsiveContainer width="100%" height={500}>
        <PieChart>
          <Pie
            data={barData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={160}
            paddingAngle={2}
            dataKey="value"
            stroke="var(--color-card)"
          >
            {barData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
     </ResponsiveContainer>
  );

  const renderBirthdayChart = () => (
    <div className="h-[500px] flex flex-col justify-center">
        <h3 className="text-center text-skin-muted mb-4 text-sm font-medium uppercase tracking-wide">Days Until Next 5 Birthdays</h3>
        <ResponsiveContainer width="100%" height="90%">
            <BarChart data={birthdayData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" opacity={0.5} />
                <XAxis type="number" hide />
                <YAxis dataKey="age" type="category" width={80} tickFormatter={(val) => `Age ${val}`} tick={{fontSize: 12, fontWeight: 600, fill: 'var(--color-muted)'}} />
                <Tooltip 
                    cursor={{fill: 'var(--color-input)'}}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const d = payload[0].payload as any;
                            return (
                                <div className="bg-skin-card p-3 border border-skin-border shadow-md rounded-lg text-sm">
                                    <p className="font-bold text-skin-primary">Turning {d.age}</p>
                                    <p className="text-skin-muted">{d.dateStr}</p>
                                    <p className="text-xs font-semibold mt-1 text-skin-text">{d.days} days to go</p>
                                </div>
                            )
                        }
                        return null;
                    }}
                />
                <Bar dataKey="days" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={30} label={{ position: 'right', fill: 'var(--color-muted)', fontSize: 12, formatter: (val: number) => `${val} days` }} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-skin-card p-6 rounded-xl shadow-sm border border-skin-border">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-skin-text">Milestone Analysis</h2>
            <p className="text-sm text-skin-muted">Explore the distribution of your life events</p>
          </div>
          <div className="flex flex-wrap gap-1 bg-skin-input p-1 rounded-lg">
            {(['scatter', 'bar', 'pie', 'birthdays'] as const).map(t => (
              <button
                key={t}
                onClick={() => setChartType(t)}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md capitalize transition-all ${
                  chartType === t ? 'bg-skin-card text-skin-text shadow-sm border border-skin-border' : 'text-skin-muted hover:text-skin-text'
                }`}
              >
                {t === 'birthdays' ? 'Birthday Horizon' : t}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full">
          {chartType === 'scatter' && <TimelineGraph milestones={milestones} dob={dob} />}
          {chartType === 'bar' && renderBar()}
          {chartType === 'pie' && renderPie()}
          {chartType === 'birthdays' && renderBirthdayChart()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
              <div className="text-2xl font-bold text-indigo-600">{milestones.length}</div>
              <div className="text-xs text-indigo-500/80 uppercase font-semibold">Total Milestones</div>
          </div>
          <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
              <div className="text-2xl font-bold text-emerald-600">{milestones.filter(m => !m.isPast).length}</div>
              <div className="text-xs text-emerald-500/80 uppercase font-semibold">Future Events</div>
          </div>
           <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
              <div className="text-2xl font-bold text-amber-600">{milestones.filter(m => m.category === MilestoneCategory.Math).length}</div>
              <div className="text-xs text-amber-500/80 uppercase font-semibold">Math Curiosities</div>
          </div>
          <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
              <div className="text-2xl font-bold text-rose-600">{eventsThisYear}</div>
              <div className="text-xs text-rose-500/80 uppercase font-semibold">Events in {currentYear}</div>
          </div>
      </div>
    </div>
  );
};

export default VisualizationsPage;