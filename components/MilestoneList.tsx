import React, { useState, useMemo, useEffect } from 'react';
import { Milestone, MilestoneCategory } from '../types';
import { format } from 'date-fns';
import { CheckCircle2, Circle, Download, Calendar, Filter, CalendarPlus, CheckSquare, Square } from 'lucide-react';
import { generateICS, downloadICS } from '../utils/calendar';
import ShareButton from './ShareButton';
import { getGoogleCalendarUrl } from '../utils/generators';

interface Props {
  milestones: Milestone[];
  onShare: (title: string, text: string, milestone?: Milestone) => void;
  initialFilter?: {
      time?: 'all' | 'future' | 'past';
      category?: MilestoneCategory | 'All';
      year?: number;
  };
}

const MilestoneList: React.FC<Props> = ({ milestones, onShare, initialFilter }) => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'future' | 'past'>('all');
  const [categoryFilter, setCategoryFilter] = useState<MilestoneCategory | 'All'>('All');
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Apply initial filters if provided
  useEffect(() => {
      if (initialFilter) {
          if (initialFilter.time) setTimeFilter(initialFilter.time);
          if (initialFilter.category) setCategoryFilter(initialFilter.category);
          if (initialFilter.year) setYearFilter(initialFilter.year);
      }
  }, [initialFilter]);
  
  const filtered = useMemo(() => milestones.filter(m => {
    let matchesTime = true;
    if (timeFilter === 'future') matchesTime = !m.isPast;
    if (timeFilter === 'past') matchesTime = m.isPast;

    let matchesCategory = true;
    if (categoryFilter !== 'All') matchesCategory = m.category === categoryFilter;

    let matchesYear = true;
    if (yearFilter) matchesYear = m.date.getFullYear() === yearFilter;

    return matchesTime && matchesCategory && matchesYear;
  }), [milestones, timeFilter, categoryFilter, yearFilter]);

  const displayLimit = 200; 
  const displayList = filtered.slice(0, displayLimit);

  // --- Selection Handlers ---

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
      if (selectedIds.size === displayList.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(displayList.map(m => m.id)));
      }
  };

  const handleExport = () => {
    const itemsToExport = selectedIds.size > 0 
        ? filtered.filter(m => selectedIds.has(m.id))
        : filtered;
    
    if (itemsToExport.length === 0) return;

    const icsContent = generateICS(itemsToExport);
    downloadICS('life-milestones.ics', icsContent);
    
    if (selectedIds.size > 0) {
        setSelectedIds(new Set());
        setIsSelectionMode(false);
    }
  };

  const clearFilters = () => {
      setTimeFilter('all');
      setCategoryFilter('All');
      setYearFilter(null);
  };

  return (
    <div className="bg-skin-card/40 backdrop-blur-2xl rounded-[2rem] shadow-xl border border-white/20 overflow-hidden flex flex-col h-full min-h-[700px] animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex flex-col gap-4 bg-white/5">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-skin-text text-xl tracking-tight">Timeline</h3>
                <p className="text-sm text-skin-muted font-medium mt-1">
                    {displayList.length} events {selectedIds.size > 0 ? `(${selectedIds.size} selected)` : ''}
                    {yearFilter && <span className="ml-2 bg-skin-primary/10 text-skin-primary px-2 py-0.5 rounded text-xs font-bold">Year: {yearFilter}</span>}
                </p>
            </div>
            {(yearFilter || categoryFilter !== 'All' || timeFilter !== 'all') && (
                <button onClick={clearFilters} className="text-xs font-bold text-skin-primary hover:underline">Clear Filters</button>
            )}
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full">
            {/* Filters */}
            <div className="relative group w-full md:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-3 w-3 text-skin-muted" />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as MilestoneCategory | 'All')}
                  className="pl-9 pr-8 py-2 text-xs font-bold rounded-xl bg-skin-base/40 border border-white/10 text-skin-text focus:outline-none focus:ring-2 focus:ring-skin-primary w-full md:w-auto backdrop-blur-md appearance-none"
                >
                  <option value="All">All Categories</option>
                  {Object.values(MilestoneCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
            </div>

            <div className="flex gap-1 bg-skin-base/40 p-1 rounded-xl w-full md:w-auto backdrop-blur-md border border-white/10">
            {(['all', 'past', 'future'] as const).map(f => (
                <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                    timeFilter === f 
                    ? 'bg-skin-card shadow-sm text-skin-primary' 
                    : 'text-skin-muted hover:text-skin-text'
                }`}
                >
                {f}
                </button>
            ))}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto ml-auto">
                <button
                    onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        if(isSelectionMode) setSelectedIds(new Set());
                    }}
                    className={`p-2 rounded-xl border transition-colors ${isSelectionMode ? 'bg-skin-primary text-white border-skin-primary' : 'bg-skin-base/40 border-white/10 text-skin-muted hover:text-skin-text'}`}
                    title="Select Events"
                >
                    <CheckSquare size={16} />
                </button>

                <button 
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-skin-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-skin-primary/30 hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                >
                    <Download className="w-4 h-4" />
                    <span>{selectedIds.size > 0 ? 'Export Selected' : 'Export List'}</span>
                </button>
            </div>
        </div>
      </div>
      
      {/* List */}
      <div className="overflow-y-auto flex-1 p-4 space-y-2 relative">
        {/* Select All Bar */}
        {isSelectionMode && displayList.length > 0 && (
            <div className="sticky top-0 z-20 bg-skin-card/95 backdrop-blur-md p-3 mb-2 rounded-xl border border-skin-primary/30 flex items-center gap-3 shadow-md">
                <button 
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-xs font-bold text-skin-primary hover:text-skin-text"
                >
                    {selectedIds.size === displayList.length ? <CheckSquare size={16}/> : <Square size={16}/>}
                    {selectedIds.size === displayList.length ? 'Deselect All' : 'Select All Visible'}
                </button>
                <span className="text-xs text-skin-muted ml-auto">
                    Export multiple events to Calendar
                </span>
            </div>
        )}

        {displayList.length === 0 ? (
          <div className="text-center text-skin-muted py-24 flex flex-col items-center">
            <Calendar className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-medium">No milestones found.</p>
          </div>
        ) : (
          displayList.map(m => {
            const isSelected = selectedIds.has(m.id);
            return (
                <div 
                key={m.id} 
                onClick={() => isSelectionMode && toggleSelection(m.id)}
                className={`group flex items-start gap-4 p-4 rounded-2xl transition-all border ${
                    isSelected
                        ? 'bg-skin-primary/10 border-skin-primary ring-1 ring-skin-primary'
                        : m.isPast 
                            ? 'bg-skin-base/20 border-transparent opacity-60 hover:opacity-100 hover:bg-skin-base/40' 
                            : 'bg-skin-card/60 border-white/20 shadow-sm hover:shadow-md hover:scale-[1.01] hover:bg-skin-card/80 backdrop-blur-md'
                } ${isSelectionMode ? 'cursor-pointer' : ''}`}
                >
                {isSelectionMode ? (
                    <div className={`mt-2 ${isSelected ? 'text-skin-primary' : 'text-skin-muted'}`}>
                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                ) : (
                    <div className="mt-1.5">
                        {m.isPast ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500/80" />
                        ) : (
                        <Circle className="w-5 h-5 text-skin-primary" />
                        )}
                    </div>
                )}

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
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a 
                                href={getGoogleCalendarUrl(m)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full text-skin-muted hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                                title="Add to Google Calendar"
                                onClick={(e) => e.stopPropagation()} 
                            >
                                <CalendarPlus size={14} />
                            </a>
                            <ShareButton 
                                title={m.title} 
                                text={m.description}
                                className="text-skin-muted hover:text-skin-primary hover:bg-skin-primary/10"
                                iconSize={14}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onShare(m.title, m.description, m);
                                }}
                            />
                        </div>
                    </div>
                </div>
                </div>
            )
          })
        )}
      </div>
    </div>
  );
};

export default MilestoneList;