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
    // 1. Time Filter
    let matchesTime = true;
    if (timeFilter === 'future') matchesTime = !m.isPast;
    if (timeFilter === 'past') matchesTime = m.isPast;

    // 2. Category Filter
    let matchesCategory = true;
    if (categoryFilter !== 'All') matchesCategory = m.category === categoryFilter;

    return matchesTime && matchesCategory;
  });

  const displayLimit = 100; // Reduced for performance with many items, could implement virtualization later
  const displayList = filtered.slice(0, displayLimit);

  const handleExportCalendar = () => {
    const icsContent = generateICS(filtered);
    downloadICS('life-milestones.ics', icsContent);
  };

  return (
    <div className="bg-skin-card rounded-xl shadow-sm border border-skin-border overflow-hidden flex flex-col h-full min-h-[600px] animate-in fade-in duration-500">
      {/* Header Controls */}
      <div className="p-4 border-b border-skin-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-skin-base/50">
        <div>
            <h3 className="font-bold text-skin-text text-lg">All Milestones</h3>
            <p className="text-xs text-skin-muted">Viewing {displayList.length} of {filtered.length} events</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
            
            {/* Category Dropdown */}
            <div className="relative group w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-3 w-3 text-skin-muted" />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as MilestoneCategory | 'All')}
                  className="pl-8 pr-8 py-1.5 text-xs font-medium rounded-md bg-skin-card border border-skin-border text-skin-text focus:outline-none focus:ring-2 focus:ring-skin-primary w-full sm:w-auto"
                >
                  <option value="All">All Categories</option>
                  {Object.values(MilestoneCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
            </div>

            {/* Time Toggles */}
            <div className="flex gap-1 bg-skin-input p-1 rounded-lg w-full sm:w-auto">
            {(['all', 'past', 'future'] as const).map(f => (
                <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                    timeFilter === f 
                    ? 'bg-skin-card text-skin-primary shadow-sm border border-skin-border' 
                    : 'text-skin-muted hover:text-skin-text'
                }`}
                >
                {f}
                </button>
            ))}
            </div>
            
            <button 
                onClick={handleExportCalendar}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-skin-primary hover:opacity-90 text-white text-xs font-bold rounded-lg transition-all shadow-sm w-full sm:w-auto"
            >
                <Download className="w-4 h-4" />
                <span className="inline">Export</span>
            </button>
        </div>
      </div>
      
      {/* List Content */}
      <div className="overflow-y-auto flex-1 p-2">
        {displayList.length === 0 ? (
          <div className="text-center text-skin-muted py-20 flex flex-col items-center">
            <Calendar className="w-12 h-12 mb-4 opacity-20" />
            No milestones found matching your filters.
          </div>
        ) : (
          displayList.map(m => (
            <div 
              key={m.id} 
              className={`group flex items-start gap-4 p-4 rounded-lg mb-2 transition-colors border ${
                m.isPast 
                    ? 'bg-skin-base/30 border-skin-border/50 opacity-60 hover:opacity-100' 
                    : 'bg-skin-card border-skin-border hover:border-skin-primary/30 hover:shadow-sm'
              }`}
            >
              <div className="mt-1">
                {m.isPast ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500/70" />
                ) : (
                  <Circle className="w-5 h-5 text-skin-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                  <h4 className={`font-semibold text-base ${m.isPast ? 'text-skin-muted' : 'text-skin-text'}`}>
                    {m.title}
                  </h4>
                  <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full w-fit whitespace-nowrap`} style={{ backgroundColor: `${m.color}20`, color: m.color }}>
                        {format(m.date, 'EEEE, dd MMM yyyy')}
                      </span>
                  </div>
                </div>
                <p className="text-sm text-skin-muted mt-1">{m.description}</p>
                <div className="flex items-center justify-between mt-2">
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-skin-muted bg-skin-base border border-skin-border px-1.5 py-0.5 rounded">
                            {m.category}
                        </span>
                        {m.sourceEventName !== 'Birth' && (
                            <span className="inline-block text-[10px] uppercase tracking-wider font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                {m.sourceEventName}
                            </span>
                        )}
                    </div>
                    <ShareButton 
                        title={m.title} 
                        text={`I ${m.isPast ? 'reached' : 'will reach'} ${m.title} on ${format(m.date, 'MMM do, yyyy')}!`}
                        className="opacity-0 group-hover:opacity-100 text-skin-muted hover:text-skin-primary"
                        iconSize={14}
                        onClick={() => onShare(m.title, m.description, m)}
                    />
                </div>
              </div>
            </div>
          ))
        )}
        {filtered.length > displayLimit && (
            <div className="text-center py-8 text-sm text-skin-muted font-medium">
                And {filtered.length - displayLimit} more events...
            </div>
        )}
      </div>
    </div>
  );
};

export default MilestoneList;