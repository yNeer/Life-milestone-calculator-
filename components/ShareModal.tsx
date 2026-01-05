import React, { useRef, useState, useEffect, useMemo } from 'react';
import { X, Download, Video, Image as ImageIcon, Check, Palette, Film, Instagram, Smartphone, Square, Activity, Move, Sparkles, Timer, Calendar, ZoomIn, ZoomOut, Monitor, Gauge, Share2, Copy, AlertCircle, Maximize, LayoutTemplate, AlignLeft, AlignCenter, Type, Box, Globe, Sun, Watch, Camera, LayoutGrid, Hourglass, Clapperboard, Stamp, Grid, ChevronDown, ChevronUp } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Milestone, UserProfile, ThemeId } from '../types';
import { format, differenceInDays, differenceInMonths, differenceInWeeks, differenceInHours, differenceInMinutes, differenceInSeconds, differenceInYears } from 'date-fns';
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

type TemplateType = 'classic' | 'modern' | 'bold' | 'minimal' | 'age_stats' | 'cinematic' | 'polaroid' | 'passport';

const ShareModal: React.FC<Props> = ({ isOpen, onClose, title, text, milestone, userProfile, allMilestones = [] }) => {
  // --- State ---
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '9:16'>('1:1');
  const [formatType, setFormatType] = useState<'image' | 'video'>('image');
  const [videoExportType, setVideoExportType] = useState<'video' | 'gif'>('video');
  const [imageQuality, setImageQuality] = useState<'1080p' | '4K' | 'Max'>('1080p');
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>(userProfile.theme);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('classic');
  const [showStats, setShowStats] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [duration, setDuration] = useState<5 | 10 | 15 | 30 | 60>(5);
  const [animStyle, setAnimStyle] = useState<'particles' | 'rolling' | 'pulse'>('particles');
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | undefined>(milestone);
  const [isThemeCollapsed, setIsThemeCollapsed] = useState(true);
  
  // Preview Scaling State
  const [previewScale, setPreviewScale] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [showFlash, setShowFlash] = useState(false);

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);      // For Preview
  const exportRef = useRef<HTMLDivElement>(null);    // For High-Res Capture (Off-screen)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const avatarImgRef = useRef<HTMLImageElement | null>(null);
  const coverImgRef = useRef<HTMLImageElement | null>(null);
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
      const base = getBaseDimensions();
      let multiplier = 1;
      if (imageQuality === '4K') multiplier = 2;
      if (imageQuality === 'Max') multiplier = 4; // ~4320px width
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

  const calculateTotalStats = (targetDate: Date) => {
      const dob = new Date(userProfile.dob);
      const [h, m] = userProfile.tob.split(':').map(Number);
      dob.setHours(h || 0, m || 0);
      return {
          years: differenceInYears(targetDate, dob),
          months: differenceInMonths(targetDate, dob),
          weeks: differenceInWeeks(targetDate, dob),
          days: differenceInDays(targetDate, dob),
          hours: differenceInHours(targetDate, dob),
          minutes: differenceInMinutes(targetDate, dob),
          seconds: differenceInSeconds(targetDate, dob)
      };
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
    if (isOpen && milestone && (milestone.title.includes('Age') || milestone.title.includes('Stats'))) {
        setSelectedTemplate('age_stats');
    }
  }, [isOpen, milestone]);

  useEffect(() => {
    if (userProfile.avatar) {
        const img = new Image();
        img.src = userProfile.avatar;
        img.crossOrigin = "anonymous";
        img.onload = () => { avatarImgRef.current = img; };
    }
     if (userProfile.coverImage) {
        const img = new Image();
        img.src = userProfile.coverImage;
        img.crossOrigin = "anonymous";
        img.onload = () => { coverImgRef.current = img; };
    }
  }, [userProfile.avatar, userProfile.coverImage]);

  // --- Render Components (HTML Templates) ---

  const activeMilestone = selectedMilestone || { title, description: text, date: new Date(), value: 0, unit: '', isPast: false, id: 'temp', category: 'Custom' as any, color: '#fff' };
  const currentTheme = themes[activeThemeId];
  const rgb = (str: string, alpha = 1) => `rgba(${str.split(' ').join(',')}, ${alpha})`;
  const stats = calculateCosmicStats(activeMilestone.date);
  const totalStats = calculateTotalStats(activeMilestone.date);

  const renderCardHTML = (isThumbnail: boolean = false, forcedTemplate?: TemplateType) => {
      // Dimensions used for scaling elements inside templates
      const templateToUse = forcedTemplate || selectedTemplate;
      
      const commonContainerStyles = {
          width: '100%', height: '100%', position: 'relative' as const, overflow: 'hidden',
          backgroundColor: rgb(currentTheme.colors.base), color: rgb(currentTheme.colors.text),
          fontSize: isThumbnail ? '8px' : 'inherit'
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

      const avatarEl = userProfile.avatar ? (
        <img src={userProfile.avatar} alt="Me" className="w-full h-full object-cover" />
      ) : ( <div className="w-full h-full flex items-center justify-center bg-white/10"><Logo className={isThumbnail ? "w-4 h-4" : "w-1/2 h-1/2 opacity-90"} /></div> );

      const renderCosmicStatsBlock = (style: 'grid' | 'row' | 'minimal') => {
          if (!showStats) return null;
          if (style === 'grid') {
            return (
                <div className={`${isThumbnail ? 'mt-2 gap-1 px-2' : 'mt-8 gap-4 px-8'} grid grid-cols-2 w-full max-w-2xl content-layer-parent`}>
                     <div className="bg-skin-card/20 backdrop-blur-sm p-3 rounded-lg border border-skin-border/20 text-left">
                        <div className={`uppercase opacity-70 font-bold mb-1 flex items-center gap-1 ${isThumbnail ? 'text-[6px]' : 'text-xs'}`}><Globe size={isThumbnail ? 6 : 12}/> Earth</div>
                        <div className={`font-mono font-bold ${isThumbnail ? 'text-[8px]' : 'text-xl'}`}>{stats.earthRotations.toLocaleString()}</div>
                     </div>
                     <div className="bg-skin-card/20 backdrop-blur-sm p-3 rounded-lg border border-skin-border/20 text-left">
                        <div className={`uppercase opacity-70 font-bold mb-1 flex items-center gap-1 ${isThumbnail ? 'text-[6px]' : 'text-xs'}`}><Sun size={isThumbnail ? 6 : 12}/> Sun</div>
                        <div className={`font-mono font-bold ${isThumbnail ? 'text-[8px]' : 'text-xl'}`}>{stats.sunOrbits}</div>
                     </div>
                </div>
            )
          }
          if (style === 'minimal') {
              return (
                  <div className={`${isThumbnail ? 'mt-4 pt-2' : 'mt-12 pt-6'} text-center w-full max-w-3xl border-t border-dashed border-skin-border/30 content-layer-parent`}>
                      <div className="grid grid-cols-3 divide-x divide-skin-border/30">
                          <div className="px-4">
                              <div className={`${isThumbnail ? 'text-lg' : 'text-3xl'} font-light`}>{stats.earthRotations.toLocaleString()}</div>
                              <div className={`${isThumbnail ? 'text-[5px]' : 'text-xs'} uppercase tracking-widest opacity-50`}>Days</div>
                          </div>
                           <div className="px-4">
                              <div className={`${isThumbnail ? 'text-lg' : 'text-3xl'} font-light`}>{stats.sunOrbits}</div>
                              <div className={`${isThumbnail ? 'text-[5px]' : 'text-xs'} uppercase tracking-widest opacity-50`}>Years</div>
                          </div>
                           <div className="px-4">
                              <div className={`${isThumbnail ? 'text-lg' : 'text-3xl'} font-light`}>{stats.hourHand.toLocaleString()}</div>
                              <div className={`${isThumbnail ? 'text-[5px]' : 'text-xs'} uppercase tracking-widest opacity-50`}>Hours</div>
                          </div>
                      </div>
                  </div>
              )
          }
          return null;
      };

      // --- TEMPLATES ---
      
      if (templateToUse === 'cinematic') {
          return (
              <div style={commonContainerStyles} className="flex flex-col justify-end p-0 relative">
                   {userProfile.coverImage ? (
                       <div className="absolute inset-0 z-0">
                           <img src={userProfile.coverImage} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                       </div>
                   ) : (
                       <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0"></div>
                   )}
                   
                   <div className={`${isThumbnail ? 'p-4' : 'p-16'} relative z-10 text-white content-layer-parent`}>
                       <div className={`${isThumbnail ? 'mb-2' : 'mb-6'} flex items-center gap-3 opacity-80`}>
                           <div className="bg-red-600 text-white font-bold px-2 py-0.5 rounded text-xs uppercase tracking-wider">Milestone</div>
                           <div className={`${isThumbnail ? 'text-[8px]' : 'text-sm'} uppercase tracking-widest`}>{format(activeMilestone.date, 'MMMM d, yyyy')}</div>
                       </div>
                       
                       <h2 className={`${isThumbnail ? 'text-2xl' : 'text-7xl'} font-black leading-tight mb-4 uppercase italic tracking-tighter`} style={{ textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                           {activeMilestone.title}
                       </h2>
                       
                       <div className={`${isThumbnail ? 'h-0.5 w-10 my-2' : 'h-1 w-24 my-8'} bg-white opacity-50`}></div>
                       
                       <div className="flex justify-between items-end">
                            <p className={`${isThumbnail ? 'text-[8px] max-w-[150px] line-clamp-2' : 'text-2xl max-w-2xl'} font-light opacity-90 leading-relaxed`}>
                                {activeMilestone.description}
                            </p>
                            <div className={`${isThumbnail ? 'scale-50 origin-bottom-right' : ''}`}>
                                <Logo className="w-12 h-12 text-white opacity-50" />
                            </div>
                       </div>
                   </div>
              </div>
          )
      }

      if (templateToUse === 'polaroid') {
          const rotate = isThumbnail ? '0deg' : '2deg'; // Flatten for thumb
          return (
              <div style={commonContainerStyles} className="flex flex-col items-center justify-center relative bg-[#f0f0f0]">
                   <div 
                        className="bg-white shadow-2xl flex flex-col items-center" 
                        style={{ 
                            width: isThumbnail ? '80%' : '80%', 
                            height: 'auto',
                            padding: isThumbnail ? '12px 12px 30px 12px' : '40px 40px 120px 40px',
                            transform: `rotate(${rotate})`,
                        }}
                   >
                       <div className="w-full aspect-square bg-gray-100 overflow-hidden mb-4 relative filter sepia-[0.2] contrast-110">
                            {userProfile.coverImage ? (
                                <img src={userProfile.coverImage} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 text-gray-400">
                                    <Camera size={isThumbnail ? 20 : 60} />
                                </div>
                            )}
                            <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.2)] pointer-events-none"></div>
                       </div>
                       <div className="w-full text-center">
                           <h2 className={`${isThumbnail ? 'text-lg' : 'text-5xl'} font-bold text-gray-800 mb-2 font-[cursive] opacity-90 truncate`}>
                               {activeMilestone.title}
                           </h2>
                           <p className={`${isThumbnail ? 'text-[8px]' : 'text-xl'} text-gray-500 font-mono`}>
                               {format(activeMilestone.date, 'dd.MM.yyyy')}
                           </p>
                       </div>
                   </div>
              </div>
          )
      }

      if (templateToUse === 'passport') {
          return (
              <div style={commonContainerStyles} className="p-8 flex flex-col relative bg-[#fdfbf7] text-[#3d4c53]">
                   <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]"></div>
                   
                   <div className={`${isThumbnail ? 'border-2 p-2' : 'border-4 p-8'} border-double border-[#3d4c53] h-full flex flex-col relative z-10`}>
                       <div className="flex justify-between items-start mb-8 border-b-2 border-[#3d4c53] pb-4">
                           <div className="uppercase font-bold tracking-widest flex items-center gap-2">
                               <Globe size={isThumbnail ? 12 : 32} />
                               <span className={isThumbnail ? 'text-[10px]' : 'text-3xl'}>Milestone Passport</span>
                           </div>
                           <div className="font-mono opacity-60">No. {Math.floor(Math.random() * 100000)}</div>
                       </div>
                       
                       <div className="flex gap-8">
                           <div className={`${isThumbnail ? 'w-20 h-24' : 'w-48 h-60'} bg-gray-200 filter grayscale contrast-125 border border-gray-400 overflow-hidden`}>
                               {avatarEl}
                           </div>
                           <div className="flex-1 space-y-4 font-mono">
                               <div>
                                   <div className={`${isThumbnail ? 'text-[6px]' : 'text-xs'} uppercase opacity-50`}>Event Name / Nom</div>
                                   <div className={`${isThumbnail ? 'text-xs' : 'text-2xl'} font-bold`}>{activeMilestone.title}</div>
                               </div>
                               <div>
                                   <div className={`${isThumbnail ? 'text-[6px]' : 'text-xs'} uppercase opacity-50`}>Date of Arrival / Date</div>
                                   <div className={`${isThumbnail ? 'text-xs' : 'text-xl'}`}>{format(activeMilestone.date, 'yyyy-MM-dd')}</div>
                               </div>
                               <div>
                                   <div className={`${isThumbnail ? 'text-[6px]' : 'text-xs'} uppercase opacity-50`}>Bearer / Titulaire</div>
                                   <div className={`${isThumbnail ? 'text-xs' : 'text-xl'}`}>{userProfile.name}</div>
                               </div>
                           </div>
                       </div>
                       
                       <div className="mt-auto flex justify-end opacity-40 transform -rotate-12">
                           <div className={`${isThumbnail ? 'border-2 w-16 h-16 p-1 text-[6px]' : 'border-4 w-40 h-40 p-2 text-sm'} rounded-full border-red-800 text-red-800 flex flex-col items-center justify-center text-center font-bold uppercase`}>
                               <Stamp size={isThumbnail ? 12 : 32} className="mb-1"/>
                               Verified<br/>Milestone
                           </div>
                       </div>
                   </div>
              </div>
          )
      }

      if (templateToUse === 'age_stats') {
          return (
              <div style={commonContainerStyles} className={`flex flex-col ${isThumbnail ? 'p-4' : 'p-12'} transition-colors duration-500`}>
                  {bgPattern}
                  <div className="relative z-10 flex items-center justify-between mb-8 content-layer-parent">
                       <div className="flex items-center gap-4">
                           <div 
                                className={`${isThumbnail ? 'w-8 h-8' : 'w-24 h-24'} rounded-full border-4 shadow-xl overflow-hidden shrink-0`}
                                style={{ borderColor: rgb(currentTheme.colors.border), backgroundColor: rgb(currentTheme.colors.card) }}
                            >
                                {avatarEl}
                            </div>
                            <div>
                                <div className={`uppercase tracking-[0.2em] font-bold opacity-60 ${isThumbnail ? 'text-[6px]' : 'text-lg'}`}>Life Progress</div>
                                <h2 className={`${isThumbnail ? 'text-lg' : 'text-5xl'} font-black leading-none`}>{userProfile.name}</h2>
                            </div>
                       </div>
                  </div>

                  <div className="relative z-10 grid grid-cols-2 gap-4 flex-1 content-layer-parent">
                      <div 
                          className={`col-span-2 ${isThumbnail ? 'p-2' : 'p-8'} rounded-3xl border flex items-center justify-between backdrop-blur-md shadow-lg`}
                          style={{ backgroundColor: rgb(currentTheme.colors.card, 0.6), borderColor: rgb(currentTheme.colors.border) }}
                      >
                           <div>
                               <div className={`${isThumbnail ? 'text-[6px]' : 'text-sm'} uppercase tracking-widest font-bold opacity-60 mb-2`}>Total Days Lived</div>
                               <div className={`${isThumbnail ? 'text-2xl' : 'text-8xl'} font-black tabular-nums`} style={{ color: rgb(currentTheme.colors.primary) }}>
                                   {totalStats.days.toLocaleString()}
                               </div>
                           </div>
                           {!isThumbnail && <Calendar size={80} className="opacity-10" />}
                      </div>

                      {[
                          { label: 'Years', val: totalStats.years },
                          { label: 'Months', val: totalStats.months },
                          { label: 'Hours', val: totalStats.hours },
                          { label: 'Minutes', val: totalStats.minutes },
                      ].map((item, i) => (
                          <div 
                            key={i}
                            className={`${isThumbnail ? 'p-2' : 'p-6'} rounded-2xl border flex flex-col justify-center backdrop-blur-sm`}
                            style={{ backgroundColor: rgb(currentTheme.colors.card, 0.4), borderColor: rgb(currentTheme.colors.border) }}
                          >
                              <div className={`${isThumbnail ? 'text-[6px]' : 'text-xs'} uppercase tracking-widest font-bold opacity-60`}>{item.label}</div>
                              <div className={`${isThumbnail ? 'text-lg' : 'text-4xl'} font-bold tabular-nums`}>
                                  {item.val.toLocaleString()}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          );
      }

      if (templateToUse === 'classic') {
          return (
            <div style={commonContainerStyles} className={`flex flex-col items-center justify-center text-center ${isThumbnail ? 'p-4' : 'p-12'} transition-colors duration-500`}>
                {bgPattern}
                {gradientOverlay}
                <div className="relative z-10 flex flex-col items-center gap-4 w-full h-full justify-center content-layer-parent">
                    <div className={`${isThumbnail ? 'w-10 h-10' : 'w-32 h-32'} rounded-full border-4 shadow-xl overflow-hidden shrink-0`} style={{ borderColor: rgb(currentTheme.colors.border), backgroundColor: rgb(currentTheme.colors.card) }}>
                        {avatarEl}
                    </div>
                    <div className={`${isThumbnail ? 'text-[6px] py-1 px-2' : 'text-xl py-3 px-10'} uppercase tracking-[0.2em] font-bold opacity-60 border-y-2`} style={{ borderColor: rgb(currentTheme.colors.border) }}>
                        Milestone Reached
                    </div>
                    <h2 className={`${isThumbnail ? 'text-2xl' : 'text-7xl'} font-black leading-none tracking-tight break-words w-full drop-shadow-sm line-clamp-3`} style={{ color: rgb(currentTheme.colors.text) }}>
                        {activeMilestone.title}
                    </h2>
                    <div className={`${isThumbnail ? 'px-2 py-1' : 'px-8 py-4'} rounded-xl border backdrop-blur-md shadow-lg mb-2`} style={{ backgroundColor: rgb(currentTheme.colors.card, 0.4), borderColor: rgb(currentTheme.colors.border) }}>
                        <span className={`${isThumbnail ? 'text-lg' : 'text-4xl'} font-mono font-bold`} style={{ color: rgb(currentTheme.colors.primary) }}>
                            {activeMilestone.date ? format(activeMilestone.date, 'MMMM do, yyyy') : 'Today'}
                        </span>
                    </div>
                    {renderCosmicStatsBlock('grid')}
                </div>
            </div>
          );
      }

      if (templateToUse === 'modern') {
          return (
             <div style={commonContainerStyles} className={`flex flex-col justify-between ${isThumbnail ? 'p-4' : 'p-16'} text-left transition-colors duration-500`}>
                {bgPattern}
                <div className="relative z-10 flex justify-between items-start w-full content-layer-parent">
                     <div>
                        <div className={`${isThumbnail ? 'text-lg' : 'text-3xl'} font-bold opacity-60 uppercase tracking-widest`}>Milestone</div>
                        <div className={`${isThumbnail ? 'text-xs' : 'text-xl'} opacity-50`}>{format(new Date(), 'EEEE, MMMM do')}</div>
                     </div>
                     <div className={`${isThumbnail ? 'w-8 h-8' : 'w-24 h-24'} rounded-2xl overflow-hidden shadow-lg border-2`} style={{ borderColor: rgb(currentTheme.colors.border) }}>
                        {avatarEl}
                     </div>
                </div>
                <div className="relative z-10 my-auto content-layer-parent">
                    <div className={`${isThumbnail ? 'w-8 h-1 mb-2' : 'w-20 h-2 mb-8'}`} style={{ backgroundColor: rgb(currentTheme.colors.primary) }}></div>
                    <h2 className={`${isThumbnail ? 'text-3xl' : 'text-[100px]'} font-black leading-[0.9] tracking-tighter mb-4 break-words w-full line-clamp-4`} style={{ color: rgb(currentTheme.colors.text) }}>
                        {activeMilestone.title}
                    </h2>
                    <p className={`${isThumbnail ? 'text-[8px]' : 'text-3xl'} font-light opacity-80 max-w-3xl leading-snug line-clamp-3`}>
                        {activeMilestone.description}
                    </p>
                </div>
             </div>
          )
      }
      
      if (templateToUse === 'bold') {
          return (
              <div style={commonContainerStyles} className={`flex flex-col items-center justify-center ${isThumbnail ? 'p-4' : 'p-8'} transition-colors duration-500`}>
                  <div className="absolute inset-0 opacity-50" style={{ background: rgb(currentTheme.colors.card) }}></div>
                  <div className="relative z-10 border-4 w-full h-full flex flex-col justify-center items-center text-center content-layer-parent" style={{ borderColor: rgb(currentTheme.colors.text) }}>
                      <div className={`bg-skin-card ${isThumbnail ? 'px-2 py-0.5 -mt-2 text-[6px]' : 'px-8 py-2 -mt-10 mb-6 text-xl'} font-bold uppercase tracking-[0.3em] border shadow-sm`} style={{ borderColor: rgb(currentTheme.colors.border), color: rgb(currentTheme.colors.primary) }}>
                          Achievement Unlocked
                      </div>
                      <h2 className={`${isThumbnail ? 'text-3xl' : 'text-[110px]'} font-black uppercase leading-none mb-6 break-words w-full line-clamp-3`} style={{ textShadow: `4px 4px 0px ${rgb(currentTheme.colors.muted, 0.4)}` }}>
                          {activeMilestone.title}
                      </h2>
                      <div className="flex items-center gap-6 mb-4">
                           <div className="text-right">
                               <div className={`${isThumbnail ? 'text-xl' : 'text-5xl'} font-bold`}>{activeMilestone.date ? format(activeMilestone.date, 'dd') : 'Now'}</div>
                               <div className={`${isThumbnail ? 'text-[8px]' : 'text-xl'} uppercase opacity-60`}>{activeMilestone.date ? format(activeMilestone.date, 'MMM') : ''}</div>
                           </div>
                           <div className="w-1 h-16 bg-current opacity-20"></div>
                           <div className={`${isThumbnail ? 'text-[8px]' : 'text-xl'} text-left font-medium max-w-xl opacity-90 line-clamp-2`}>
                               {activeMilestone.description}
                           </div>
                      </div>
                  </div>
              </div>
          )
      }

      if (templateToUse === 'minimal') {
          return (
              <div style={commonContainerStyles} className={`flex flex-col items-center ${isThumbnail ? 'p-4' : 'p-20'} transition-colors duration-500`}>
                  <div className="flex-1 flex flex-col items-center justify-center w-full content-layer-parent">
                       <div className={`${isThumbnail ? 'w-8 h-8 mb-2' : 'w-24 h-24 mb-8'} rounded-full overflow-hidden grayscale opacity-80`}>
                           {avatarEl}
                       </div>
                       <h2 className={`${isThumbnail ? 'text-2xl' : 'text-6xl'} font-light tracking-tighter text-center mb-6 w-full break-words`}>
                          {activeMilestone.title}
                       </h2>
                       <div className={`${isThumbnail ? 'w-4 h-0.5 my-2' : 'w-16 h-1 my-6'}`} style={{ backgroundColor: rgb(currentTheme.colors.primary) }}></div>
                       <p className={`${isThumbnail ? 'text-[8px]' : 'text-xl'} font-mono text-center opacity-60 max-w-2xl mb-4 line-clamp-3`}>
                           "{activeMilestone.description}"
                       </p>
                       <div className={`${isThumbnail ? 'text-lg' : 'text-3xl'} font-mono font-bold`} style={{ color: rgb(currentTheme.colors.primary) }}>
                          {activeMilestone.date ? format(activeMilestone.date, 'yyyy.MM.dd') : 'Today'}
                      </div>
                       {renderCosmicStatsBlock('minimal')}
                  </div>
              </div>
          )
      }

      return null;
  };

  // --- Actions & Rendering ---

  const generateImageBlob = async (targetRef: React.RefObject<HTMLDivElement>): Promise<Blob | null> => {
      if (!targetRef.current) return null;
      const { w, h } = getBaseDimensions();
      const { scale } = getExportDimensions();
      const images = targetRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map((node) => {
          const img = node as HTMLImageElement;
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => { img.onload = () => resolve(null); img.onerror = () => resolve(null); });
      }));
      const canvas = await html2canvas(targetRef.current, { 
          scale: scale, useCORS: true, backgroundColor: null, allowTaint: true, logging: false, width: w, height: h, scrollX: 0, scrollY: 0, windowWidth: w, windowHeight: h,
          onclone: (clonedDoc) => { 
              const el = clonedDoc.querySelector('.content-layer-parent') as HTMLElement; 
              if (el) { 
                  el.style.transform = 'none'; 
                  // Fix upward alignment for snapshot output
                  el.style.marginTop = '-3px';
                  el.style.transform = 'translateY(-3px)';
              } 
          }
      });
      return new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
  };

  const handleQuickSnapshot = () => {
      const targetRef = exportRef.current;
      if (!targetRef) return;
      setIsGenerating(true);
      setShowFlash(true);
      setTimeout(async () => {
          try {
              const { w, h } = getBaseDimensions();
              const canvas = await html2canvas(targetRef, { 
                  width: w, height: h, scale: 1, useCORS: true, allowTaint: true, backgroundColor: null, logging: false, 
                  onclone: (clonedDoc) => { 
                      const el = clonedDoc.getElementById('export-container'); 
                      if (el) { 
                          el.style.transform = 'none';
                          // Align text upward for better visual balance in export
                          const content = el.querySelector('.content-layer-parent') as HTMLElement;
                          if(content) {
                              content.style.marginTop = '-3px';
                              content.style.transform = 'translateY(-3px)';
                          }
                      } 
                  } 
              });
              const url = canvas.toDataURL('image/png');
              const link = document.createElement('a'); link.download = generateFilename('png'); link.href = url; link.click(); link.remove();
          } catch (err) { alert("Could not generate snapshot."); } finally { setIsGenerating(false); setShowFlash(false); }
      }, 300); // 0.3s flash
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    if (formatType === 'image') {
        const blob = await generateImageBlob(exportRef);
        if (blob) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.download = generateFilename('png'); link.href = url; link.click(); URL.revokeObjectURL(url); }
    } else { /* Video export logic omitted for brevity */ }
    setIsGenerating(false);
  };

  // ... (Other handlers like share/clipboard omitted for brevity) ...

  const startCanvasAnimation = () => { /* Canvas logic for video export */ };

  const upcomingMilestones = useMemo(() => {
      return allMilestones.filter(m => !m.isPast).sort((a,b) => a.date.getTime() - b.date.getTime()).slice(0, 50);
  }, [allMilestones]);

  const { w: baseW, h: baseH } = getBaseDimensions();

  if (!isOpen) return null;

  const templatesList: {id: TemplateType, label: string, icon: any, gradient: string}[] = [
      { id: 'classic', label: 'Classic', icon: LayoutTemplate, gradient: 'from-blue-400 to-indigo-500' },
      { id: 'modern', label: 'Modern', icon: AlignLeft, gradient: 'from-emerald-400 to-teal-500' },
      { id: 'bold', label: 'Bold', icon: Type, gradient: 'from-orange-400 to-red-500' },
      { id: 'minimal', label: 'Minimal', icon: AlignCenter, gradient: 'from-gray-300 to-gray-500' },
      { id: 'age_stats', label: 'Stats Grid', icon: LayoutGrid, gradient: 'from-purple-400 to-pink-500' },
      { id: 'cinematic', label: 'Cinematic', icon: Clapperboard, gradient: 'from-gray-800 to-black' },
      { id: 'polaroid', label: 'Polaroid', icon: Camera, gradient: 'from-yellow-200 to-amber-400' },
      { id: 'passport', label: 'Passport', icon: Stamp, gradient: 'from-blue-800 to-slate-900' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-0 sm:p-4 animate-in fade-in duration-300 overflow-hidden" onClick={onClose}>
      <div className="bg-skin-card/80 backdrop-blur-2xl w-full max-w-7xl rounded-none sm:rounded-3xl flex flex-col-reverse md:flex-row shadow-2xl h-full md:h-[90vh] border border-white/20 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Left Control Panel */}
        <div className="p-6 w-full md:w-96 flex-shrink-0 border-t md:border-t-0 md:border-r border-skin-border/50 flex flex-col gap-5 bg-skin-base/40 overflow-y-auto scrollbar-hide overscroll-contain h-[45%] md:h-full z-20">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-skin-text flex items-center gap-2"><Film className="w-5 h-5 text-skin-primary" /> Share Studio</h3>
                <button onClick={onClose} className="p-2 hover:bg-skin-border/50 rounded-full text-skin-muted hover:text-skin-text"><X size={20} /></button>
            </div>
            
            <div className="space-y-6">
                {/* Event Selector */}
                <div>
                     <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider flex items-center gap-2"><Calendar size={12}/> Event Selection</label>
                    <select className="w-full p-3 text-sm rounded-xl border border-skin-border/50 bg-skin-card/50 text-skin-text focus:ring-2 focus:ring-skin-primary focus:outline-none backdrop-blur-sm"
                        onChange={(e) => { const found = allMilestones.find(m => m.id === e.target.value); if (found) setSelectedMilestone(found); }}
                        value={selectedMilestone?.id || ""}>
                        {!selectedMilestone && <option value="">Current Selection</option>}
                        {selectedMilestone && <option value={selectedMilestone.id}>Current: {selectedMilestone.title}</option>}
                        <optgroup label="Upcoming Milestones">{upcomingMilestones.map(m => ( <option key={m.id} value={m.id}>{m.title} ({format(m.date, 'MMM d')})</option>))}</optgroup>
                    </select>
                </div>

                {/* TEMPLATE CAROUSEL */}
                <div>
                    <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider flex items-center gap-2"><LayoutTemplate size={12}/> Choose Template</label>
                    <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x custom-scrollbar">
                        {templatesList.map((t) => (
                            <button key={t.id} onClick={() => setSelectedTemplate(t.id)} className={`snap-center flex-shrink-0 w-24 flex flex-col items-center gap-2 group transition-all duration-300 ${selectedTemplate === t.id ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}`}>
                                <div className={`w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all relative shadow-md bg-gradient-to-br ${t.gradient} ${selectedTemplate === t.id ? 'border-skin-primary ring-2 ring-skin-primary/50' : 'border-transparent'}`}>
                                    {/* Mini Render Container */}
                                    <div className="w-full h-full pointer-events-none transform scale-[0.33] origin-top-left bg-white/10" style={{width: '300%', height: '300%'}}>
                                        {renderCardHTML(true, t.id)}
                                    </div>
                                    
                                    {/* Active Indicator */}
                                    {selectedTemplate === t.id && (
                                        <div className="absolute top-2 right-2 w-4 h-4 bg-skin-primary rounded-full shadow-lg border-2 border-white flex items-center justify-center">
                                            <Check size={10} className="text-white"/>
                                        </div>
                                    )}

                                    {/* Label Overlay */}
                                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] font-bold py-1.5 text-center backdrop-blur-md">
                                        {t.label}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Other controls (Format, Theme, Aspect) */}
                <div className="space-y-4">
                    <div>
                         <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider">Canvas Ratio</label>
                        <div className="flex gap-2">
                            {[{ id: '1:1', icon: Square }, { id: '4:5', icon: Instagram }, { id: '9:16', icon: Smartphone }].map(r => (
                                <button key={r.id} onClick={() => setAspectRatio(r.id as any)} className={`flex-1 py-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${aspectRatio === r.id ? 'border-skin-primary bg-skin-primary text-white shadow-md' : 'border-skin-border/50 text-skin-muted bg-skin-card/50 hover:bg-skin-input'}`}>
                                    <r.icon size={16} /><span className="text-[10px] font-bold">{r.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Collapsible Theme Picker */}
                    <div className="border border-skin-border/50 rounded-xl bg-skin-card/50 overflow-hidden backdrop-blur-sm transition-all duration-300">
                        <button 
                            onClick={() => setIsThemeCollapsed(!isThemeCollapsed)}
                            className="w-full p-3 flex items-center justify-between text-left hover:bg-skin-input/50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full border shadow-sm" style={{ backgroundColor: `rgb(${currentTheme.colors.primary})` }}></div>
                                <div className="text-sm font-bold text-skin-text">Theme Color</div>
                            </div>
                            {isThemeCollapsed ? <ChevronDown size={16} className="text-skin-muted" /> : <ChevronUp size={16} className="text-skin-muted" />}
                        </button>
                        
                        {!isThemeCollapsed && (
                             <div className="p-3 pt-0 grid grid-cols-4 gap-2 animate-in slide-in-from-top-2 duration-200">
                                {Object.values(themes).map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveThemeId(t.id)}
                                        className={`w-full aspect-square rounded-full border-2 transition-all flex items-center justify-center relative group ${activeThemeId === t.id ? 'border-skin-text scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: `rgb(${t.colors.primary})` }}
                                        title={t.name}
                                    >
                                        {activeThemeId === t.id && <Check size={12} className="text-white drop-shadow-md"/>}
                                    </button>
                                ))}
                             </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="mt-auto pt-6 border-t border-skin-border/30 space-y-3 pb-20 md:pb-0">
                <button onClick={handleDownload} disabled={isGenerating} className="w-full py-4 bg-skin-primary hover:bg-skin-primary/90 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors shadow-lg shadow-skin-primary/30 active:scale-95 transform duration-100">
                    {isGenerating ? (
                        <>
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                             Generating...
                        </>
                    ) : (
                        <><Download size={20}/> Save to Device</>
                    )}
                </button>
            </div>
        </div>

        {/* Live Preview Area */}
        <div className="flex-1 bg-skin-input/50 relative flex flex-col h-[55%] md:h-full overflow-hidden">
             <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-gradient-to-b from-skin-input/80 to-transparent pointer-events-none">
                 <span className="bg-skin-card/80 backdrop-blur-md border border-skin-border/50 px-4 py-1.5 rounded-full text-[10px] font-bold text-skin-muted uppercase tracking-wider shadow-sm flex items-center gap-2">
                    <Check size={12} className="text-green-500"/> Live Preview
                 </span>
                 <div className="pointer-events-auto flex items-center gap-2">
                     <button onClick={handleQuickSnapshot} className="bg-skin-primary text-white py-1.5 px-3 rounded-full backdrop-blur-md shadow-lg flex items-center gap-2 hover:bg-skin-primary/90 transition-colors"><Download size={14} /> <span className="text-[10px] font-bold uppercase">Quick Save</span></button>
                     <button onClick={() => setIsZoomed(!isZoomed)} className="bg-black/40 hover:bg-black/60 transition-colors text-white text-[10px] px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2">{isZoomed ? <ZoomOut size={12} /> : <ZoomIn size={12} />}<span>{isZoomed ? '100%' : 'Fit'}</span></button>
                 </div>
            </div>
            
            <div ref={previewContainerRef} className={`flex-1 w-full h-full flex ${isZoomed ? 'items-start justify-start overflow-auto p-8' : 'items-center justify-center overflow-hidden'} relative`}>
                {/* 0.3s Sparkle Flash Overlay */}
                <div 
                    className={`absolute inset-0 z-50 pointer-events-none flex items-center justify-center transition-all ease-out duration-300 ${showFlash ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
                    style={{ background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)' }}
                >
                    <Sparkles className={`w-32 h-32 text-yellow-400 drop-shadow-2xl transition-transform duration-300 ${showFlash ? 'scale-125 rotate-12' : 'scale-50 rotate-0'}`} />
                </div>

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