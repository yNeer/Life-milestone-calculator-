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

type TemplateType = 'classic' | 'modern' | 'bold' | 'minimal' | 'elegant' | 'poster' | 'bubble' | 'technical' | 'split';

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
  const [showFlash, setShowFlash] = useState(false);

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
                  // Apply a counter-slide (move UP) to specific text elements
                  const textNodes = clonedDoc.querySelectorAll('.text-shift, h2, p');
                  textNodes.forEach((node: any) => {
                      node.style.transform = 'translateY(-12px)';
                  });
              }
          }
      });
      return new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
  };

  const handleQuickSnapshot = () => {
      if (!cardRef.current) return;
      setIsGenerating(true);
      setShowFlash(true); // Trigger animation state

      // 1. Wait for 1 second animation to finish
      setTimeout(async () => {
          if (!cardRef.current) {
               setIsGenerating(false);
               setShowFlash(false);
               return;
          }

          try {
              // 2. Capture with html2canvas after animation at a fixed resolution
              const { w, h } = getBaseDimensions(); // Get target dimensions
              const canvas = await html2canvas(cardRef.current, {
                  width: w,
                  height: h,
                  useCORS: true,
                  allowTaint: true,
                  backgroundColor: null,
                  logging: false,
                  scrollX: 0,
                  scrollY: 0,
                  onclone: (clonedDoc) => {
                    // 3. Apply Counter-Translation in the cloned DOM (Invisible to user)
                    // This fixes the text drop issue specific to html2canvas
                    const textNodes = clonedDoc.querySelectorAll('.text-shift, h2, p');
                    textNodes.forEach((node: any) => {
                        node.style.transform = 'translateY(-12px)';
                    });
                  }
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
              setShowFlash(false);
          }
      }, 1000); // 1 Second Delay
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
                <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-2xl px-8 text-shift">
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
                  <div className="mt-12 text-center w-full max-w-3xl border-t border-dashed border-skin-border/30 pt-6 text-shift">
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
              <div className="mt-auto pt-6 w-full border-t border-skin-border/20 flex justify-between items-end text-sm opacity-80 text-shift">
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
                        className="uppercase tracking-[0.2em] text-xl font-bold opacity-60 border-y-2 py-3 px-10 text-shift"
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
                        className="px-8 py-4 rounded-xl border backdrop-blur-md shadow-lg mb-2 text-shift"
                        style={{ backgroundColor: rgb(currentTheme.colors.card, 0.4), borderColor: rgb(currentTheme.colors.border) }}
                    >
                        <span className="font-mono text-4xl font-bold" style={{ color: rgb(currentTheme.colors.primary) }}>
                            {activeMilestone.date ? format(activeMilestone.date, 'MMMM do, yyyy') : 'Today'}
                        </span>
                    </div>

                    {renderCosmicStatsBlock('grid')}
                </div>
                
                <div className="absolute bottom-6 text-sm uppercase tracking-widest opacity-50 font-bold text-shift">
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
                     <div className="flex flex-col gap-2 text-shift">
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
                        <div className="border-t-2 pt-8 flex justify-between items-end text-shift" style={{ borderColor: rgb(currentTheme.colors.text, 0.2) }}>
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
                      <div className="bg-skin-card px-8 py-2 -mt-10 mb-6 text-xl font-bold uppercase tracking-[0.3em] border shadow-sm text-shift" style={{ borderColor: rgb(currentTheme.colors.border), color: rgb(currentTheme.colors.primary) }}>
                          Achievement Unlocked
                      </div>

                      <h2 className="text-[110px] font-black uppercase leading-none mb-6 break-words w-full line-clamp-3" style={{ textShadow: `4px 4px 0px ${rgb(currentTheme.colors.muted, 0.4)}` }}>
                          {activeMilestone.title}
                      </h2>

                      <div className="flex items-center gap-6 mb-4 text-shift">
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

                       <div className="font-mono text-3xl font-bold text-shift" style={{ color: rgb(currentTheme.colors.primary) }}>
                          {activeMilestone.date ? format(activeMilestone.date, 'yyyy.MM.dd') : 'Today'}
                      </div>

                       {renderCosmicStatsBlock('minimal')}
                  </div>
              </div>
          )
      }

      // --- 5. ELEGANT TEMPLATE ---
      if (selectedTemplate === 'elegant') {
          return (
              <div style={commonContainerStyles} className="flex flex-col items-center justify-center p-12 transition-colors duration-500">
                  <div className="absolute inset-6 border-4 border-double pointer-events-none" style={{ borderColor: rgb(currentTheme.colors.text, 0.3) }}></div>
                  
                  <div className="relative z-10 flex flex-col items-center text-center max-w-3xl content-layer">
                      <div className="mb-8 p-1 rounded-full border border-skin-border">
                         <div className="w-16 h-16 rounded-full overflow-hidden grayscale">
                             {avatarEl}
                         </div>
                      </div>

                      <div className="font-serif italic text-2xl mb-4 opacity-70">The Milestone of</div>
                      
                      <h2 className="font-serif text-8xl font-bold leading-tight mb-8" style={{ color: rgb(currentTheme.colors.text) }}>
                          {activeMilestone.title}
                      </h2>
                      
                      <div className="w-24 h-px bg-current opacity-40 mb-8"></div>

                      <div className="text-lg font-medium tracking-wide mb-8 uppercase text-shift">
                           {activeMilestone.date ? format(activeMilestone.date, 'MMMM do, yyyy') : 'Today'}
                      </div>

                      {showStats ? (
                          <div className="grid grid-cols-3 gap-8 border-t border-skin-border/40 pt-8 text-shift">
                              <div>
                                  <div className="text-3xl font-serif">{stats.earthRotations.toLocaleString()}</div>
                                  <div className="text-[10px] uppercase tracking-widest opacity-50">Days</div>
                              </div>
                               <div>
                                  <div className="text-3xl font-serif">{stats.sunOrbits}</div>
                                  <div className="text-[10px] uppercase tracking-widest opacity-50">Years</div>
                              </div>
                               <div>
                                  <div className="text-3xl font-serif">{stats.hourHand.toLocaleString()}</div>
                                  <div className="text-[10px] uppercase tracking-widest opacity-50">Hours</div>
                              </div>
                          </div>
                      ) : null}
                  </div>
              </div>
          )
      }

      // --- 6. POSTER TEMPLATE ---
      if (selectedTemplate === 'poster') {
          return (
              <div style={commonContainerStyles} className="flex flex-col p-12 transition-colors duration-500">
                  <div className="flex-1 flex flex-col justify-center content-layer">
                      <div className="text-[15rem] leading-[0.8] font-black tracking-tighter opacity-10 absolute top-0 left-0 break-all select-none pointer-events-none">
                          {new Date().getFullYear()}
                      </div>
                      
                      <h2 
                          className="text-8xl font-black uppercase tracking-tight leading-[0.9] mb-4 z-10 mix-blend-overlay" 
                          style={{ color: rgb(currentTheme.colors.text) }}
                      >
                          {activeMilestone.title}
                      </h2>
                      
                      <div className="bg-skin-text text-skin-base p-6 w-fit max-w-2xl z-10 text-shift">
                          <p className="text-xl font-bold leading-tight">
                              {activeMilestone.description}
                          </p>
                      </div>
                  </div>

                  <div className="border-t-4 border-black pt-6 flex justify-between items-end content-layer text-shift" style={{ borderColor: rgb(currentTheme.colors.text) }}>
                       <div>
                           <div className="text-6xl font-bold" style={{ color: rgb(currentTheme.colors.primary) }}>
                               {activeMilestone.date ? format(activeMilestone.date, 'dd') : '00'}
                           </div>
                           <div className="text-xl font-bold uppercase">
                               {activeMilestone.date ? format(activeMilestone.date, 'MMM yyyy') : 'Now'}
                           </div>
                       </div>
                       
                       <div className="flex items-center gap-4">
                           <div className="text-right">
                               <div className="font-bold">{userProfile.name}</div>
                               <div className="text-xs opacity-60">Life Milestones</div>
                           </div>
                           <div className="w-12 h-12 bg-skin-card rounded-full overflow-hidden border-2 border-current">
                               {avatarEl}
                           </div>
                       </div>
                  </div>
              </div>
          )
      }

      // --- 7. BUBBLE TEMPLATE ---
      if (selectedTemplate === 'bubble') {
          return (
              <div style={commonContainerStyles} className="flex flex-col items-center justify-center p-8 transition-colors duration-500">
                   <div className="w-full h-full rounded-[3rem] p-8 flex flex-col items-center justify-between content-layer" style={{ backgroundColor: rgb(currentTheme.colors.card, 0.5) }}>
                        
                        <div className="flex items-center gap-2 bg-skin-base px-6 py-2 rounded-full border border-skin-border/50 shadow-sm text-shift">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm font-bold uppercase tracking-wide opacity-70">Milestone Unlocked</span>
                        </div>

                        <div className="text-center my-8">
                             <div className="w-32 h-32 mx-auto mb-6 rounded-[2rem] overflow-hidden shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500">
                                 {avatarEl}
                             </div>
                             <h2 className="text-7xl font-bold leading-tight mb-4" style={{ color: rgb(currentTheme.colors.text) }}>
                                 {activeMilestone.title}
                             </h2>
                             <div className="inline-block px-6 py-3 bg-skin-primary text-white rounded-2xl font-mono text-xl text-shift">
                                 {activeMilestone.date ? format(activeMilestone.date, 'dd.MM.yyyy') : 'Today'}
                             </div>
                        </div>

                        {showStats ? (
                            <div className="flex gap-3 w-full text-shift">
                                <div className="flex-1 bg-skin-base p-4 rounded-3xl text-center border border-skin-border/20">
                                    <div className="text-2xl font-bold">{stats.earthRotations.toLocaleString()}</div>
                                    <div className="text-[10px] opacity-50 uppercase font-bold">Days</div>
                                </div>
                                <div className="flex-1 bg-skin-base p-4 rounded-3xl text-center border border-skin-border/20">
                                    <div className="text-2xl font-bold">{stats.hourHand.toLocaleString()}</div>
                                    <div className="text-[10px] opacity-50 uppercase font-bold">Hours</div>
                                </div>
                            </div>
                        ) : null}
                   </div>
              </div>
          )
      }

      // --- 8. TECHNICAL TEMPLATE ---
      if (selectedTemplate === 'technical') {
          return (
              <div style={commonContainerStyles} className="p-8 font-mono transition-colors duration-500 flex flex-col">
                  {/* Corners */}
                  <div className="absolute top-8 left-8 w-4 h-4 border-t-2 border-l-2 border-current"></div>
                  <div className="absolute top-8 right-8 w-4 h-4 border-t-2 border-r-2 border-current"></div>
                  <div className="absolute bottom-8 left-8 w-4 h-4 border-b-2 border-l-2 border-current"></div>
                  <div className="absolute bottom-8 right-8 w-4 h-4 border-b-2 border-r-2 border-current"></div>

                  <div className="flex-1 border border-dashed border-opacity-30 border-current m-4 p-8 flex flex-col justify-center relative content-layer">
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-skin-base px-4 text-xs tracking-widest opacity-60">
                           SYSTEM NOTIFICATION
                       </div>

                       <div className="flex items-start gap-6 mb-8">
                           <div className="w-24 h-24 border border-current p-1">
                               {avatarEl}
                           </div>
                           <div className="flex-1 space-y-2 text-shift">
                               <div className="flex justify-between border-b border-current border-opacity-20 pb-1">
                                   <span className="opacity-50">USER_ID</span>
                                   <span className="font-bold">{userProfile.name}</span>
                               </div>
                               <div className="flex justify-between border-b border-current border-opacity-20 pb-1">
                                   <span className="opacity-50">EVENT_DATE</span>
                                   <span className="font-bold">{activeMilestone.date ? format(activeMilestone.date, 'yyyy-MM-dd') : 'N/A'}</span>
                               </div>
                               <div className="flex justify-between border-b border-current border-opacity-20 pb-1">
                                   <span className="opacity-50">STATUS</span>
                                   <span className="font-bold text-green-500">CONFIRMED</span>
                               </div>
                           </div>
                       </div>

                       <h2 className="text-5xl font-bold mb-4 uppercase tracking-tighter" style={{ color: rgb(currentTheme.colors.primary) }}>
                           {activeMilestone.title}
                       </h2>
                       <p className="text-lg opacity-70 mb-8 border-l-4 pl-4 border-current">
                           {activeMilestone.description}
                       </p>

                       {showStats && (
                           <div className="grid grid-cols-4 gap-2 text-xs border-t border-current border-opacity-20 pt-4 text-shift">
                               <div>
                                   <div className="opacity-50">ROTATIONS</div>
                                   <div>{stats.earthRotations}</div>
                               </div>
                               <div>
                                   <div className="opacity-50">ORBITS</div>
                                   <div>{stats.sunOrbits}</div>
                               </div>
                               <div>
                                   <div className="opacity-50">HOURS</div>
                                   <div>{stats.hourHand}</div>
                               </div>
                               <div>
                                   <div className="opacity-50">MINUTES</div>
                                   <div>{stats.minuteHand}</div>
                               </div>
                           </div>
                       )}
                  </div>
              </div>
          )
      }

      // --- 9. SPLIT TEMPLATE ---
      if (selectedTemplate === 'split') {
          return (
              <div style={commonContainerStyles} className="flex flex-col transition-colors duration-500">
                  <div className="h-1/2 w-full relative overflow-hidden" style={{ backgroundColor: rgb(currentTheme.colors.card) }}>
                       <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `linear-gradient(45deg, ${rgb(currentTheme.colors.primary)} 25%, transparent 25%, transparent 50%, ${rgb(currentTheme.colors.primary)} 50%, ${rgb(currentTheme.colors.primary)} 75%, transparent 75%, transparent)` , backgroundSize: '20px 20px'}}></div>
                       <div className="flex items-center justify-center h-full content-layer">
                           <h2 className="text-7xl font-black text-center px-12 z-10" style={{ color: rgb(currentTheme.colors.text) }}>
                               {activeMilestone.title}
                           </h2>
                       </div>
                  </div>
                  
                  <div className="h-1/2 w-full relative flex flex-col items-center justify-center text-center p-12" style={{ backgroundColor: rgb(currentTheme.colors.primary), color: '#ffffff' }}>
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-8 border-white overflow-hidden shadow-lg content-layer">
                           {avatarEl}
                       </div>

                       <div className="mt-12 content-layer text-shift">
                            <p className="text-2xl font-medium opacity-90 mb-2">
                                {activeMilestone.description}
                            </p>
                            <div className="font-mono text-lg opacity-70">
                                {activeMilestone.date ? format(activeMilestone.date, 'MMMM do, yyyy') : 'Today'}
                            </div>
                       </div>
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
        <div className="w-full md:w-96 flex-shrink-0 border-t md:border-t-0 md:border-r border-skin-border/50 flex flex-col bg-skin-base/40 h-[45%] md:h-full z-20">
            
            {/* Header */}
            <div className="flex-shrink-0 p-6 pb-2 flex justify-between items-center">
                <h3 className="font-bold text-lg text-skin-text flex items-center gap-2">
                    <Film className="w-5 h-5 text-skin-primary" />
                    Share Studio
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-skin-border/50 rounded-full transition-colors text-skin-muted hover:text-skin-text"><X size={20} /></button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6 custom-scrollbar">
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

                 {/* 3. Design Template Selector (Visual Grid) */}
                 <div>
                    <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider flex items-center gap-2">
                        <LayoutTemplate size={12}/> Layout Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { 
                                id: 'classic', 
                                label: 'Classic', 
                                renderPreview: () => (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                                        <div className="w-6 h-6 rounded-full bg-current opacity-20 mb-1" />
                                        <div className="w-12 h-1 bg-current opacity-40 rounded" />
                                        <div className="w-8 h-1 bg-current opacity-30 rounded" />
                                    </div>
                                )
                            },
                            { 
                                id: 'modern', 
                                label: 'Modern',
                                renderPreview: () => (
                                    <div className="w-full h-full flex items-center justify-between p-2 gap-2">
                                        <div className="flex-1 flex flex-col gap-1">
                                            <div className="w-full h-1 bg-current opacity-40 rounded" />
                                            <div className="w-3/4 h-1 bg-current opacity-30 rounded" />
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-current opacity-20" />
                                    </div>
                                )
                            },
                            { 
                                id: 'bold', 
                                label: 'Bold',
                                renderPreview: () => (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-2 border-2 border-current border-opacity-20 relative">
                                        <div className="w-full h-4 bg-current opacity-80 mb-1" />
                                        <div className="w-2/3 h-4 bg-current opacity-60" />
                                    </div>
                                )
                            },
                            { 
                                id: 'minimal', 
                                label: 'Minimal',
                                renderPreview: () => (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-2">
                                        <div className="w-4 h-4 rounded-full bg-current opacity-10 mb-2 grayscale" />
                                        <div className="w-16 h-px bg-current opacity-20 mb-1" />
                                        <div className="w-10 h-1 bg-current opacity-40 rounded-sm" />
                                    </div>
                                )
                            },
                            { 
                                id: 'elegant', 
                                label: 'Elegant',
                                renderPreview: () => (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-2 border-2 border-double border-current border-opacity-30 m-1">
                                        <div className="w-2 h-2 rounded-full bg-current opacity-40 mb-1" />
                                        <div className="w-12 h-px bg-current opacity-60" />
                                    </div>
                                )
                            },
                            { 
                                id: 'poster', 
                                label: 'Poster',
                                renderPreview: () => (
                                    <div className="w-full h-full flex flex-col p-2">
                                        <div className="flex-1 w-full bg-current opacity-20 mb-1" />
                                        <div className="w-full h-2 bg-current opacity-80" />
                                    </div>
                                )
                            },
                            { 
                                id: 'bubble', 
                                label: 'Bubble',
                                renderPreview: () => (
                                    <div className="w-full h-full flex items-center justify-center p-2">
                                        <div className="w-full h-full rounded-2xl border border-current border-opacity-30 flex items-center justify-center">
                                            <div className="w-8 h-2 bg-current opacity-50 rounded-full" />
                                        </div>
                                    </div>
                                )
                            },
                            { 
                                id: 'technical', 
                                label: 'Tech',
                                renderPreview: () => (
                                    <div className="w-full h-full flex flex-col justify-between p-2 border border-dashed border-current border-opacity-40">
                                        <div className="flex justify-between w-full">
                                            <div className="w-2 h-2 border-t border-l border-current" />
                                            <div className="w-2 h-2 border-t border-r border-current" />
                                        </div>
                                        <div className="w-full h-px bg-current opacity-20" />
                                        <div className="flex justify-between w-full">
                                            <div className="w-2 h-2 border-b border-l border-current" />
                                            <div className="w-2 h-2 border-b border-r border-current" />
                                        </div>
                                    </div>
                                )
                            },
                            { 
                                id: 'split', 
                                label: 'Split',
                                renderPreview: () => (
                                    <div className="w-full h-full flex flex-col">
                                        <div className="h-1/2 w-full bg-current opacity-10" />
                                        <div className="h-1/2 w-full bg-current opacity-80 flex items-center justify-center">
                                            <div className="w-4 h-4 rounded-full bg-white opacity-50 border border-current -mt-4" />
                                        </div>
                                    </div>
                                )
                            },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTemplate(t.id as TemplateType)}
                                className={`
                                    h-20 rounded-xl border flex flex-col items-center justify-center transition-all backdrop-blur-sm relative overflow-hidden
                                    ${selectedTemplate === t.id 
                                        ? 'border-skin-primary bg-skin-primary/10 text-skin-primary ring-1 ring-skin-primary shadow-sm' 
                                        : 'border-skin-border/50 bg-skin-card/50 hover:bg-skin-input/80 text-skin-muted hover:text-skin-text'}
                                `}
                            >
                                <div className="absolute inset-0 opacity-50 p-1 pointer-events-none">
                                    {t.renderPreview()}
                                </div>
                                <span className={`absolute bottom-1 right-2 text-[10px] font-bold uppercase tracking-wider bg-skin-card/80 px-1 rounded backdrop-blur-md ${selectedTemplate === t.id ? 'text-skin-primary' : 'text-skin-muted'}`}>
                                    {t.label}
                                </span>
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
            <div className="flex-shrink-0 p-6 pt-4 border-t border-skin-border/30 bg-skin-card/30 backdrop-blur-md space-y-3 pb-8 md:pb-6">
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
                            className="bg-skin-primary hover:bg-skin-primary/90 text-white py-1.5 px-3 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/20 active:scale-95 relative overflow-hidden flex items-center gap-2"
                            title="Quick Save (1080p)"
                         >
                            {isGenerating ? (
                                <div className="w-4 h-4 flex items-center justify-center text-[8px] font-bold animate-pulse">
                                    ...
                                </div>
                            ) : (
                                <>
                                  <Download size={14} />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">Quick Save</span>
                                </>
                            )}
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
                {/* Shutter Flash Animation Overlay */}
                <div 
                    className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity ease-out ${showFlash ? 'opacity-100 duration-75' : 'opacity-0 duration-1000'}`}
                />

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