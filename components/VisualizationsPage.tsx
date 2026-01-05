import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, 
  Cell, RadialBarChart, RadialBar, AreaChart, Area
} from 'recharts';
import { Milestone, MilestoneCategory } from '../types';
import { format, differenceInDays, differenceInYears } from 'date-fns';
import TimelineGraph from './TimelineGraph';
import { Activity, PieChart as PieIcon, BarChart3, Calendar, Zap, Layers } from 'lucide-react';

interface Props {
  milestones: Milestone[];
  dob: Date;
}

const IOSSegmentedControl = ({ options, selected, onChange }: { options: string[], selected: string, onChange: (val: any) => void }) => (
    <div className="bg-skin-input/50 p-1 rounded-xl flex relative border border-white/10 backdrop-blur-md">
        {options.map((opt) => {
            const isActive = selected === opt;
            return (
                <button
                    key={opt}
                    onClick={() => onChange(opt)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 capitalize z-10 ${isActive ? 'text-skin-text shadow-sm' : 'text-skin-muted hover:text-skin-text'}`}
                >
                    {opt}
                </button>
            );
        })}
        {/* Sliding Background */}
        <div 
            className="absolute top-1 bottom-1 bg-skin-card rounded-lg shadow-sm transition-all duration-300 ease-out border border-black/5"
            style={{ 
                left: `${(options.indexOf(selected) / options.length) * 100}%`, 
                marginLeft: '4px',
                width: `calc(${100 / options.length}% - 8px)`
            }}
        />
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-skin-card/80 backdrop-blur-xl p-3 border border-white/20 shadow-2xl rounded-2xl min-w-[150px]">
                <p className="text-xs font-bold text-skin-muted uppercase tracking-wider mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4">
                        <span className="text-sm font-semibold text-skin-text capitalize" style={{ color: entry.color }}>
                            {entry.name}
                        </span>
                        <span className="text-base font-black font-mono">
                            {entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const VisualizationsPage: React.FC<Props> = ({ milestones, dob }) => {
  const [viewMode, setViewMode] = useState<'overview' | 'distribution' | 'timeline'>('overview');
  const now = new Date();
  
  // --- Data Prep ---

  // 1. Category Distribution (Bar Data)
  const categoryData = useMemo(() => {
      const counts: Record<string, number> = {};
      milestones.forEach(m => { counts[m.category] = (counts[m.category] || 0) + 1; });
      return Object.entries(counts)
        .map(([name, value]) => ({ 
            name, 
            value, 
            color: milestones.find(m => m.category === name)?.color || '#ccc' 
        }))
        .sort((a, b) => b.value - a.value);
  }, [milestones]);

  // 2. Life Progress (Radial Data)
  const lifeProgressData = useMemo(() => {
      const ageYears = differenceInYears(now, dob);
      const ageDays = differenceInDays(now, dob);
      // Benchmarks
      const cap100 = 100;
      const percentLife = Math.min((ageYears / cap100) * 100, 100);
      
      return [
        { name: '100 Years', value: 100, fill: 'var(--color-input)' }, // Track
        { name: 'Life Lived', value: percentLife, fill: '#f43f5e' }   // Progress
      ];
  }, [dob, now]);

  // 3. Yearly Density (Area Data)
  const densityData = useMemo(() => {
      const yearMap = new Map<number, number>();
      milestones.forEach(m => {
          const y = m.date.getFullYear();
          yearMap.set(y, (yearMap.get(y) || 0) + 1);
      });
      
      const years = Array.from(yearMap.keys()).sort();
      const minYear = years[0];
      const maxYear = years[years.length - 1];
      
      const data = [];
      for(let y = minYear; y <= maxYear; y++) {
          data.push({ year: y, count: yearMap.get(y) || 0 });
      }
      return data;
  }, [milestones]);

  // --- Renderers ---

  const renderOverview = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          {/* Life Ring */}
          <div className="bg-skin-base/30 rounded-[2rem] p-6 flex flex-col items-center justify-center relative overflow-hidden border border-white/10">
              <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="p-1.5 bg-rose-500 rounded-lg text-white"><Activity size={16} /></div>
                  <span className="text-xs font-bold text-skin-muted uppercase tracking-wider">Life Progress</span>
              </div>
              
              <div className="relative w-64 h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                        innerRadius="70%" 
                        outerRadius="100%" 
                        barSize={20} 
                        data={lifeProgressData} 
                        startAngle={90} 
                        endAngle={-270}
                    >
                        <RadialBar
                            background
                            cornerRadius={20}
                            dataKey="value"
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-black text-skin-text">{lifeProgressData[1].value.toFixed(0)}%</span>
                    <span className="text-xs font-bold text-skin-muted uppercase">of 100 Years</span>
                </div>
              </div>
          </div>

          {/* Density Heatmap */}
          <div className="bg-skin-base/30 rounded-[2rem] p-6 flex flex-col justify-between border border-white/10">
               <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-skin-primary rounded-lg text-white"><Zap size={16} /></div>
                  <span className="text-xs font-bold text-skin-muted uppercase tracking-wider">Event Density</span>
              </div>
              <div className="flex-1 min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={densityData}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.3}/>
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-muted)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="var(--color-primary)" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorCount)" 
                          />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-center text-skin-muted mt-2 font-medium">Timeline Activity Distribution</p>
          </div>
      </div>
  );

  const renderDistribution = () => (
      <div className="h-[450px] w-full bg-skin-base/30 rounded-[2rem] p-6 border border-white/10 flex flex-col">
          <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500 rounded-lg text-white"><Layers size={16} /></div>
                  <span className="text-xs font-bold text-skin-muted uppercase tracking-wider">Category Breakdown</span>
              </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" opacity={0.3}/>
                    <XAxis type="number" hide />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={80} 
                        tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--color-muted)' }} 
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-input)', opacity: 0.4, radius: 8 }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20} background={{ fill: 'var(--color-input)', radius: 6 }}>
                        {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Controls */}
      <div className="bg-skin-card/40 backdrop-blur-2xl p-2 rounded-[2.5rem] shadow-xl border border-white/20 flex flex-col md:flex-row justify-between items-center gap-4 px-6 py-4">
        <div>
           <h2 className="text-2xl font-bold text-skin-text tracking-tight">Analytics</h2>
           <p className="text-xs text-skin-muted font-bold uppercase tracking-wide">Visualize your journey</p>
        </div>
        <div className="w-full md:w-64">
            <IOSSegmentedControl 
                options={['overview', 'distribution', 'timeline']} 
                selected={viewMode} 
                onChange={setViewMode} 
            />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-skin-card/40 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-xl border border-white/20 min-h-[500px]">
          {viewMode === 'overview' && renderOverview()}
          {viewMode === 'distribution' && renderDistribution()}
          {viewMode === 'timeline' && <TimelineGraph milestones={milestones} dob={dob} />}
      </div>
      
      {/* Bottom Summary Grid (Apple Health Style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-skin-card/50 backdrop-blur-xl p-5 rounded-[1.8rem] border border-white/20 shadow-sm flex flex-col justify-between h-32 group hover:bg-skin-card/70 transition-colors">
              <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                     <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Total</span>
                     <span className="text-3xl font-black text-skin-text">{milestones.length}</span>
                  </div>
                  <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-full"><BarChart3 size={18}/></div>
              </div>
              <div className="text-[10px] text-skin-muted font-bold">Milestones Generated</div>
          </div>

          <div className="bg-skin-card/50 backdrop-blur-xl p-5 rounded-[1.8rem] border border-white/20 shadow-sm flex flex-col justify-between h-32 group hover:bg-skin-card/70 transition-colors">
              <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                     <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Future</span>
                     <span className="text-3xl font-black text-skin-text">{milestones.filter(m => !m.isPast).length}</span>
                  </div>
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-full"><Calendar size={18}/></div>
              </div>
              <div className="text-[10px] text-skin-muted font-bold">Upcoming Moments</div>
          </div>

           <div className="bg-skin-card/50 backdrop-blur-xl p-5 rounded-[1.8rem] border border-white/20 shadow-sm flex flex-col justify-between h-32 group hover:bg-skin-card/70 transition-colors">
              <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                     <span className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Math</span>
                     <span className="text-3xl font-black text-skin-text">{milestones.filter(m => m.category === MilestoneCategory.Math).length}</span>
                  </div>
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-full"><PieIcon size={18}/></div>
              </div>
              <div className="text-[10px] text-skin-muted font-bold">Math Curiosities</div>
          </div>

          <div className="bg-skin-card/50 backdrop-blur-xl p-5 rounded-[1.8rem] border border-white/20 shadow-sm flex flex-col justify-between h-32 group hover:bg-skin-card/70 transition-colors">
              <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                     <span className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">This Year</span>
                     <span className="text-3xl font-black text-skin-text">{milestones.filter(m => m.date.getFullYear() === now.getFullYear()).length}</span>
                  </div>
                  <div className="p-2 bg-rose-500/10 text-rose-500 rounded-full"><Activity size={18}/></div>
              </div>
              <div className="text-[10px] text-skin-muted font-bold">Events in {now.getFullYear()}</div>
          </div>
      </div>
    </div>
  );
};

export default VisualizationsPage;