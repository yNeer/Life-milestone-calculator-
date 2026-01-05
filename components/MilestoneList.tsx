import React, { useState } from 'react';
import { Milestone, MilestoneCategory } from '../types';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Download, Calendar, Filter } from 'lucide-react';
import { generateICS, downloadICS } from '../utils/calendar';
import ShareButton from './ShareButton';

interface Props {
  milestones: Milestone[];
  onShare: (title: string, text: string, milestone?: Milestone) => void;
}

const MilestoneList: React.FC<Props> = ({ milestones, onShare }) => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'future' | 'past'>('all');
  const [categoryFilter, setCategoryFilter] = useState<MilestoneCategory | 'All'>('All');
  
  const filtered = milestones.filter(m => {
    let matchesTime = true;
    if (timeFilter === 'future') matchesTime = !m.isPast;
    if (timeFilter === 'past') matchesTime = m.isPast;

    let matchesCategory = true;
    if (categoryFilter !== 'All') matchesCategory = m.category === categoryFilter;

    return matchesTime && matchesCategory;
  });

  const displayLimit = 100;
  const displayList = filtered.slice(0, displayLimit);

  const handleExportCalendar = () => {
    const icsContent = generateICS(filtered);
    downloadICS('life-milestones.ics', icsContent);
  };

  return (
    <div className="bg-skin-card/40 backdrop-blur-2xl rounded-[2rem] shadow-xl border border-white/20 overflow-hidden flex flex-col h-full min-h-[700px] animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5">
        <div>
            <h3 className="font-bold text-skin-text text-xl tracking-tight">Timeline</h3>
            <p className="text-sm text-skin-muted font-medium mt-1">
                {displayList.length} events found
            </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
            <div className="relative group w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-3 w-3 text-skin-muted" />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as MilestoneCategory | 'All')}
                  className="pl-9 pr-8 py-2 text-xs font-bold rounded-xl bg-skin-base/40 border border-white/10 text-skin-text focus:outline-none focus:ring-2 focus:ring-skin-primary w-full sm:w-auto backdrop-blur-md appearance-none"
                >
                  <option value="All">All Categories</option>
                  {Object.values(MilestoneCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
            </div>

            <div className="flex gap-1 bg-skin-base/40 p-1 rounded-xl w-full sm:w-auto backdrop-blur-md border border-white/10">
            {(['all', 'past', 'future'] as const).map(f => (
                <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                    timeFilter === f 
                    ? 'bg-skin-card shadow-sm text-skin-primary' 
                    : 'text-skin-muted hover:text-skin-text'
                }`}
                >
                {f}
                </button>
            ))}
            </div>
            
            <button 
                onClick={handleExportCalendar}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-skin-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-skin-primary/30 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
            >
                <Download className="w-4 h-4" />
                <span>Export</span>
            </button>
        </div>
      </div>
      
      {/* List */}
      <div className="overflow-y-auto flex-1 p-4 space-y-2">
        {displayList.length === 0 ? (
          <div className="text-center text-skin-muted py-24 flex flex-col items-center">
            <Calendar className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-medium">No milestones found.</p>
          </div>
        ) : (
          displayList.map(m => (
            <div 
              key={m.id} 
              className={`group flex items-start gap-4 p-4 rounded-2xl transition-all border ${
                m.isPast 
                    ? 'bg-skin-base/20 border-transparent opacity-60 hover:opacity-100 hover:bg-skin-base/40' 
                    : 'bg-skin-card/60 border-white/20 shadow-sm hover:shadow-md hover:scale-[1.01] hover:bg-skin-card/80 backdrop-blur-md'
              }`}
            >
              <div className="mt-1.5">
                {m.isPast ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500/80" />
                ) : (
                  <Circle className="w-5 h-5 text-skin-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                  <h4 className={`font-bold text-base truncate ${m.isPast ? 'text-skin-muted' : 'text-skin-text'}`}>
                    {m.title}
                  </h4>
                  <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md`} style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                        {format(m.date, 'MMM d, yyyy')}
                      </span>
                  </div>
                </div>
                <p className="text-sm text-skin-muted mt-1 leading-relaxed">{m.description}</p>
                <div className="flex items-center justify-between mt-3">
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-block text-[10px] font-bold text-skin-muted bg-skin-base/50 px-2 py-1 rounded-lg backdrop-blur-sm">
                            {m.category}
                        </span>
                        {m.sourceEventName !== 'Birth' && (
                            <span className="inline-block text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-1 rounded-lg backdrop-blur-sm">
                                {m.sourceEventName}
                            </span>
                        )}
                    </div>
                    <ShareButton 
                        title={m.title} 
                        text={m.description}
                        className="opacity-0 group-hover:opacity-100 text-skin-muted hover:text-skin-primary bg-skin-base/50 hover:bg-skin-base"
                        iconSize={14}
                        onClick={() => onShare(m.title, m.description, m)}
                    />
                </div>
              </div>
            </div>
          ))
        )}
        {filtered.length > displayLimit && (
            <div className="text-center py-6 text-sm text-skin-muted font-bold opacity-60">
                + {filtered.length - displayLimit} more events
            </div>
        )}
      </div>
    </div>
  );
};

export default MilestoneList;