import React, { useState, useMemo, useRef } from 'react';
import { Milestone, MilestoneCategory } from '../types';
import { format } from 'date-fns';
import { Calendar, Download, Filter, CheckSquare, Square, Image as ImageIcon, Map, ChevronDown, Flag, User, Star } from 'lucide-react';
import { generateICS, downloadICS } from '../utils/calendar';
import html2canvas from 'html2canvas';

interface Props {
  milestones: Milestone[];
  userName: string;
}

const ExportView: React.FC<Props> = ({ milestones, userName }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<MilestoneCategory | 'All'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const roadmapRef = useRef<HTMLDivElement>(null);

  const filteredMilestones = useMemo(() => {
    return milestones.filter(m => {
      let matchesCategory = true;
      if (categoryFilter !== 'All') {
        matchesCategory = m.category === categoryFilter;
      }
      let matchesDate = true;
      if (startDate) matchesDate = m.date >= new Date(startDate);
      if (endDate) matchesDate = matchesDate && m.date <= new Date(endDate);
      return matchesCategory && matchesDate;
    });
  }, [milestones, categoryFilter, startDate, endDate]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredMilestones.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredMilestones.map(m => m.id)));
  };
  
  const handleExportICS = () => {
    const selected = milestones.filter(m => selectedIds.has(m.id));
    if (selected.length === 0) return alert("Select milestones to export.");
    const content = generateICS(selected);
    downloadICS(`${userName}_milestones.ics`, content);
  };

  const handleDownloadImage = async () => {
      if (!roadmapRef.current) return;
      setIsGenerating(true);
      
      try {
          // Get computed style to ensure background matches theme
          const computedStyle = window.getComputedStyle(roadmapRef.current);
          const backgroundColor = computedStyle.backgroundColor;

          const canvas = await html2canvas(roadmapRef.current, {
              scale: 2, // High resolution
              useCORS: true,
              allowTaint: true,
              backgroundColor: backgroundColor, // Use actual theme color
              logging: false,
              width: roadmapRef.current.scrollWidth,
              height: roadmapRef.current.scrollHeight,
              windowWidth: roadmapRef.current.scrollWidth,
              windowHeight: roadmapRef.current.scrollHeight,
              scrollX: 0,
              scrollY: 0,
              x: 0,
              y: 0,
              onclone: (doc) => {
                  // Ensure all elements are visible in clone
                  const el = doc.getElementById('roadmap-container');
                  if (el) {
                      el.style.height = 'auto';
                      el.style.overflow = 'visible';
                  }
              }
          });
          
          const url = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `${userName}_Roadmap.png`;
          link.href = url;
          link.click();
      } catch (e) {
          console.error("Export Error:", e);
          alert("Failed to generate image. Please try selecting fewer events or check console for details.");
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="bg-skin-card/50 backdrop-blur-2xl rounded-2xl shadow-sm border border-white/20 overflow-hidden flex flex-col h-full min-h-[85vh] animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="p-6 border-b border-skin-border/50 bg-skin-base/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-skin-text flex items-center gap-3">
            <Map className="w-6 h-6 text-skin-primary" />
            Milestone Roadmap
            </h2>
            <p className="text-sm text-skin-muted mt-1">Select events to create your life's infographic journey.</p>
        </div>
        <div className="flex gap-2">
             <button 
                onClick={handleExportICS}
                disabled={selectedIds.size === 0}
                className="px-4 py-2 bg-skin-input hover:bg-skin-border/50 text-skin-text font-bold rounded-lg transition-all flex items-center gap-2 text-sm disabled:opacity-50"
            >
                <Calendar className="w-4 h-4" /> Export ICS
            </button>
             <button 
                onClick={handleDownloadImage}
                disabled={selectedIds.size === 0 || isGenerating}
                className="px-4 py-2 bg-skin-primary hover:opacity-90 text-white font-bold rounded-lg transition-all flex items-center gap-2 text-sm disabled:opacity-50 shadow-md"
            >
                {isGenerating ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div> : <ImageIcon className="w-4 h-4" />}
                Download Infographic
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-skin-base/20 border-b border-skin-border/50 grid grid-cols-1 md:grid-cols-4 gap-4">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as any)} className="p-2 rounded-lg bg-skin-card/50 border border-skin-border/50 text-sm">
            <option value="All">All Categories</option>
            {Object.values(MilestoneCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 rounded-lg bg-skin-card/50 border border-skin-border/50 text-sm" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 rounded-lg bg-skin-card/50 border border-skin-border/50 text-sm" />
          <div className="flex items-center justify-end">
              <button onClick={selectAll} className="text-sm font-bold text-skin-primary hover:underline flex items-center gap-1">
                 {selectedIds.size === filteredMilestones.length ? <CheckSquare size={16}/> : <Square size={16}/>}
                 {selectedIds.size === filteredMilestones.length ? 'Deselect All' : 'Select All'}
              </button>
          </div>
      </div>

      {/* Roadmap Visualization */}
      <div className="flex-1 overflow-y-auto bg-skin-base/30 relative custom-scrollbar p-8">
          {filteredMilestones.length === 0 ? (
              <div className="text-center py-20 text-skin-muted opacity-60">No milestones found. Try adjusting filters.</div>
          ) : (
            <div 
                id="roadmap-container"
                ref={roadmapRef} 
                className="relative max-w-3xl mx-auto py-12 px-8 bg-skin-base border-x border-skin-border/30 shadow-2xl min-h-full"
                style={{ backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            >
                {/* Central Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-skin-primary/50 to-transparent transform -translate-x-1/2"></div>
                
                {/* Header Node */}
                <div className="relative z-10 text-center mb-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-skin-primary text-white shadow-xl border-4 border-skin-base mb-4">
                        <User size={32} />
                    </div>
                    <h1 className="text-4xl font-black text-skin-text tracking-tight uppercase">{userName}'s Journey</h1>
                    <p className="text-skin-muted font-mono text-sm mt-2">{format(new Date(), 'MMMM d, yyyy')}</p>
                </div>

                {/* Timeline Items */}
                <div className="space-y-12">
                    {filteredMilestones.map((m, index) => {
                        const isSelected = selectedIds.has(m.id);
                        const isEven = index % 2 === 0;
                        
                        return (
                            <div 
                                key={m.id} 
                                className={`relative flex items-center ${isEven ? 'flex-row' : 'flex-row-reverse'} group cursor-pointer`}
                                onClick={() => toggleSelection(m.id)}
                            >
                                {/* Connector Dot */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                    <div className={`w-6 h-6 rounded-full border-4 border-skin-base transition-all duration-300 ${isSelected ? 'bg-skin-primary scale-125' : 'bg-skin-border'}`}></div>
                                </div>

                                {/* Content Card */}
                                <div className={`w-[45%] ${isEven ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                                    <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${isSelected ? 'bg-skin-card shadow-lg border-skin-primary/50 scale-105' : 'bg-skin-card/40 border-skin-border hover:bg-skin-card/80 opacity-60 hover:opacity-100'}`}>
                                        
                                        {isSelected && (
                                            <div className="absolute top-0 right-0 p-1.5 bg-skin-primary text-white rounded-bl-xl">
                                                <CheckSquare size={12} />
                                            </div>
                                        )}

                                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isSelected ? 'text-skin-primary' : 'text-skin-muted'}`}>
                                            {format(m.date, 'MMMM d, yyyy')}
                                        </div>
                                        
                                        <h3 className="text-lg font-bold text-skin-text leading-tight mb-2">{m.title}</h3>
                                        
                                        <p className="text-xs text-skin-muted leading-relaxed">{m.description}</p>
                                        
                                        <div className={`mt-3 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isSelected ? 'bg-skin-primary/10 text-skin-primary border-skin-primary/20' : 'bg-skin-input text-skin-muted border-transparent'}`}>
                                            {m.category}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Spacer for the other side */}
                                <div className="w-[45%]"></div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Node */}
                <div className="relative z-10 text-center mt-16">
                     <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-skin-card border-4 border-skin-base shadow-lg text-skin-muted">
                        <Flag size={20} />
                     </div>
                     <div className="mt-4 text-xs font-bold text-skin-muted uppercase tracking-widest">To Be Continued...</div>
                </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default ExportView;
