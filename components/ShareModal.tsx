import React, { useRef, useState, useEffect, useMemo } from 'react';
import { X, Download, Video, Image as ImageIcon, Check, Palette, Film, Instagram, Smartphone, Square, Activity, Move, Sparkles, Timer, Calendar, ZoomIn, Monitor, Gauge, Share2, Copy, AlertCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Milestone, UserProfile } from '../types';
import { format, differenceInDays } from 'date-fns';
import { themes } from '../utils/themes';
import Logo from './Logo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
  milestone?: Milestone;
  userProfile: UserProfile;
  allMilestones?: Milestone[];
}

const ShareModal: React.FC<Props> = ({ isOpen, onClose, title, text, milestone, userProfile, allMilestones = [] }) => {
  // --- State ---
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '9:16'>('1:1');
  const [formatType, setFormatType] = useState<'image' | 'video'>('image');
  const [imageQuality, setImageQuality] = useState<'1080p' | '4K'>('1080p');
  const [useTheme, setUseTheme] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [duration, setDuration] = useState<5 | 10 | 15 | 30 | 60>(5);
  const [animStyle, setAnimStyle] = useState<'particles' | 'rolling' | 'pulse'>('particles');
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | undefined>(milestone);
  
  // Preview Scaling State
  const [previewScale, setPreviewScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const avatarImgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // --- Helpers ---

  // Determine Base Dimensions (1080p reference)
  const getBaseDimensions = () => {
      const w = 1080;
      let h = 1080;
      if (aspectRatio === '4:5') h = 1350;
      if (aspectRatio === '9:16') h = 1920;
      return { w, h };
  };

  const getExportDimensions = () => {
      const base = getBaseDimensions();
      const multiplier = imageQuality === '4K' ? 2 : 1; // 1080p * 2 = 2160p (4K width standard for vertical)
      return { w: base.w * multiplier, h: base.h * multiplier, scale: multiplier };
  };

  const generateFilename = (ext: string) => {
      const safeName = userProfile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const active = selectedMilestone || { title: 'milestone', date: new Date() };
      const safeTitle = active.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      const diff = differenceInDays(active.date, new Date());
      let dayMsg = 'today';
      if (diff > 0) dayMsg = `${diff}days_left`;
      if (diff < 0) dayMsg = `${Math.abs(diff)}days_ago`;

      return `${safeName}_${safeTitle}_${dayMsg}.${ext}`;
  };

  // --- Effects ---

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Handle Resize for Preview
  useEffect(() => {
      const handleResize = () => {
          if (previewContainerRef.current) {
              const { clientWidth, clientHeight } = previewContainerRef.current;
              setContainerSize({ w: clientWidth, h: clientHeight });

              const padding = 40;
              const availW = clientWidth - padding;
              const availH = clientHeight - padding;
              
              const { w, h } = getBaseDimensions();

              const scaleX = availW / w;
              const scaleY = availH / h;
              
              setPreviewScale(Math.min(scaleX, scaleY, 0.95)); 
          }
      };

      if (isOpen) {
          handleResize();
          window.addEventListener('resize', handleResize);
          // Initial delay to let layout settle
          setTimeout(handleResize, 100);
      }
      return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, aspectRatio, formatType]); // Recalc on aspect ratio change

  useEffect(() => {
    if (isOpen) setSelectedMilestone(milestone);
  }, [isOpen, milestone]);

  useEffect(() => {
    if (userProfile.avatar) {
        const img = new Image();
        img.src = userProfile.avatar;
        img.crossOrigin = "anonymous";
        img.onload = () => { avatarImgRef.current = img; };
    } else {
        avatarImgRef.current = null;
    }
  }, [userProfile.avatar]);

  // Animation Loop
  useEffect(() => {
    if (isOpen && formatType === 'video' && canvasRef.current) {
        startTimeRef.current = performance.now();
        startCanvasAnimation();
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isOpen, formatType, aspectRatio, useTheme, userProfile.avatar, animStyle, selectedMilestone]); 


  // --- Canvas Logic ---
  const startCanvasAnimation = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { w, h } = getBaseDimensions();
      canvas.width = w;
      canvas.height = h;

      const appTheme = themes[userProfile.theme];
      let bgGradientStart = '#4f46e5';
      let bgGradientEnd = '#9333ea';
      let textColor = '#ffffff';

      if (useTheme) {
         bgGradientStart = appTheme.colors.base; 
         if (['amoled', 'cyberpunk', 'futuristic'].includes(userProfile.theme)) {
             bgGradientStart = appTheme.colors.base;
             bgGradientEnd = appTheme.colors.card;
         } else {
             bgGradientStart = appTheme.colors.base;
             bgGradientEnd = appTheme.colors.input;
         }
         textColor = appTheme.colors.text;
      }

      const particles = Array.from({ length: 60 }).map(() => ({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * 4 + 1,
          speedY: Math.random() * 2 + 0.5,
          color: `rgba(255, 255, 255, ${Math.random() * 0.5})`
      }));

      const activeMilestone = selectedMilestone || { title, description: text, date: new Date(), value: 0, unit: 'days' };
      const displayDate = selectedMilestone ? format(selectedMilestone.date, 'MMMM do, yyyy') : text;

      const render = (time: number) => {
          const elapsed = time - startTimeRef.current;

          // BG
          const grad = ctx.createLinearGradient(0, 0, w, h);
          grad.addColorStop(0, bgGradientStart);
          grad.addColorStop(1, bgGradientEnd);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          // Anim
          if (animStyle === 'particles') {
              particles.forEach(p => {
                  p.y -= p.speedY;
                  if (p.y < 0) p.y = h;
                  ctx.beginPath();
                  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                  ctx.fillStyle = useTheme ? `${textColor}20` : p.color;
                  ctx.fill();
              });
          } else if (animStyle === 'rolling') {
               ctx.strokeStyle = useTheme ? `${textColor}10` : 'rgba(255,255,255,0.1)';
               ctx.lineWidth = 2;
               const offset = (elapsed * 0.05) % 100;
               for(let i=0; i<w; i+=100) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
               for(let i=0; i<h; i+=100) { ctx.beginPath(); ctx.moveTo(0, i + offset); ctx.lineTo(w, i + offset); ctx.stroke(); }
          }

          let scale = 1;
          if (animStyle === 'pulse') scale = 1 + 0.02 * Math.sin(elapsed * 0.003);

          ctx.save();
          ctx.translate(w/2, h/2);
          ctx.scale(scale, scale);
          ctx.translate(-w/2, -h/2);
          
          ctx.textAlign = 'center';
          ctx.fillStyle = useTheme ? textColor : '#ffffff';
          
          const avatarSize = 180;
          const avatarY = h/2 - 220;
          
          if (avatarImgRef.current) {
              ctx.save();
              ctx.beginPath();
              ctx.arc(w/2, avatarY, avatarSize/2, 0, Math.PI * 2);
              ctx.closePath();
              ctx.clip();
              ctx.drawImage(avatarImgRef.current, w/2 - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
              ctx.restore();
              ctx.beginPath();
              ctx.arc(w/2, avatarY, avatarSize/2, 0, Math.PI * 2);
              ctx.strokeStyle = useTheme ? textColor : '#ffffff';
              ctx.lineWidth = 8;
              ctx.stroke();
          } else {
              ctx.beginPath();
              ctx.arc(w/2, avatarY, 60, 0, 2 * Math.PI);
              ctx.strokeStyle = useTheme ? textColor : '#ffffff';
              ctx.lineWidth = 6;
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(w/2 - 20, avatarY - 20);
              ctx.lineTo(w/2, avatarY + 20);
              ctx.lineTo(w/2 + 20, avatarY - 20);
              ctx.stroke();
          }

          ctx.font = 'bold 50px Inter, sans-serif';
          ctx.globalAlpha = 0.8;
          ctx.fillText("Life Milestone", w/2, h/2 - 60);
          ctx.globalAlpha = 1.0;

          ctx.font = 'bold 90px Inter, sans-serif';
          let displayTitle = activeMilestone.title;
          
          if (animStyle === 'rolling' && 'value' in activeMilestone) {
              const targetValue = activeMilestone.value;
              if (targetValue && typeof targetValue === 'number') {
                  const loopDuration = 3000;
                  const progress = Math.min((elapsed % loopDuration) / 2000, 1);
                  const ease = 1 - Math.pow(1 - progress, 3);
                  const currentVal = Math.floor(targetValue * ease);
                  if (activeMilestone.unit) displayTitle = `${currentVal.toLocaleString()} ${activeMilestone.unit}`;
                  else displayTitle = currentVal.toLocaleString();
              }
          }
          
          const maxWidth = w * 0.8;
          const words = displayTitle.split(' ');
          let line = '';
          const lines = [];
          for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) { lines.push(line); line = words[n] + ' '; } 
            else { line = testLine; }
          }
          lines.push(line);

          lines.forEach((lineText, i) => {
             const yOffset = (i - (lines.length-1)/2) * 100;
             ctx.fillText(lineText, w/2, h/2 + 50 + yOffset);
          });

          ctx.font = '36px Inter, sans-serif';
          ctx.globalAlpha = 0.9;
          const descY = h/2 + 50 + (lines.length * 50) + 40;
          ctx.fillText(displayDate, w/2, descY);
          ctx.globalAlpha = 1.0;
          ctx.restore();

          ctx.font = '24px Inter, sans-serif';
          ctx.fillStyle = useTheme ? textColor : 'rgba(255,255,255,0.7)';
          ctx.globalAlpha = 0.7;
          ctx.fillText(`Calculated for ${userProfile.name}`, w/2, h - 80);
          ctx.fillText("via Life Milestones App", w/2, h - 40);
          ctx.globalAlpha = 1.0;

          rafRef.current = requestAnimationFrame(render);
      };
      
      rafRef.current = requestAnimationFrame(render);
  };

  // --- Actions ---

  const generateImageBlob = async (): Promise<Blob | null> => {
      if (!cardRef.current) return null;
      const { scale } = getExportDimensions();
      
      const canvas = await html2canvas(cardRef.current, { 
          scale: scale, 
          useCORS: true, 
          backgroundColor: null,
          allowTaint: true,
          logging: false
      });
      return new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    
    if (formatType === 'image') {
        const blob = await generateImageBlob();
        if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = generateFilename('png');
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }
    } else {
        // Video Generation
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        startTimeRef.current = performance.now();
        const stream = canvas.captureStream(60);
        
        // Try MP4 first, then WebM
        const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1') ? 'video/mp4;codecs=avc1' 
                       : MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' 
                       : 'video/webm;codecs=vp9';
        
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';

        const recorder = new MediaRecorder(stream, { 
            mimeType: mimeType, 
            videoBitsPerSecond: 12000000 // 12 Mbps for high quality
        });
        
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = generateFilename(ext);
            link.click();
            URL.revokeObjectURL(url);
            setIsGenerating(false);
        };

        recorder.start();
        setTimeout(() => recorder.stop(), duration * 1000); 
        return; 
    }
    setIsGenerating(false);
  };

  const handleNativeShare = async () => {
      setIsGenerating(true);
      if (formatType === 'image') {
          const blob = await generateImageBlob();
          if (blob) {
              const file = new File([blob], generateFilename('png'), { type: 'image/png' });
              if (navigator.share && navigator.canShare({ files: [file] })) {
                  try {
                      await navigator.share({
                          files: [file],
                          title: 'Life Milestone',
                          text: `Check out this milestone: ${selectedMilestone?.title}`
                      });
                  } catch (e) { console.error(e); }
              } else {
                  alert("Native sharing not supported on this device. Try downloading.");
              }
          }
      } else {
          alert("Direct video sharing is not supported in browser. Please download the video first.");
      }
      setIsGenerating(false);
  };

  const handleCopyToClipboard = async () => {
      setIsGenerating(true);
      if (formatType === 'image') {
          try {
              const blob = await generateImageBlob();
              if (blob) {
                  await navigator.clipboard.write([
                      new ClipboardItem({ 'image/png': blob })
                  ]);
                  alert("Image copied to clipboard!");
              }
          } catch (err) {
              alert("Could not copy to clipboard. Try downloading.");
          }
      }
      setIsGenerating(false);
  };

  // --- Filtering Milestones for Dropdown ---
  const upcomingMilestones = useMemo(() => {
      return allMilestones
        .filter(m => !m.isPast)
        .sort((a,b) => a.date.getTime() - b.date.getTime())
        .slice(0, 50);
  }, [allMilestones]);

  const activeMilestone = selectedMilestone || { title, description: text, date: new Date(), value: 0, unit: '', isPast: false, id: 'temp', category: 'Custom' as any, color: '#fff' };
  const { w: baseW, h: baseH } = getBaseDimensions();

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200 overflow-hidden"
        onClick={onClose}
    >
      <div 
        className="bg-skin-card w-full max-w-7xl rounded-none sm:rounded-3xl flex flex-col md:flex-row shadow-2xl h-full md:h-[90vh] border border-skin-border overflow-hidden"
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* Left: Controls */}
        <div className="p-6 w-full md:w-96 flex-shrink-0 border-r border-b md:border-b-0 border-skin-border flex flex-col gap-5 bg-skin-base/50 overflow-y-auto scrollbar-hide overscroll-contain h-[45%] md:h-full z-20">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-skin-text flex items-center gap-2">
                    <Film className="w-5 h-5 text-skin-primary" />
                    Share Studio
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-skin-border rounded-full transition-colors text-skin-muted hover:text-skin-text"><X size={20} /></button>
            </div>

            <div className="space-y-6">
                {/* 1. Content Selector */}
                <div>
                     <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider flex items-center gap-2">
                        <Calendar size={12}/> Event Selection
                    </label>
                    <select 
                        className="w-full p-3 text-sm rounded-xl border border-skin-border bg-skin-card text-skin-text focus:ring-2 focus:ring-skin-primary focus:outline-none"
                        onChange={(e) => {
                            const found = allMilestones.find(m => m.id === e.target.value);
                            if (found) setSelectedMilestone(found);
                        }}
                        value={selectedMilestone?.id || ""}
                    >
                        {!selectedMilestone && <option value="">Current Selection</option>}
                        {selectedMilestone && <option value={selectedMilestone.id}>Current: {selectedMilestone.title}</option>}
                        <optgroup label="Upcoming Milestones">
                            {upcomingMilestones.map(m => (
                                <option key={m.id} value={m.id}>{m.title} ({format(m.date, 'MMM d')})</option>
                            ))}
                        </optgroup>
                    </select>
                </div>

                {/* 2. Format Selector */}
                <div>
                    <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider">Output Format</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setFormatType('image')}
                            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-sm font-medium transition-all ${formatType === 'image' ? 'border-skin-primary bg-skin-primary/10 text-skin-primary ring-1 ring-skin-primary' : 'border-skin-border hover:border-skin-muted bg-skin-card'}`}
                        >
                            <ImageIcon size={24} /> 
                            <span>Image</span>
                        </button>
                         <button 
                            onClick={() => setFormatType('video')}
                            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-sm font-medium transition-all ${formatType === 'video' ? 'border-skin-primary bg-skin-primary/10 text-skin-primary ring-1 ring-skin-primary' : 'border-skin-border hover:border-skin-muted bg-skin-card'}`}
                        >
                            <Video size={24} /> 
                            <span>Video Loop</span>
                        </button>
                    </div>
                </div>
                
                {/* 2b. Resolution Selector (Image Only) */}
                {formatType === 'image' && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                         <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider flex items-center gap-2">
                            <Monitor size={12}/> Resolution
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => setImageQuality('1080p')}
                                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${imageQuality === '1080p' ? 'bg-skin-primary text-white border-skin-primary' : 'bg-skin-card border-skin-border hover:bg-skin-input'}`}
                            >
                                <Monitor size={14} /> 1080p (HD)
                            </button>
                            <button 
                                onClick={() => setImageQuality('4K')}
                                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${imageQuality === '4K' ? 'bg-skin-primary text-white border-skin-primary' : 'bg-skin-card border-skin-border hover:bg-skin-input'}`}
                            >
                                <Gauge size={14} /> 4K Ultra
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. Video Options (Conditional) */}
                {formatType === 'video' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div>
                            <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider flex items-center gap-2">
                                <Timer size={12}/> Duration (Seconds)
                            </label>
                            <div className="flex gap-2">
                                {[5, 10, 15, 30].map(s => (
                                    <button 
                                        key={s}
                                        onClick={() => setDuration(s as any)}
                                        className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${duration === s ? 'bg-skin-primary text-white border-skin-primary' : 'bg-skin-card border-skin-border hover:bg-skin-input'}`}
                                    >
                                        {s}s
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                             <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider flex items-center gap-2">
                                <Move size={12}/> Animation Style
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => setAnimStyle('particles')}
                                    className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-1 ${animStyle === 'particles' ? 'bg-skin-primary/10 border-skin-primary text-skin-primary' : 'bg-skin-card border-skin-border'}`}
                                >
                                    <Sparkles size={16}/>
                                    <span className="text-[10px] font-bold">Particles</span>
                                </button>
                                <button 
                                    onClick={() => setAnimStyle('rolling')}
                                    className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-1 ${animStyle === 'rolling' ? 'bg-skin-primary/10 border-skin-primary text-skin-primary' : 'bg-skin-card border-skin-border'}`}
                                >
                                    <Activity size={16}/>
                                    <span className="text-[10px] font-bold">Rolling</span>
                                </button>
                                <button 
                                    onClick={() => setAnimStyle('pulse')}
                                    className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-1 ${animStyle === 'pulse' ? 'bg-skin-primary/10 border-skin-primary text-skin-primary' : 'bg-skin-card border-skin-border'}`}
                                >
                                    <Move size={16}/>
                                    <span className="text-[10px] font-bold">Pulse</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Aspect Ratio */}
                <div>
                    <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider">Canvas Size</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: '1:1', icon: Square, label: 'Square', desc: 'Post' }, 
                            { id: '4:5', icon: Instagram, label: 'Portrait', desc: 'Feed' }, 
                            { id: '9:16', icon: Smartphone, label: 'Full', desc: 'Reel' }
                        ].map(r => (
                            <button 
                                key={r.id}
                                onClick={() => setAspectRatio(r.id as any)}
                                className={`py-3 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all ${aspectRatio === r.id ? 'border-skin-primary bg-skin-primary text-white shadow-md' : 'border-skin-border text-skin-muted hover:bg-skin-input bg-skin-card'}`}
                            >
                                <r.icon size={18} />
                                <span className="text-[10px] font-bold">{r.id}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 5. Theme Toggle */}
                <div>
                    <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider">Appearance</label>
                    <button 
                        onClick={() => setUseTheme(!useTheme)}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all group ${useTheme ? 'border-skin-primary bg-skin-card text-skin-text shadow-sm' : 'border-purple-500/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600'}`}
                    >
                        <div className="flex items-center gap-3 font-semibold">
                            <div className={`p-2 rounded-lg ${useTheme ? 'bg-skin-input' : 'bg-indigo-100'}`}>
                                <Palette size={18} />
                            </div>
                            <div className="text-left">
                                <div className="text-sm">{useTheme ? themes[userProfile.theme].name : 'Brand Gradient'}</div>
                                <div className="text-[10px] opacity-70 font-normal">
                                    {useTheme ? 'Matches app theme' : 'Default export style'}
                                </div>
                            </div>
                        </div>
                        {useTheme && <Check size={16} className="text-skin-primary" />}
                    </button>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-auto pt-6 border-t border-skin-border space-y-3 pb-20 md:pb-0">
                <button 
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="w-full py-4 bg-skin-primary hover:bg-skin-primary/90 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-skin-primary/20 hover:shadow-xl active:scale-[0.98]"
                >
                    {isGenerating ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> : <Download size={20} />}
                    <span>Save to Device</span>
                </button>
                
                {formatType === 'image' && (
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={handleNativeShare}
                            disabled={isGenerating}
                            className="py-3 bg-skin-input hover:bg-skin-border text-skin-text rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            <Share2 size={16} /> Share
                        </button>
                        <button 
                            onClick={handleCopyToClipboard}
                            disabled={isGenerating}
                            className="py-3 bg-skin-input hover:bg-skin-border text-skin-text rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            <Copy size={16} /> Copy
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Right: Preview (Fixed Layout) */}
        <div className="flex-1 bg-skin-input relative flex flex-col h-[55%] md:h-full overflow-hidden">
            <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-gradient-to-b from-skin-input/80 to-transparent pointer-events-none">
                 <span className="bg-skin-card/90 backdrop-blur-md border border-skin-border px-4 py-1.5 rounded-full text-[10px] font-bold text-skin-muted uppercase tracking-wider shadow-sm flex items-center gap-2">
                    <Check size={12} className="text-green-500"/> Live Preview
                 </span>
                 {previewScale < 0.5 && (
                    <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md">
                        Zoom: {(previewScale * 100).toFixed(0)}%
                    </span>
                 )}
            </div>
            
            <div 
                ref={previewContainerRef}
                className="flex-1 w-full h-full flex items-center justify-center relative bg-skin-input overflow-hidden"
            >
                {/* The Content Wrapper (Scaled) */}
                <div 
                    style={{
                        width: baseW,
                        height: baseH,
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'center center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    }}
                    className="transition-transform duration-200 ease-out will-change-transform"
                >
                    {formatType === 'image' ? (
                        <div 
                            ref={cardRef}
                            className="w-full h-full relative flex flex-col items-center justify-center p-12 text-center overflow-hidden"
                            style={{
                                background: useTheme ? themes[userProfile.theme].colors.base : 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
                                color: useTheme ? themes[userProfile.theme].colors.text : '#ffffff',
                            }}
                        >
                            {/* Background Pattern */}
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                            
                            <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-4xl mx-auto">
                                {userProfile.avatar ? (
                                    <div className="w-40 h-40 rounded-full border-4 border-white/20 shadow-xl overflow-hidden bg-white/10">
                                         <img src={userProfile.avatar} alt="Me" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <Logo className={`w-32 h-32 opacity-90 ${useTheme ? '' : 'text-white'}`} />
                                )}
                                
                                <div className={`uppercase tracking-[0.2em] text-2xl font-bold opacity-60 border-y-2 py-4 px-12 ${useTheme ? 'border-current' : 'border-white/20'}`}>
                                    Milestone Reached
                                </div>
                                
                                <h2 className="text-8xl font-black leading-tight tracking-tight break-words w-full drop-shadow-sm">
                                    {activeMilestone.title}
                                </h2>
                                
                                <p className="text-4xl opacity-90 font-medium leading-relaxed max-w-3xl">
                                    {activeMilestone.description}
                                </p>

                                <div className={`mt-12 px-10 py-6 rounded-2xl border backdrop-blur-md shadow-lg ${useTheme ? 'bg-black/5 border-current' : 'bg-white/10 border-white/20'}`}>
                                    <span className="font-mono text-5xl font-bold">
                                        {activeMilestone.date ? format(activeMilestone.date, 'MMMM do, yyyy') : 'Today'}
                                    </span>
                                </div>
                            </div>

                            <div className="absolute bottom-16 text-xl uppercase tracking-widest opacity-50 font-bold flex flex-col gap-1">
                               <span>Calculated for {userProfile.name}</span>
                               <span className="text-sm opacity-70">via Life Milestones App</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full bg-black">
                            <canvas ref={canvasRef} className="w-full h-full" />
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;