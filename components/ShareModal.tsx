import React, { useRef, useState, useEffect, useMemo } from 'react';
import { X, Download, Video, Image as ImageIcon, Check, Palette, Film, Instagram, Smartphone, Square, Activity, Move, Sparkles, Timer, Calendar, ZoomIn, ZoomOut, Monitor, Gauge, Share2, Copy, AlertCircle, Maximize, LayoutTemplate, AlignLeft, AlignCenter, Type, Box, Globe, Sun, Watch, Camera } from 'lucide-react';
import html2canvas from 'html2canvas';
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
}

type TemplateType = 'classic' | 'modern' | 'bold' | 'minimal';

const ShareModal: React.FC<Props> = ({ isOpen, onClose, title, text, milestone, userProfile, allMilestones = [] }) => {
  // --- State ---
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '9:16'>('1:1');
  const [formatType, setFormatType] = useState<'image' | 'video'>('image');
  const [imageQuality, setImageQuality] = useState<'1080p' | '4K' | 'Max'>('1080p');
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>(userProfile.theme);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('classic');
  const [showStats, setShowStats] = useState(true);
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

              const padding = 20; // Small padding
              const availW = clientWidth - padding;
              const availH = clientHeight - padding;
              
              const { w, h } = getBaseDimensions();

              const scaleX = availW / w;
              const scaleY = availH / h;
              
              // Scale to fit, but max 95% of container
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

  // Animation Loop
  useEffect(() => {
    if (isOpen && formatType === 'video' && canvasRef.current) {
        startTimeRef.current = performance.now();
        startCanvasAnimation();
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isOpen, formatType, aspectRatio, activeThemeId, userProfile.avatar, animStyle, selectedMilestone, selectedTemplate, showStats]); 


  // --- Canvas Logic ---
  const startCanvasAnimation = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { w, h } = getBaseDimensions();
      canvas.width = w;
      canvas.height = h;

      const currentTheme = themes[activeThemeId];
      // Use theme colors via manual RGB conversion from new Theme system (strings)
      // Since canvas needs solid colors, we parse the "R G B" string
      const parseRgb = (rgbStr: string) => `rgb(${rgbStr})`;
      
      const bgGradientStart = parseRgb(currentTheme.colors.base);
      const bgGradientEnd = parseRgb(currentTheme.colors.card); 
      const textColor = parseRgb(currentTheme.colors.text);
      const primaryColor = parseRgb(currentTheme.colors.primary);

      const particles = Array.from({ length: 60 }).map(() => ({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * 4 + 1,
          speedY: Math.random() * 2 + 0.5,
          color: `rgba(255, 255, 255, ${Math.random() * 0.5})`
      }));

      const activeMilestone = selectedMilestone || { title, description: text, date: new Date(), value: 0, unit: 'days' };
      const displayDate = selectedMilestone ? format(selectedMilestone.date, 'MMMM do, yyyy') : text;
      
      const stats = calculateCosmicStats(activeMilestone.date);

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
                  ctx.fillStyle = `${textColor}20`; // Hex alpha approximation
                  ctx.fill();
              });
          } else if (animStyle === 'rolling') {
               ctx.strokeStyle = `rgba(255,255,255,0.1)`;
               ctx.lineWidth = 2;
               const offset = (elapsed * 0.05) % 100;
               for(let i=0; i<w; i+=100) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
               for(let i=0; i<h; i+=100) { ctx.beginPath(); ctx.moveTo(0, i + offset); ctx.lineTo(w, i + offset); ctx.stroke(); }
          }

          let scale = 1;
          if (animStyle === 'pulse') scale = 1 + 0.02 * Math.sin(elapsed * 0.003);

          ctx.save();
          
          let titleY = h * 0.45;
          let textAlign: CanvasTextAlign = 'center';
          let titleX = w / 2;
          
          if (selectedTemplate === 'modern') {
              textAlign = 'left';
              titleX = 100;
              titleY = h * 0.4;
          } else if (selectedTemplate === 'minimal') {
              textAlign = 'center';
              titleX = w / 2;
              titleY = h * 0.55;
          } else if (selectedTemplate === 'bold') {
              textAlign = 'center';
              titleX = w / 2;
              titleY = h * 0.5;
          }

          // Avatar logic...
          if (selectedTemplate !== 'bold') {
            const avatarSize = 180;
            let avatarX = w/2;
            let avatarY = h * 0.25;
            
            if (selectedTemplate === 'modern') { avatarX = 190; avatarY = h * 0.2; } 
            else if (selectedTemplate === 'minimal') { avatarY = h * 0.3; }

            ctx.save();
            ctx.translate(avatarX, avatarY);
            ctx.scale(scale, scale); 
            if (avatarImgRef.current) {
                ctx.beginPath(); ctx.arc(0, 0, avatarSize/2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
                ctx.drawImage(avatarImgRef.current, -avatarSize/2, -avatarSize/2, avatarSize, avatarSize);
                ctx.beginPath(); ctx.arc(0, 0, avatarSize/2, 0, Math.PI * 2);
                ctx.strokeStyle = textColor; ctx.lineWidth = 8; ctx.stroke();
            } else {
               ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI*2); ctx.fillStyle = `rgba(255,255,255,0.2)`; ctx.fill();
            }
            ctx.restore();
          }

          ctx.textAlign = textAlign;
          ctx.fillStyle = textColor;
          
          // Pre-Title
          ctx.font = 'bold 40px Inter, sans-serif';
          ctx.globalAlpha = 0.7;
          let preTitleY = titleY - 80;
          if (selectedTemplate === 'bold') preTitleY = titleY - 150;
          ctx.fillText("MILESTONE REACHED", titleX, preTitleY);
          ctx.globalAlpha = 1.0;

          // Main Title
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

          // Font Sizing - adjusted for fit
          let fontSize = 90;
          if (selectedTemplate === 'bold') fontSize = 130;
          if (selectedTemplate === 'minimal') fontSize = 70;
          ctx.font = `900 ${fontSize}px Inter, sans-serif`;

          // Text Wrapping
          const maxWidth = selectedTemplate === 'modern' ? w - 200 : w * 0.8;
          const words = displayTitle.split(' ');
          let line = '';
          const lines = [];
          for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) { lines.push(line); line = words[n] + ' '; } 
            else { line = testLine; }
          }
          lines.push(line);

          lines.forEach((lineText, i) => {
             const lineHeight = fontSize * 1.1;
             const yOffset = (i - (lines.length-1)/2) * lineHeight;
             const finalY = selectedTemplate === 'modern' ? titleY + (i * lineHeight) : titleY + 50 + yOffset;
             ctx.fillText(lineText, titleX, finalY);
          });

          // Date 
          ctx.font = 'bold 40px Inter, sans-serif';
          ctx.fillStyle = primaryColor;
          let footerY = h * 0.85;
          if (showStats) footerY = h * 0.78; 
          
          ctx.fillText(displayDate, titleX, footerY);

          // User Name
          ctx.font = '30px Inter, sans-serif';
          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.6;
          ctx.fillText(userProfile.name, titleX, footerY + 50);
          ctx.globalAlpha = 1.0;

          // --- Cosmic Stats (Canvas) ---
          if (showStats) {
             ctx.save();
             ctx.font = '24px Inter, sans-serif'; 
             ctx.fillStyle = textColor;
             ctx.globalAlpha = 0.8;
             
             const statText = `🌍 ${stats.earthRotations.toLocaleString()} Rotations  •  ☀️ ${stats.sunOrbits} Orbits`;
             const clockText = `⌚ ${stats.hourHand.toLocaleString()}h • ${stats.minuteHand.toLocaleString()}m • ${stats.secondHand.toLocaleString()}s`;
             
             let statY = h - 100;
             if (selectedTemplate === 'modern') statY = h - 120;

             ctx.fillText(statText, titleX, statY);
             ctx.fillText(clockText, titleX, statY + 35);
             ctx.restore();
          }

          ctx.restore();
          rafRef.current = requestAnimationFrame(render);
      };
      
      rafRef.current = requestAnimationFrame(render);
  };

  // --- Actions ---

  const generateImageBlob = async (): Promise<Blob | null> => {
      // Use the off-screen exportRef for high quality capture
      const targetRef = exportRef.current; 
      if (!targetRef) return null;
      
      const { w, h } = getBaseDimensions();
      const { scale } = getExportDimensions();
      
      // Force wait for images
      const images = targetRef.querySelectorAll('img');
      await Promise.all(Array.from(images).map((node) => {
          const img = node as HTMLImageElement;
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => { 
            img.onload = () => resolve(null); 
            img.onerror = () => resolve(null); 
          });
      }));

      // Scroll to top to prevent canvas offset issues
      window.scrollTo(0, 0);

      const canvas = await html2canvas(targetRef, { 
          scale: scale, 
          useCORS: true, 
          backgroundColor: null,
          allowTaint: true,
          logging: false,
          width: w,
          height: h,
          scrollX: 0,
          scrollY: 0,
          windowWidth: w,
          windowHeight: h,
          onclone: (clonedDoc) => {
              const el = clonedDoc.getElementById('export-container');
              if (el) {
                  el.style.transform = 'none';
                  el.style.opacity = '1';
                  
                  // Fix text shifting downwards in html2canvas export
                  // Apply a counter-slide (move UP) to correct the visual drop
                  const contentLayers = el.querySelectorAll('.content-layer');
                  contentLayers.forEach((layer: any) => {
                      layer.style.transform = 'translateY(-30px)'; // Move UP 30px
                  });
              }
          }
      });
      return new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
  };

  const handleQuickSnapshot = async () => {
      if (!cardRef.current) return;
      setIsGenerating(true);
      try {
          const canvas = await html2canvas(cardRef.current, {
              scale: 1.5, // 1.5x quality as requested
              useCORS: true,
              allowTaint: true,
              backgroundColor: null,
              logging: false,
          });

          const url = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = generateFilename('png');
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } catch (err) {
          console.error("Quick snapshot failed", err);
          alert("Could not generate snapshot.");
      } finally {
          setIsGenerating(false);
      }
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
      try {
        if (formatType === 'image') {
            const blob = await generateImageBlob();
            if (blob) {
                const file = new File([blob], generateFilename('png'), { type: 'image/png' });
                const shareData = {
                    files: [file],
                    title: 'Life Milestone',
                    text: `Check out this milestone: ${selectedMilestone?.title}`
                };

                if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
                    try {
                        await navigator.share(shareData);
                    } catch (e: any) {
                        if (
                            e.name === 'AbortError' || 
                            e.name === 'NotAllowedError' ||
                            e.message.toLowerCase().includes('cancel') ||
                            e.message.toLowerCase().includes('gesture')
                        ) { return; }
                        console.warn('Share error:', e);
                        alert("Could not share automatically. Please use the 'Save to Device' button.");
                    }
                } else {
                    alert("Native sharing not supported on this device. Try downloading.");
                }
            }
        } else {
            alert("Direct video sharing is not supported in browser. Please download the video first.");
        }
      } catch (error) {
          console.error("Error preparing share:", error);
          alert("An error occurred while preparing the image.");
      } finally {
          setIsGenerating(false);
      }
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
  
  // Theme Helper
  const currentTheme = themes[activeThemeId];
  // Parse RGB strings to style objects for inline use
  const rgb = (str: string, alpha = 1) => `rgba(${str.split(' ').join(',')}, ${alpha})`;

  // Stats Data
  const stats = calculateCosmicStats(activeMilestone.date);

  // --- HTML TEMPLATES ---
  
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

      const avatarEl = userProfile.avatar ? (
        <img 
            src={userProfile.avatar} 
            alt="Me" 
            className="w-full h-full object-cover" 
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-white/10">
             <Logo className="w-1/2 h-1/2 opacity-90" />
        </div>
      );

      // Render the Cosmic Stats Block (Reusable)
      const renderCosmicStatsBlock = (style: 'grid' | 'row' | 'minimal') => {
          if (!showStats) return null;
          
          if (style === 'grid') {
            return (
                <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-2xl px-8">
                     <div className="bg-skin-card/20 backdrop-blur-sm p-3 rounded-lg border border-skin-border/20 text-left">
                        <div className="text-xs uppercase opacity-70 font-bold mb-1 flex items-center gap-1"><Globe size={12}/> Earth Rotations</div>
                        <div className="text-xl font-mono font-bold">{stats.earthRotations.toLocaleString()}</div>
                     </div>
                     <div className="bg-skin-card/20 backdrop-blur-sm p-3 rounded-lg border border-skin-border/20 text-left">
                        <div className="text-xs uppercase opacity-70 font-bold mb-1 flex items-center gap-1"><Sun size={12}/> Sun Orbits</div>
                        <div className="text-xl font-mono font-bold">{stats.sunOrbits}</div>
                     </div>
                     <div className="col-span-2 bg-skin-card/20 backdrop-blur-sm p-3 rounded-lg border border-skin-border/20 text-left flex justify-between items-center">
                         <div>
                            <div className="text-xs uppercase opacity-70 font-bold mb-1 flex items-center gap-1"><Watch size={12}/> Clock Rotations</div>
                            <div className="text-sm font-mono opacity-90">
                                {stats.hourHand.toLocaleString()}h • {stats.minuteHand.toLocaleString()}m • {stats.secondHand.toLocaleString()}s
                            </div>
                         </div>
                     </div>
                </div>
            )
          }

          if (style === 'minimal') {
              return (
                  <div className="mt-12 text-center w-full max-w-3xl border-t border-dashed border-skin-border/30 pt-6">
                      <div className="grid grid-cols-3 divide-x divide-skin-border/30">
                          <div className="px-4">
                              <div className="text-3xl font-light">{stats.earthRotations.toLocaleString()}</div>
                              <div className="text-xs uppercase tracking-widest opacity-50">Earth Rotations</div>
                          </div>
                           <div className="px-4">
                              <div className="text-3xl font-light">{stats.sunOrbits}</div>
                              <div className="text-xs uppercase tracking-widest opacity-50">Solar Orbits</div>
                          </div>
                           <div className="px-4">
                              <div className="text-3xl font-light">{stats.hourHand.toLocaleString()}</div>
                              <div className="text-xs uppercase tracking-widest opacity-50">Hour Cycles</div>
                          </div>
                      </div>
                  </div>
              )
          }

          // Row style (default/modern)
          return (
              <div className="mt-auto pt-6 w-full border-t border-skin-border/20 flex justify-between items-end text-sm opacity-80">
                  <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2"><Globe size={14} /> {stats.earthRotations.toLocaleString()} Earth Rotations</div>
                      <div className="flex items-center gap-2"><Sun size={14} /> {stats.sunOrbits} Solar Orbits</div>
                  </div>
                  <div className="text-right flex flex-col gap-1">
                      <div className="flex items-center justify-end gap-2">{stats.hourHand.toLocaleString()} Hour Cycles <Watch size={14} /></div>
                      <div className="text-xs opacity-70">{stats.minuteHand.toLocaleString()}m / {stats.secondHand.toLocaleString()}s hands</div>
                  </div>
              </div>
          )
      };

      // --- 1. CLASSIC TEMPLATE ---
      if (selectedTemplate === 'classic') {
          return (
            <div style={commonContainerStyles} className="flex flex-col items-center justify-center text-center p-12 transition-colors duration-500">
                {bgPattern}
                {gradientOverlay}
                
                <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-4xl mx-auto h-full justify-center content-layer">
                    <div 
                        className="w-32 h-32 rounded-full border-4 shadow-xl overflow-hidden shrink-0"
                        style={{ borderColor: rgb(currentTheme.colors.border), backgroundColor: rgb(currentTheme.colors.card) }}
                    >
                        {avatarEl}
                    </div>
                    
                    <div 
                        className="uppercase tracking-[0.2em] text-xl font-bold opacity-60 border-y-2 py-3 px-10"
                        style={{ borderColor: rgb(currentTheme.colors.border) }}
                    >
                        Milestone Reached
                    </div>
                    
                    <h2 
                        className="text-7xl font-black leading-none tracking-tight break-words w-full drop-shadow-sm line-clamp-3"
                        style={{ color: rgb(currentTheme.colors.text) }}
                    >
                        {activeMilestone.title}
                    </h2>
                    
                    <div 
                        className="px-8 py-4 rounded-xl border backdrop-blur-md shadow-lg mb-2"
                        style={{ backgroundColor: rgb(currentTheme.colors.card, 0.4), borderColor: rgb(currentTheme.colors.border) }}
                    >
                        <span className="font-mono text-4xl font-bold" style={{ color: rgb(currentTheme.colors.primary) }}>
                            {activeMilestone.date ? format(activeMilestone.date, 'MMMM do, yyyy') : 'Today'}
                        </span>
                    </div>

                    {renderCosmicStatsBlock('grid')}
                </div>
                
                <div className="absolute bottom-6 text-sm uppercase tracking-widest opacity-50 font-bold">
                     Calculated for {userProfile.name}
                </div>
            </div>
          );
      }

      // --- 2. MODERN TEMPLATE (Left Aligned) ---
      if (selectedTemplate === 'modern') {
          return (
             <div style={commonContainerStyles} className="flex flex-col justify-between p-16 text-left transition-colors duration-500">
                {bgPattern}
                
                {/* Top Section */}
                <div className="relative z-10 flex justify-between items-start w-full content-layer">
                     <div className="flex flex-col gap-2">
                        <div className="text-3xl font-bold opacity-60 uppercase tracking-widest">Milestone</div>
                        <div className="text-xl opacity-50">{format(new Date(), 'EEEE, MMMM do')}</div>
                     </div>
                     <div 
                        className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border-2"
                        style={{ borderColor: rgb(currentTheme.colors.border) }}
                     >
                        {avatarEl}
                     </div>
                </div>

                {/* Middle Section */}
                <div className="relative z-10 my-auto content-layer">
                    <div className="w-20 h-2 mb-8" style={{ backgroundColor: rgb(currentTheme.colors.primary) }}></div>
                    <h2 
                        className="text-[100px] font-black leading-[0.9] tracking-tighter mb-8 break-words w-full line-clamp-4"
                        style={{ color: rgb(currentTheme.colors.text) }}
                    >
                        {activeMilestone.title}
                    </h2>
                    <p className="text-3xl font-light opacity-80 max-w-3xl leading-snug">
                        {activeMilestone.description}
                    </p>
                </div>

                {/* Bottom Section */}
                <div className="relative z-10 w-full content-layer">
                     {showStats ? renderCosmicStatsBlock('row') : (
                        <div className="border-t-2 pt-8 flex justify-between items-end" style={{ borderColor: rgb(currentTheme.colors.text, 0.2) }}>
                            <div>
                                <div className="text-sm uppercase tracking-widest opacity-50 mb-1">Target Date</div>
                                <div className="text-5xl font-bold" style={{ color: rgb(currentTheme.colors.primary) }}>
                                    {activeMilestone.date ? format(activeMilestone.date, 'dd.MM.yyyy') : 'Today'}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold">{userProfile.name}</div>
                                <div className="opacity-50">Life Milestones App</div>
                            </div>
                        </div>
                     )}
                </div>
             </div>
          )
      }

      // --- 3. BOLD TEMPLATE (Big Typography) ---
      if (selectedTemplate === 'bold') {
          return (
              <div style={commonContainerStyles} className="flex flex-col items-center justify-center p-8 transition-colors duration-500">
                  <div className="absolute inset-0 opacity-50" style={{ background: rgb(currentTheme.colors.card) }}></div>
                  <div className="absolute -top-[20%] -right-[20%] w-[800px] h-[800px] rounded-full opacity-20 blur-3xl" style={{ backgroundColor: rgb(currentTheme.colors.primary) }}></div>
                  
                  <div className="relative z-10 border-4 w-full h-full flex flex-col justify-center items-center p-12 text-center content-layer" style={{ borderColor: rgb(currentTheme.colors.text) }}>
                      <div className="bg-skin-card px-8 py-2 -mt-10 mb-6 text-xl font-bold uppercase tracking-[0.3em] border shadow-sm" style={{ borderColor: rgb(currentTheme.colors.border), color: rgb(currentTheme.colors.primary) }}>
                          Achievement Unlocked
                      </div>

                      <h2 className="text-[110px] font-black uppercase leading-none mb-6 break-words w-full line-clamp-3" style={{ textShadow: `4px 4px 0px ${rgb(currentTheme.colors.muted, 0.4)}` }}>
                          {activeMilestone.title}
                      </h2>

                      <div className="flex items-center gap-6 mb-4">
                           <div className="text-right">
                               <div className="text-5xl font-bold">{activeMilestone.date ? format(activeMilestone.date, 'dd') : 'Now'}</div>
                               <div className="text-xl uppercase opacity-60">{activeMilestone.date ? format(activeMilestone.date, 'MMM') : ''}</div>
                           </div>
                           <div className="w-1 h-16 bg-current opacity-20"></div>
                           <div className="text-left text-xl font-medium max-w-xl opacity-90 line-clamp-2">
                               {activeMilestone.description}
                           </div>
                      </div>
                      
                      {renderCosmicStatsBlock('grid')}
                  </div>
              </div>
          )
      }

      // --- 4. MINIMAL TEMPLATE ---
      if (selectedTemplate === 'minimal') {
          return (
              <div style={commonContainerStyles} className="flex flex-col items-center p-20 transition-colors duration-500">
                  <div className="flex-1 flex flex-col items-center justify-center w-full content-layer">
                       <div className="w-24 h-24 rounded-full overflow-hidden mb-8 grayscale opacity-80">
                           {avatarEl}
                       </div>
                       
                       <h2 className="text-6xl font-light tracking-tighter text-center mb-6 w-full break-words">
                          {activeMilestone.title}
                       </h2>
                       
                       <div className="w-16 h-1 my-6" style={{ backgroundColor: rgb(currentTheme.colors.primary) }}></div>
                       
                       <p className="text-xl font-mono text-center opacity-60 max-w-2xl mb-4">
                           "{activeMilestone.description}"
                       </p>

                       <div className="font-mono text-3xl font-bold" style={{ color: rgb(currentTheme.colors.primary) }}>
                          {activeMilestone.date ? format(activeMilestone.date, 'yyyy.MM.dd') : 'Today'}
                      </div>

                       {renderCosmicStatsBlock('minimal')}
                  </div>
              </div>
          )
      }

      return null;
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-0 sm:p-4 animate-in fade-in duration-300 overflow-hidden"
        onClick={onClose}
    >
      <div 
        className="bg-skin-card/80 backdrop-blur-2xl w-full max-w-7xl rounded-none sm:rounded-3xl flex flex-col-reverse md:flex-row shadow-2xl h-full md:h-[90vh] border border-white/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* Left Controls - Glass */}
        <div className="p-6 w-full md:w-96 flex-shrink-0 border-t md:border-t-0 md:border-r border-skin-border/50 flex flex-col gap-5 bg-skin-base/40 overflow-y-auto scrollbar-hide overscroll-contain h-[45%] md:h-full z-20">
            {/* ... Controls code ... */}
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-skin-text flex items-center gap-2">
                    <Film className="w-5 h-5 text-skin-primary" />
                    Share Studio
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-skin-border/50 rounded-full transition-colors text-skin-muted hover:text-skin-text"><X size={20} /></button>
            </div>

            <div className="space-y-6">
                {/* 1. Content Selector */}
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

                {/* 2. Format Selector */}
                <div>
                    <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider">Output Format</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setFormatType('image')}
                            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-sm font-medium transition-all ${formatType === 'image' ? 'border-skin-primary bg-skin-primary/10 text-skin-primary ring-1 ring-skin-primary' : 'border-skin-border/50 hover:border-skin-muted/50 bg-skin-card/50'}`}
                        >
                            <ImageIcon size={24} /> 
                            <span>Image</span>
                        </button>
                         <button 
                            onClick={() => setFormatType('video')}
                            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-sm font-medium transition-all ${formatType === 'video' ? 'border-skin-primary bg-skin-primary/10 text-skin-primary ring-1 ring-skin-primary' : 'border-skin-border/50 hover:border-skin-muted/50 bg-skin-card/50'}`}
                        >
                            <Video size={24} /> 
                            <span>Video Loop</span>
                        </button>
                    </div>
                </div>

                 {/* 3. Design Template Selector */}
                 <div>
                    <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider flex items-center gap-2">
                        <LayoutTemplate size={12}/> Layout Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'classic', label: 'Classic', icon: AlignCenter },
                            { id: 'modern', label: 'Modern', icon: AlignLeft },
                            { id: 'bold', label: 'Bold', icon: Box },
                            { id: 'minimal', label: 'Minimal', icon: Type },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTemplate(t.id as TemplateType)}
                                className={`
                                    p-3 rounded-xl border flex items-center gap-3 transition-all backdrop-blur-sm
                                    ${selectedTemplate === t.id 
                                        ? 'border-skin-primary bg-skin-primary/10 text-skin-primary ring-1 ring-skin-primary' 
                                        : 'border-skin-border/50 bg-skin-card/50 hover:bg-skin-input/80 text-skin-text'}
                                `}
                            >
                                <t.icon size={16} />
                                <span className="text-xs font-bold">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3.5 Cosmic Stats Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-skin-border/50 bg-skin-card/50 backdrop-blur-sm">
                    <label className="text-xs font-bold text-skin-muted uppercase tracking-wider flex items-center gap-2 cursor-pointer" htmlFor="cosmic-toggle">
                        <Globe size={14}/> Show Cosmic Stats
                    </label>
                    <div 
                        className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${showStats ? 'bg-skin-primary' : 'bg-skin-input'}`}
                        onClick={() => setShowStats(!showStats)}
                        id="cosmic-toggle"
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${showStats ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                </div>
                
                {/* 4. Resolution Selector (Image Only) */}
                {formatType === 'image' && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                         <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider flex items-center gap-2">
                            <Monitor size={12}/> Resolution
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button 
                                onClick={() => setImageQuality('1080p')}
                                className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${imageQuality === '1080p' ? 'bg-skin-primary text-white border-skin-primary' : 'bg-skin-card/50 border-skin-border/50 hover:bg-skin-input/80'}`}
                            >
                                <Monitor size={14} /> 1080p
                            </button>
                            <button 
                                onClick={() => setImageQuality('4K')}
                                className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${imageQuality === '4K' ? 'bg-skin-primary text-white border-skin-primary' : 'bg-skin-card/50 border-skin-border/50 hover:bg-skin-input/80'}`}
                            >
                                <Gauge size={14} /> 4K
                            </button>
                            <button 
                                onClick={() => setImageQuality('Max')}
                                className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${imageQuality === 'Max' ? 'bg-skin-primary text-white border-skin-primary' : 'bg-skin-card/50 border-skin-border/50 hover:bg-skin-input/80'}`}
                            >
                                <Maximize size={14} /> Max
                            </button>
                        </div>
                    </div>
                )}

                {/* 5. Video Options (Conditional) */}
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
                                        className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${duration === s ? 'bg-skin-primary text-white border-skin-primary' : 'bg-skin-card/50 border-skin-border/50 hover:bg-skin-input/80'}`}
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
                                    className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-1 ${animStyle === 'particles' ? 'bg-skin-primary/10 border-skin-primary text-skin-primary' : 'bg-skin-card/50 border-skin-border/50'}`}
                                >
                                    <Sparkles size={16}/>
                                    <span className="text-[10px] font-bold">Particles</span>
                                </button>
                                <button 
                                    onClick={() => setAnimStyle('rolling')}
                                    className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-1 ${animStyle === 'rolling' ? 'bg-skin-primary/10 border-skin-primary text-skin-primary' : 'bg-skin-card/50 border-skin-border/50'}`}
                                >
                                    <Activity size={16}/>
                                    <span className="text-[10px] font-bold">Rolling</span>
                                </button>
                                <button 
                                    onClick={() => setAnimStyle('pulse')}
                                    className={`py-2 px-1 rounded-lg border flex flex-col items-center gap-1 ${animStyle === 'pulse' ? 'bg-skin-primary/10 border-skin-primary text-skin-primary' : 'bg-skin-card/50 border-skin-border/50'}`}
                                >
                                    <Move size={16}/>
                                    <span className="text-[10px] font-bold">Pulse</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. Aspect Ratio */}
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
                                className={`py-3 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all ${aspectRatio === r.id ? 'border-skin-primary bg-skin-primary text-white shadow-md' : 'border-skin-border/50 text-skin-muted hover:bg-skin-input/80 bg-skin-card/50'}`}
                            >
                                <r.icon size={18} />
                                <span className="text-[10px] font-bold">{r.id}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 7. Theme Selection */}
                <div>
                    <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider flex items-center gap-2">
                        <Palette size={12} /> Color Theme
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {Object.values(themes).map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveThemeId(t.id)}
                                className={`p-2 rounded-lg border text-left text-xs transition-all flex items-center gap-2 ${
                                    activeThemeId === t.id
                                        ? 'border-skin-primary ring-1 ring-skin-primary bg-skin-card/80'
                                        : 'border-skin-border/50 hover:bg-skin-input/50 bg-skin-base/30'
                                }`}
                            >
                                <div 
                                    className="w-4 h-4 rounded-full border shadow-sm flex-shrink-0" 
                                    style={{ background: `rgb(${t.colors.primary})` }}
                                />
                                <span className="truncate font-medium">{t.name}</span>
                                {userProfile.theme === t.id && (
                                    <span className="ml-auto text-[10px] bg-skin-input/50 px-1 rounded text-skin-muted">My</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-auto pt-6 border-t border-skin-border/30 space-y-3 pb-20 md:pb-0">
                <button 
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="w-full py-4 bg-skin-primary hover:bg-skin-primary/90 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-skin-primary/20 hover:shadow-xl active:scale-[0.98] backdrop-blur-sm"
                >
                    {isGenerating ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> : <Download size={20} />}
                    <span>Save to Device</span>
                </button>
                
                {formatType === 'image' && (
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={handleNativeShare}
                            disabled={isGenerating}
                            className="py-3 bg-skin-input/50 hover:bg-skin-border/50 text-skin-text rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-skin-border/20 backdrop-blur-sm"
                        >
                            <Share2 size={16} /> Share
                        </button>
                        <button 
                            onClick={handleCopyToClipboard}
                            disabled={isGenerating}
                            className="py-3 bg-skin-input/50 hover:bg-skin-border/50 text-skin-text rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-skin-border/20 backdrop-blur-sm"
                        >
                            <Copy size={16} /> Copy
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Right (Desktop) / Top (Mobile): Preview */}
        <div className="flex-1 bg-skin-input/50 relative flex flex-col h-[55%] md:h-full overflow-hidden">
            <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-gradient-to-b from-skin-input/80 to-transparent pointer-events-none">
                 <span className="bg-skin-card/80 backdrop-blur-md border border-skin-border/50 px-4 py-1.5 rounded-full text-[10px] font-bold text-skin-muted uppercase tracking-wider shadow-sm flex items-center gap-2">
                    <Check size={12} className="text-green-500"/> Live Preview
                 </span>
                 
                 <div className="pointer-events-auto flex items-center gap-2">
                     {/* Quick Snapshot Button (1.5x) */}
                     {formatType === 'image' && (
                         <button
                            onClick={handleQuickSnapshot}
                            disabled={isGenerating}
                            className="bg-skin-primary hover:bg-skin-primary/90 text-white p-2 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/20 active:scale-95"
                            title="Quick Save (1.5x)"
                         >
                            {isGenerating ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div> : <Download size={16} />}
                         </button>
                     )}

                     <button
                        onClick={() => setIsZoomed(!isZoomed)}
                        className="bg-black/40 hover:bg-black/60 text-white text-[10px] px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2 transition-colors border border-white/10"
                     >
                        {isZoomed ? <ZoomOut size={12} /> : <ZoomIn size={12} />}
                        <span>{isZoomed ? '100%' : `Fit ${(previewScale * 100).toFixed(0)}%`}</span>
                     </button>
                 </div>
            </div>
            
            <div 
                ref={previewContainerRef}
                className={`flex-1 w-full h-full flex ${isZoomed ? 'items-start justify-start overflow-auto p-8' : 'items-center justify-center overflow-hidden'} relative`}
            >
                {/* The Content Wrapper (Scaled for Preview) */}
                <div 
                    style={{
                        width: baseW,
                        height: baseH,
                        transform: isZoomed ? 'none' : `scale(${previewScale})`,
                        transformOrigin: 'center center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        flexShrink: 0 // Prevent shrinking in flex container when zoomed
                    }}
                    className="transition-transform duration-200 ease-out will-change-transform shadow-2xl"
                >
                    {formatType === 'image' ? (
                        <div ref={cardRef}>
                            {renderCardHTML()}
                        </div>
                    ) : (
                        <div className="w-full h-full bg-black">
                            <canvas ref={canvasRef} className="w-full h-full" />
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden Export Render (Off-Screen) for High Quality Capture */}
            {formatType === 'image' && (
                <div 
                    style={{ 
                        position: 'fixed', 
                        left: '-9999px', 
                        top: 0, 
                        width: baseW, 
                        height: baseH,
                        pointerEvents: 'none',
                    }}
                >
                    <div ref={exportRef} id="export-container" style={{ width: baseW, height: baseH }}>
                        {renderCardHTML()}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;