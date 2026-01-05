import React, { useRef, useState, useEffect, useMemo } from 'react';
import { X, Download, Video, Image as ImageIcon, Check, Palette, Film, Instagram, Smartphone, Square, Activity, Move, Sparkles, Timer, Calendar, ZoomIn, ZoomOut, Monitor, Gauge, Share2, Copy, Maximize, LayoutTemplate, Globe, Sun, Watch, FileType, FileText, Code, Orbit, Star } from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { Milestone, UserProfile, ThemeId } from '../types';
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
  cardType?: 'milestone' | 'age' | 'progress' | 'zodiac' | 'clock';
  extraData?: any; // For passing specific stats like zodiac sign, age stats object, etc.
}

type TemplateType = 'classic' | 'modern' | 'bold' | 'minimal' | 'elegant' | 'poster' | 'bubble' | 'technical' | 'split';
type ExportFormat = 'png' | 'pdf' | 'svg';

const ShareModal: React.FC<Props> = ({ 
    isOpen, onClose, title, text, milestone, userProfile, 
    allMilestones = [], cardType = 'milestone', extraData = {} 
}) => {
  // --- State ---
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '9:16'>('1:1');
  const [formatType, setFormatType] = useState<'image' | 'video'>('image');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [imageQuality, setImageQuality] = useState<'1080p' | '4K' | 'Max'>('1080p');
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>(userProfile.theme);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('classic');
  const [showStats, setShowStats] = useState(true);
  const [showCosmic, setShowCosmic] = useState(false); // New: Cosmic Elements Toggle
  const [isGenerating, setIsGenerating] = useState(false);
  const [duration, setDuration] = useState<5 | 10 | 15 | 30 | 60>(5);
  const [animStyle, setAnimStyle] = useState<'particles' | 'rolling' | 'pulse'>('particles');
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | undefined>(milestone);
  
  // Preview Scaling State
  const [previewScale, setPreviewScale] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);      // For Preview
  const exportRef = useRef<HTMLDivElement>(null);    // For High-Res Capture (Off-screen)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const avatarImgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // --- Helpers ---

  const getBaseDimensions = () => {
      const w = 1080;
      let h = 1080;
      if (aspectRatio === '4:5') h = 1350;
      if (aspectRatio === '9:16') h = 1920;
      return { w, h };
  };

  const getExportDimensions = () => {
      let pixelRatio = 1;
      if (imageQuality === '4K') pixelRatio = 2;
      if (imageQuality === 'Max') pixelRatio = 4;
      return { pixelRatio };
  };

  const generateFilename = (ext: string) => {
      const safeName = userProfile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      let suffix: string = cardType;
      
      if (cardType === 'milestone') {
          const active = selectedMilestone || { title: 'milestone' };
          suffix = active.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      }

      return `${safeName}_${suffix}_${format(new Date(), 'yyyyMMdd')}.${ext}`;
  };

  const calculateCosmicStats = (targetDate: Date) => {
      const dob = new Date(userProfile.dob);
      const [h, m] = userProfile.tob.split(':').map(Number);
      dob.setHours(h || 0, m || 0);

      const diffMs = Math.abs(targetDate.getTime() - dob.getTime());
      const totalDays = diffMs / (1000 * 60 * 60 * 24);
      
      return {
          earthRotations: Math.floor(totalDays), // 1 rotation per day
          sunOrbits: (totalDays / 365.2422).toFixed(2), // Solar years
          hourHand: Math.floor((totalDays * 24) / 12), // 1 rotation every 12 hours
          minuteHand: Math.floor(totalDays * 24), // 1 rotation every hour
          secondHand: Math.floor(totalDays * 24 * 60) // 1 rotation every minute
      };
  };

  // --- Effects ---

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
      const handleResize = () => {
          if (previewContainerRef.current) {
              const { clientWidth, clientHeight } = previewContainerRef.current;
              setContainerSize({ w: clientWidth, h: clientHeight });
              const padding = 20;
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
          setTimeout(handleResize, 100);
      }
      return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, aspectRatio, formatType]); 

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

  // --- Actions ---

  const getHtmlToImageConfig = async (w: number, h: number, pixelRatio: number) => {
      const fontUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
      let fontEmbedCSS = '';
      try {
          const res = await fetch(fontUrl);
          fontEmbedCSS = await res.text();
      } catch (e) {
          console.warn("Failed to fetch Google Fonts for embed", e);
      }

      const filter = (node: any) => {
          if (node.tagName === 'LINK' && node.href && node.href.includes('fonts.googleapis.com')) {
              return false;
          }
          return true;
      };

      return {
          width: w,
          height: h,
          pixelRatio,
          style: { transform: 'none' },
          fontEmbedCSS,
          filter,
          cacheBust: true,
      };
  };

  const generateImageBlob = async (qualityOverride?: '1080p' | '4K' | 'Max'): Promise<Blob | null> => {
      const targetRef = exportRef.current;
      if (!targetRef) return null;

      const { w, h } = getBaseDimensions();
      let pixelRatio = 1;
      const q = qualityOverride || imageQuality;
      if (q === '4K') pixelRatio = 2;
      if (q === 'Max') pixelRatio = 4;

      const images = targetRef.querySelectorAll('img');
      await Promise.all(Array.from(images).map((node) => {
          const img = node as HTMLImageElement;
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => { 
            img.onload = () => resolve(null); 
            img.onerror = () => resolve(null); 
          });
      }));

      const config = await getHtmlToImageConfig(w, h, pixelRatio);
      return htmlToImage.toBlob(targetRef, config);
  };

  const handleQuickSnapshot = async () => {
      setIsGenerating(true);
      try {
          const blob = await generateImageBlob('1080p');
          if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = generateFilename('png');
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
          }
      } catch (err) {
          console.error("Quick snapshot failed", err);
          alert("Quick snapshot failed.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    const targetRef = exportRef.current;
    if (!targetRef) return;
    
    try {
        const { w, h } = getBaseDimensions();
        const { pixelRatio } = getExportDimensions();
        const config = await getHtmlToImageConfig(w, h, pixelRatio);

        if (exportFormat === 'pdf') {
            const pngDataUrl = await htmlToImage.toPng(targetRef, config);
            const pdf = new jsPDF({
                orientation: h > w ? 'p' : 'l',
                unit: 'px',
                format: [w, h] 
            });
            pdf.addImage(pngDataUrl, 'PNG', 0, 0, w, h);
            pdf.save(generateFilename('pdf'));
        } 
        else if (exportFormat === 'svg') {
            const svgDataUrl = await htmlToImage.toSvg(targetRef, config);
            const link = document.createElement('a');
            link.download = generateFilename('svg');
            link.href = svgDataUrl;
            link.click();
        } 
        else {
            const pngDataUrl = await htmlToImage.toPng(targetRef, config);
            const link = document.createElement('a');
            link.download = generateFilename('png');
            link.href = pngDataUrl;
            link.click();
        }
    } catch (err) {
        console.error("Export failed", err);
        alert("Export failed. Please try a different format.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleNativeShare = async () => {
      setIsGenerating(true);
      try {
        const blob = await generateImageBlob();
        if (blob) {
            const file = new File([blob], generateFilename('png'), { type: 'image/png' });
            const shareData = {
                files: [file],
                title: 'Life Milestone',
                text: text
            };

            if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
                await navigator.share(shareData);
            } else {
                alert("Native sharing not supported on this device. Try downloading.");
            }
        }
      } catch (error: any) {
          if (
            error.name === 'AbortError' || 
            error.name === 'NotAllowedError'
          ) { return; }
          console.warn('Share error:', error);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleCopyToClipboard = async () => {
      setIsGenerating(true);
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
  
  // Theme Helper
  const currentTheme = themes[activeThemeId];
  const rgb = (str: string, alpha = 1) => `rgba(${str.split(' ').join(',')}, ${alpha})`;

  // Stats Data
  const stats = calculateCosmicStats(activeMilestone.date);

  // --- RENDERERS ---

  const renderCosmicOverlay = () => {
      if (!showCosmic) return null;
      return (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
              {/* Solar System Orbits */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-white/10 rounded-full opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] border border-white/10 rounded-full opacity-60"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-white/20 rounded-full opacity-70"></div>
              
              {/* Planets */}
              <div className="absolute top-[20%] left-[15%] w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-500/50"></div>
              <div className="absolute bottom-[20%] right-[15%] w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-600 shadow-lg shadow-orange-500/50 ring-4 ring-orange-500/20"></div>
              <div className="absolute top-[10%] right-[30%] w-4 h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>

              {/* Stars */}
              {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-1 h-1 bg-white rounded-full opacity-70 animate-pulse"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`
                    }}
                  />
              ))}
          </div>
      );
  };

  const renderCardHTML = () => {
      const commonContainerStyles = {
          width: '100%',
          height: '100%',
          position: 'relative' as const,
          overflow: 'hidden',
          backgroundColor: rgb(currentTheme.colors.base),
          color: rgb(currentTheme.colors.text),
      };

      const bgPattern = (
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none"></div>
      );
      
      const gradientOverlay = (
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none" 
            style={{ background: `linear-gradient(135deg, ${rgb(currentTheme.colors.primary)} 0%, transparent 100%)` }} 
          />
      );

      // --- SPECIAL CARD TYPES (Age, Progress, Zodiac) ---
      
      if (cardType === 'age') {
          const ageStats = (extraData as any) || {};
          return (
              <div style={commonContainerStyles} className="flex flex-col items-center justify-center p-12 relative">
                  {bgPattern}
                  {renderCosmicOverlay()}
                  <div className="relative z-10 w-full max-w-4xl bg-skin-card/30 backdrop-blur-xl border border-white/20 rounded-[3rem] p-10 shadow-2xl flex flex-col gap-8 text-center">
                      <div className="flex flex-col items-center">
                          <h2 className="text-4xl font-bold uppercase tracking-widest opacity-70 mb-2">Total Existence</h2>
                          <h1 className="text-9xl font-black text-skin-text leading-none tracking-tighter">
                              {(ageStats.years || 0)}<span className="text-4xl align-top opacity-50">+</span>
                          </h1>
                          <div className="text-2xl font-bold text-skin-primary uppercase tracking-wide">Years on Earth</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 w-full">
                          {[
                              { label: 'Decades', val: ((ageStats.years || 0) / 10).toFixed(1) },
                              { label: 'Days', val: (ageStats.days || 0).toLocaleString() },
                              { label: 'Hours', val: (ageStats.hours || 0).toLocaleString() },
                              { label: 'Seconds', val: (ageStats.seconds || 0).toLocaleString() }
                          ].map((item) => (
                              <div key={item.label} className="bg-skin-base/40 p-6 rounded-2xl border border-white/10">
                                  <div className="text-4xl font-bold font-mono">{item.val}</div>
                                  <div className="text-xs uppercase tracking-widest opacity-60 font-bold">{item.label}</div>
                              </div>
                          ))}
                      </div>
                      
                      {/* Astronomical Units (Always included for 'Age' export) */}
                      <div className="border-t border-white/20 pt-6 grid grid-cols-2 gap-4 text-left">
                          <div>
                              <div className="text-xs uppercase opacity-50 font-bold">Earth Rotations</div>
                              <div className="text-xl font-bold">{(ageStats.days || 0).toLocaleString()}</div>
                          </div>
                          <div>
                              <div className="text-xs uppercase opacity-50 font-bold">Sun Orbits</div>
                              <div className="text-xl font-bold">{((ageStats.days || 0) / 365.25).toFixed(2)}</div>
                          </div>
                      </div>
                  </div>
                  <div className="absolute bottom-8 font-bold opacity-50 text-xl tracking-widest uppercase">{userProfile.name}</div>
              </div>
          );
      }

      if (cardType === 'progress') {
          const { percent, daysLeft, year } = (extraData as any) || { percent: 50, daysLeft: 180, year: new Date().getFullYear() };
          return (
              <div style={commonContainerStyles} className="flex flex-col items-center justify-center p-16 relative">
                  {bgPattern}
                  {renderCosmicOverlay()}
                  <div className="relative z-10 w-full text-center">
                      <h2 className="text-[12rem] font-black leading-none opacity-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">{year}</h2>
                      <div className="relative z-10 bg-skin-card/40 backdrop-blur-xl p-12 rounded-[3rem] border border-white/20 shadow-2xl">
                          <h3 className="text-4xl font-bold mb-8 uppercase tracking-wider">{year} Progress</h3>
                          
                          <div className="text-9xl font-black text-skin-primary mb-4">{percent.toFixed(1)}%</div>
                          
                          <div className="w-full h-8 bg-skin-base/50 rounded-full overflow-hidden border border-white/10 mb-8">
                             <div className="h-full bg-skin-primary" style={{ width: `${percent}%` }}></div>
                          </div>

                          <div className="text-3xl font-bold opacity-80">{daysLeft} Days Left</div>
                      </div>
                  </div>
              </div>
          )
      }

      if (cardType === 'zodiac') {
          const { sign, type } = (extraData as any) || { sign: 'Unknown', type: 'Zodiac' };
          return (
              <div style={commonContainerStyles} className="flex flex-col items-center justify-center p-12 relative">
                  {bgPattern}
                  {renderCosmicOverlay()}
                  <div className="relative z-10 w-full max-w-lg aspect-square bg-skin-card/20 backdrop-blur-2xl border border-white/20 rounded-full flex flex-col items-center justify-center shadow-2xl p-10">
                      <div className="absolute inset-0 rounded-full border-4 border-dashed border-white/10 animate-spin-slow" style={{ animationDuration: '60s' }}></div>
                      
                      <div className="text-2xl font-bold uppercase tracking-[0.5em] opacity-60 mb-4">{type}</div>
                      <h1 className="text-8xl font-black text-skin-text mb-4 text-center leading-tight">{sign}</h1>
                      <div className="w-24 h-1 bg-skin-primary mb-6"></div>
                      <div className="text-xl font-medium opacity-80">Attribute of {userProfile.name}</div>
                  </div>
              </div>
          )
      }

      // --- STANDARD MILESTONE TEMPLATES ---

      const avatarEl = userProfile.avatar ? (
        <img src={userProfile.avatar} alt="Me" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-white/10"><Logo className="w-1/2 h-1/2 opacity-90" /></div>
      );

      // Render the Cosmic Stats Block (Reusable)
      const renderCosmicStatsBlock = (style: 'grid' | 'row' | 'minimal') => {
          if (!showStats) return null;
          return (
              <div className="mt-8 grid grid-cols-2 gap-4 w-full px-8 text-shift opacity-80">
                  <div className="flex flex-col">
                      <span className="text-xs uppercase font-bold opacity-50">Earth Rotations</span>
                      <span className="text-xl font-bold font-mono">{stats.earthRotations.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col text-right">
                      <span className="text-xs uppercase font-bold opacity-50">Sun Orbits</span>
                      <span className="text-xl font-bold font-mono">{stats.sunOrbits}</span>
                  </div>
              </div>
          )
      };

      // 1. CLASSIC TEMPLATE
      if (selectedTemplate === 'classic') {
          return (
            <div style={commonContainerStyles} className="flex flex-col items-center justify-center text-center p-12">
                {bgPattern}
                {gradientOverlay}
                {renderCosmicOverlay()} 
                
                <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-4xl mx-auto h-full justify-center content-layer">
                    <div className="w-40 h-40 rounded-full border-8 shadow-2xl overflow-hidden shrink-0" style={{ borderColor: rgb(currentTheme.colors.card) }}>
                        {avatarEl}
                    </div>
                    <div className="uppercase tracking-[0.3em] text-2xl font-bold opacity-60 border-y-2 py-4 px-12" style={{ borderColor: rgb(currentTheme.colors.border) }}>
                        Milestone Reached
                    </div>
                    <h2 className="text-8xl font-black leading-none tracking-tight break-words w-full drop-shadow-sm line-clamp-3">
                        {activeMilestone.title}
                    </h2>
                    <div className="px-10 py-5 rounded-2xl border backdrop-blur-md shadow-lg mb-2 bg-skin-card/40 border-skin-border">
                        <span className="font-mono text-5xl font-bold" style={{ color: rgb(currentTheme.colors.primary) }}>
                            {activeMilestone.date ? format(activeMilestone.date, 'MMMM do, yyyy') : 'Today'}
                        </span>
                    </div>
                    {renderCosmicStatsBlock('grid')}
                </div>
            </div>
          );
      }

      // Default fallback (uses Classic logic if template missing)
      return (
          <div style={commonContainerStyles} className="flex items-center justify-center">
              <h1>{activeMilestone.title}</h1>
          </div>
      );
  };

  if (!isOpen) return null;

  const { w: baseW, h: baseH } = getBaseDimensions();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-0 sm:p-4 animate-in fade-in duration-300 overflow-hidden" onClick={onClose}>
      <div className="bg-skin-card/80 backdrop-blur-2xl w-full max-w-7xl rounded-none sm:rounded-3xl flex flex-col-reverse md:flex-row shadow-2xl h-full md:max-h-[90vh] md:h-auto border border-white/20 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Left Controls */}
        <div className="w-full md:w-96 flex-shrink-0 border-t md:border-t-0 md:border-r border-skin-border/50 flex flex-col bg-skin-base/95 md:bg-skin-base/80 h-[45vh] md:h-auto z-30 backdrop-blur-3xl md:backdrop-blur-xl">
            <div className="flex-none p-6 pb-2 flex justify-between items-center bg-skin-base/40">
                <h3 className="font-bold text-lg text-skin-text flex items-center gap-2">
                    <Film className="w-5 h-5 text-skin-primary" /> Export Studio
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-skin-border/50 rounded-full transition-colors text-skin-muted hover:text-skin-text"><X size={20} /></button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2 space-y-6 custom-scrollbar">
                {cardType === 'milestone' && (
                    <div>
                        <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider flex items-center gap-2">
                            <Calendar size={12}/> Event Selection
                        </label>
                        <select 
                            className="w-full p-3 text-sm rounded-xl border border-skin-border/50 bg-skin-card/50 text-skin-text focus:ring-2 focus:ring-skin-primary focus:outline-none backdrop-blur-sm"
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
                )}

                {/* Format & File Type */}
                <div>
                    <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider">Output Type</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <button onClick={() => setFormatType('image')} className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-sm font-medium transition-all ${formatType === 'image' ? 'border-skin-primary bg-skin-primary/10 text-skin-primary ring-1 ring-skin-primary' : 'border-skin-border/50 hover:border-skin-muted/50 bg-skin-card/50'}`}>
                            <ImageIcon size={24} /> <span>Image</span>
                        </button>
                    </div>
                    {formatType === 'image' && (
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setExportFormat('png')} className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${exportFormat === 'png' ? 'bg-skin-primary text-white border-skin-primary' : 'bg-skin-card/50 border-skin-border/50 hover:bg-skin-input/80'}`}>PNG</button>
                            <button onClick={() => setExportFormat('pdf')} className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${exportFormat === 'pdf' ? 'bg-skin-primary text-white border-skin-primary' : 'bg-skin-card/50 border-skin-border/50 hover:bg-skin-input/80'}`}>PDF</button>
                            <button onClick={() => setExportFormat('svg')} className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${exportFormat === 'svg' ? 'bg-skin-primary text-white border-skin-primary' : 'bg-skin-card/50 border-skin-border/50 hover:bg-skin-input/80'}`}>SVG</button>
                        </div>
                    )}
                </div>

                {/* Cosmic Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-skin-border/50 bg-skin-card/50 backdrop-blur-sm">
                    <label className="text-xs font-bold text-skin-muted uppercase tracking-wider flex items-center gap-2 cursor-pointer" htmlFor="cosmic-toggle">
                        <Orbit size={14}/> Cosmic Elements
                    </label>
                    <div 
                        className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${showCosmic ? 'bg-indigo-500' : 'bg-skin-input'}`}
                        onClick={() => setShowCosmic(!showCosmic)}
                        id="cosmic-toggle"
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${showCosmic ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                </div>

                {/* Stats Toggle */}
                {cardType === 'milestone' && (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-skin-border/50 bg-skin-card/50 backdrop-blur-sm">
                        <label className="text-xs font-bold text-skin-muted uppercase tracking-wider flex items-center gap-2 cursor-pointer" htmlFor="stats-toggle">
                            <Globe size={14}/> Show Stats
                        </label>
                        <div 
                            className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${showStats ? 'bg-skin-primary' : 'bg-skin-input'}`}
                            onClick={() => setShowStats(!showStats)}
                            id="stats-toggle"
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${showStats ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </div>
                )}

                {/* Aspect Ratio */}
                <div>
                    <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider">Canvas Size</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[{ id: '1:1', icon: Square }, { id: '4:5', icon: Instagram }, { id: '9:16', icon: Smartphone }].map(r => (
                            <button key={r.id} onClick={() => setAspectRatio(r.id as any)} className={`py-3 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all ${aspectRatio === r.id ? 'border-skin-primary bg-skin-primary text-white shadow-md' : 'border-skin-border/50 text-skin-muted hover:bg-skin-input/80 bg-skin-card/50'}`}>
                                <r.icon size={18} /> <span className="text-[10px] font-bold">{r.id}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="flex-none p-6 pt-4 border-t border-skin-border/30 bg-skin-card/90 backdrop-blur-md space-y-3 pb-8 md:pb-6 z-40">
                <button onClick={handleDownload} disabled={isGenerating} className="w-full py-3 px-6 bg-skin-primary hover:bg-skin-primary/90 text-white rounded-full font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg">
                    {isGenerating ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Download size={18} />}
                    <span>Save {exportFormat.toUpperCase()}</span>
                </button>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleNativeShare} disabled={isGenerating} className="py-3 bg-skin-input/50 hover:bg-skin-border/50 text-skin-text rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-skin-border/20 backdrop-blur-sm text-xs"><Share2 size={16} /> Share</button>
                    <button onClick={handleCopyToClipboard} disabled={isGenerating} className="py-3 bg-skin-input/50 hover:bg-skin-border/50 text-skin-text rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-skin-border/20 backdrop-blur-sm text-xs"><Copy size={16} /> Copy</button>
                </div>
            </div>
        </div>

        {/* Right Preview */}
        <div className="flex-1 bg-skin-input/50 relative flex flex-col h-[55vh] md:h-full overflow-hidden z-0">
            <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-gradient-to-b from-skin-input/80 to-transparent pointer-events-none">
                 <span className="bg-skin-card/80 backdrop-blur-md border border-skin-border/50 px-4 py-1.5 rounded-full text-[10px] font-bold text-skin-muted uppercase tracking-wider shadow-sm flex items-center gap-2">
                    <Check size={12} className="text-green-500"/> Live Preview
                 </span>
                 <div className="pointer-events-auto flex items-center gap-2">
                     <button onClick={handleQuickSnapshot} disabled={isGenerating} className="bg-skin-primary hover:bg-skin-primary/90 text-white py-1.5 px-3 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/20 active:scale-95 relative overflow-hidden flex items-center gap-2">
                        <Download size={14} /> <span className="text-[10px] font-bold uppercase tracking-wider">Quick Save</span>
                     </button>
                     <button onClick={() => setIsZoomed(!isZoomed)} className="bg-black/40 hover:bg-black/60 text-white text-[10px] px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2 transition-colors border border-white/10">
                        {isZoomed ? <ZoomOut size={12} /> : <ZoomIn size={12} />} <span>{isZoomed ? '100%' : `Fit ${(previewScale * 100).toFixed(0)}%`}</span>
                     </button>
                 </div>
            </div>
            
            <div ref={previewContainerRef} className={`flex-1 w-full h-full flex ${isZoomed ? 'items-start justify-start overflow-auto p-8' : 'items-center justify-center overflow-hidden'} relative`}>
                <div style={{ width: baseW, height: baseH, transform: isZoomed ? 'none' : `scale(${previewScale})`, transformOrigin: 'center center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', flexShrink: 0 }} className="transition-transform duration-200 ease-out will-change-transform shadow-2xl">
                    <div ref={cardRef}>{renderCardHTML()}</div>
                </div>
            </div>

            <div style={{ position: 'fixed', left: '-9999px', top: 0, width: baseW, height: baseH, pointerEvents: 'none' }}>
                <div ref={exportRef} id="export-container" style={{ width: baseW, height: baseH }}>{renderCardHTML()}</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;