import React, { useState } from 'react';
import { 
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, 
  Tooltip, TooltipProps, CartesianGrid, ReferenceArea 
} from 'recharts';
import { Milestone, MilestoneCategory } from '../types';
import { format } from 'date-fns';
import { RotateCcw, ZoomIn } from 'lucide-react';

interface Props {
  milestones: Milestone[];
  dob: Date;
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = payload[0].payload as any; 
    return (
      <div className="bg-skin-card/90 backdrop-blur-xl p-3 border border-white/20 shadow-xl rounded-xl text-sm max-w-[200px] z-50">
        <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
             <p className="font-bold text-skin-text text-xs leading-tight">{data.title}</p>
        </div>
        <p className="text-skin-muted text-[10px] font-bold uppercase tracking-wide mb-2">{data.formattedDate}</p>
        <p className="text-xs text-skin-muted opacity-80 leading-relaxed">{data.description}</p>
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

  return (
    <div className="bg-skin-base/30 rounded-[2rem] border border-white/10 p-4 w-full h-full flex flex-col min-h-[450px]">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 px-2">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500 rounded-lg text-white"><ZoomIn size={16} /></div>
            <span className="text-xs font-bold text-skin-muted uppercase tracking-wider">Deep Timeline</span>
        </div>

        <button 
            onClick={zoomOut}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-skin-primary bg-skin-primary/10 rounded-full hover:bg-skin-primary hover:text-white transition-colors"
        >
            <RotateCcw className="w-3 h-3" />
            Reset Zoom
        </button>
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
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.2} />
            <XAxis 
                type="number" 
                dataKey="xAge" 
                name="Age" 
                unit="y" 
                domain={[left, right]}
                tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--color-muted)' }}
                axisLine={false}
                tickLine={false}
                allowDataOverflow
                label={{ value: 'Age (Years)', position: 'insideBottom', offset: -5, fill: 'var(--color-muted)', fontSize: 10, fontWeight: 700 }}
            />
            <YAxis 
                type="number" 
                dataKey="yCategory" 
                name="Category" 
                domain={[0, categoryNames.length + 1]} 
                tickFormatter={(val) => categoryNames[val - 1] || ''}
                width={70}
                tick={{ fontSize: 9, fontWeight: 600, fill: 'var(--color-muted)' }}
                axisLine={false}
                tickLine={false}
            />
            <ZAxis type="number" range={[40, 100]} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', strokeOpacity: 0.2 }} />
            
            {categoryNames.map((cat) => (
                <Scatter 
                    key={cat} 
                    name={cat} 
                    data={data.filter(d => d.category === cat)} 
                    fill={data.find(d => d.category === cat)?.color || '#000'} 
                    shape="circle"
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