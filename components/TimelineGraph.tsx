import React, { useState } from 'react';
import { 
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, 
  Tooltip, TooltipProps, CartesianGrid, ReferenceArea 
} from 'recharts';
import { Milestone, MilestoneCategory } from '../types';
import { format } from 'date-fns';
import { RotateCcw } from 'lucide-react';

interface Props {
  milestones: Milestone[];
  dob: Date;
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = payload[0].payload as any; 
    return (
      <div className="bg-skin-card p-3 border border-skin-border shadow-lg rounded-lg text-sm max-w-xs z-50">
        <p className="font-bold text-skin-text">{data.title}</p>
        <p className="text-skin-muted mb-2">{data.formattedDate}</p>
        <p className="text-xs text-skin-muted opacity-80">{data.description}</p>
        {data.sourceEventName !== 'Birth' && (
           <p className="text-xs text-amber-600 mt-1 font-medium">{data.sourceEventName}</p>
        )}
      </div>
    );
  }
  return null;
};

// Helper for pinch distance
const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
};

const TimelineGraph: React.FC<Props> = ({ milestones, dob }) => {
  const [left, setLeft] = useState<number | 'dataMin'>('dataMin');
  const [right, setRight] = useState<number | 'dataMax'>('dataMax');
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);

  // Pinch Zoom State
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);
  const [touchStartDomain, setTouchStartDomain] = useState<[number, number] | null>(null);

  // Helper conversion constants (Year in ms)
  const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

  const data = milestones.map(m => ({
    ...m,
    xAge: (m.date.getTime() - dob.getTime()) / MS_PER_YEAR,
    yCategory: Object.values(MilestoneCategory).indexOf(m.category) + 1,
    formattedDate: format(m.date, 'MMM do, yyyy')
  }));
  
  // Calculate bounds for initial pinch resolution
  const xValues = data.map(d => d.xAge);
  const minDataX = xValues.length > 0 ? Math.min(...xValues) : 0;
  const maxDataX = xValues.length > 0 ? Math.max(...xValues) : 100;

  const categoryNames = Object.values(MilestoneCategory);

  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === null || refAreaLeft === null) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    let min = refAreaLeft;
    let max = refAreaRight;

    if (min > max) [min, max] = [max, min];

    setRefAreaLeft(null);
    setRefAreaRight(null);
    setLeft(min);
    setRight(max);
  };

  const zoomOut = () => {
    setLeft('dataMin');
    setRight('dataMax');
    setRefAreaLeft(null);
    setRefAreaRight(null);
    setTouchStartDist(null);
    setTouchStartDomain(null);
  };
  
  // Touch Handlers for Pinch Zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      setTouchStartDist(dist);
      
      const currentLeft = typeof left === 'number' ? left : minDataX;
      const currentRight = typeof right === 'number' ? right : maxDataX;
      setTouchStartDomain([currentLeft, currentRight]);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist !== null && touchStartDomain !== null) {
      const currentDist = getTouchDistance(e.touches);
      if (currentDist === 0) return;

      const scale = touchStartDist / currentDist;
      
      const [startMin, startMax] = touchStartDomain;
      const domainRange = startMax - startMin;
      const newRange = domainRange * scale;
      const center = startMin + domainRange / 2;
      
      const newLeft = center - newRange / 2;
      const newRight = center + newRange / 2;

      setLeft(newLeft);
      setRight(newRight);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartDist(null);
    setTouchStartDomain(null);
  };

  // Date Input Handlers
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const date = new Date(e.target.value);
      if(!isNaN(date.getTime())) {
          const age = (date.getTime() - dob.getTime()) / MS_PER_YEAR;
          setLeft(age);
      }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const date = new Date(e.target.value);
      if(!isNaN(date.getTime())) {
          const age = (date.getTime() - dob.getTime()) / MS_PER_YEAR;
          setRight(age);
      }
  };

  // Convert current domain to date strings for inputs
  const getDomainDate = (val: number | 'dataMin' | 'dataMax', type: 'min' | 'max') => {
      if (typeof val === 'number') {
          const date = new Date(dob.getTime() + val * MS_PER_YEAR);
          return date.toISOString().split('T')[0];
      }
      // If auto, find actual min/max from data
      if (data.length === 0) return '';
      const dates = data.map(d => d.date.getTime());
      if (dates.length === 0) return '';
      
      const ts = type === 'min' ? Math.min(...dates) : Math.max(...dates);
      return new Date(ts).toISOString().split('T')[0];
  };

  return (
    <div className="bg-skin-card rounded-xl shadow-sm border border-skin-border p-4 w-full h-full flex flex-col min-h-[500px]">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h3 className="text-lg font-bold text-skin-text flex items-center gap-2">
            Timeline
            <span className="text-xs font-normal text-skin-muted bg-skin-input px-2 py-0.5 rounded-full border border-skin-border">
                Drag or Pinch to Zoom
            </span>
        </h3>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-skin-input p-1 rounded-lg border border-skin-border">
                <span className="text-xs text-skin-muted pl-2">From</span>
                <input 
                    type="date" 
                    className="bg-transparent text-xs font-medium text-skin-text focus:outline-none w-26"
                    value={getDomainDate(left, 'min')}
                    onChange={handleStartDateChange}
                />
                <span className="text-skin-border">|</span>
                <span className="text-xs text-skin-muted">To</span>
                <input 
                    type="date" 
                    className="bg-transparent text-xs font-medium text-skin-text focus:outline-none w-26"
                    value={getDomainDate(right, 'max')}
                    onChange={handleEndDateChange}
                />
            </div>
            <button 
                onClick={zoomOut}
                className="p-1.5 text-skin-muted hover:text-skin-primary hover:bg-skin-input rounded-lg transition-colors border border-transparent hover:border-skin-border"
                title="Reset Zoom"
            >
                <RotateCcw className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div 
        className="flex-1 w-full relative select-none touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ResponsiveContainer width="100%" height="100%" minHeight={400}>
            <ScatterChart
            onMouseDown={(e) => e && setRefAreaLeft(Number(e.xValue))}
            onMouseMove={(e) => refAreaLeft !== null && e && setRefAreaRight(Number(e.xValue))}
            onMouseUp={zoom}
            margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
            >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
            <XAxis 
                type="number" 
                dataKey="xAge" 
                name="Age" 
                unit="y" 
                domain={[left, right]}
                tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
                allowDataOverflow
                label={{ value: 'Age (Years)', position: 'insideBottom', offset: -5, fill: 'var(--color-muted)', fontSize: 12 }}
            />
            <YAxis 
                type="number" 
                dataKey="yCategory" 
                name="Category" 
                domain={[0, categoryNames.length + 1]} 
                tickFormatter={(val) => categoryNames[val - 1] || ''}
                width={80}
                tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
            />
            <ZAxis type="number" range={[50, 400]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            
            {categoryNames.map((cat) => (
                <Scatter 
                    key={cat} 
                    name={cat} 
                    data={data.filter(d => d.category === cat)} 
                    fill={data.find(d => d.category === cat)?.color || '#000'} 
                />
            ))}

            {refAreaLeft !== null && refAreaRight !== null ? (
                <ReferenceArea 
                    x1={refAreaLeft} 
                    x2={refAreaRight} 
                    strokeOpacity={0.3} 
                    fill="var(--color-primary)" 
                    fillOpacity={0.1} 
                />
            ) : null}

            </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimelineGraph;