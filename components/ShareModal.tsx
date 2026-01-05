import React, { useRef, useState, useEffect } from 'react';
import { X, Download, Video, Image as ImageIcon, Check, Film, Zap, Monitor, Globe, Gamepad2, Activity, Play, Square, Instagram, Smartphone } from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { Milestone, UserProfile } from '../types';
import { format } from 'date-fns';
import { themes } from '../utils/themes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  text: string;
  milestone?: Milestone;
  userProfile: UserProfile;
  cardType?: 'milestone' | 'age' | 'progress' | 'zodiac' | 'clock';
  extraData?: any; 
}

type ExportFormat = 'png' | 'pdf' | 'svg' | 'webm';
type VideoStyle = 'cinematic' | 'neon' | 'minimal' | 'cosmic' | 'retro';

const VIDEO_STYLES: { id: VideoStyle; label: string; icon: any; desc: string }[] = [
    { id: 'cinematic', label: 'Cinematic', icon: Film, desc: 'Dark, moody, gold particles' },
    { id: 'neon', label: 'Neon Cyber', icon: Zap, desc: 'Glowing grid, glitch text' },
    { id: 'minimal', label: 'Clean Air', icon: Monitor, desc: 'White, crisp, modern typography' },
    { id: 'cosmic', label: 'Stardust', icon: Globe, desc: 'Deep space, orbiting stars' },
    { id: 'retro', label: 'Retro Vibe', icon: Gamepad2, desc: '80s Grid, VHS warmth' },
];

const ShareModal: React.FC<Props> = ({ 
    isOpen, onClose, title, text, milestone, userProfile, 
    cardType = 'milestone', extraData = {} 
}) => {
  // --- State ---
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '9:16'>('9:16'); 
  const [formatType, setFormatType] = useState<'image' | 'video'>(cardType === 'age' ? 'video' : 'image');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [videoStyle, setVideoStyle] = useState<VideoStyle>('cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoDuration, setVideoDuration] = useState<5 | 10 | 15>(10);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | undefined>(milestone);
  
  // Preview Scaling
  const [previewScale, setPreviewScale] = useState(1);

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);      
  const exportRef = useRef<HTMLDivElement>(null);    
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const avatarImgRef = useRef<HTMLImageElement | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- Helpers ---

  const getBaseDimensions = () => {
      const w = 1080;
      let h = 1080;
      if (aspectRatio === '4:5') h = 1350;
      if (aspectRatio === '9:16') h = 1920;
      return { w, h };
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
          earthRotations: Math.floor(totalDays), 
          sunOrbits: (totalDays / 365.2422).toFixed(2), 
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

  // --- Video Generation Logic (Canvas) ---

  const easeOutExpo = (x: number): number => {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  };
  const easeOutBack = (x: number): number => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  };

  const handleGenerateVideo = async () => {
      setIsGenerating(true);
      const canvas = videoCanvasRef.current;
      if (!canvas) return;

      const { w, h } = getBaseDimensions();
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Stats
      const ageStats = (extraData as any) || {};
      const { 
          years = 0, months = 0, weeks = 0, days = 0, 
          hours = 0, minutes = 0, seconds = 0 
      } = ageStats;

      const statItems = [
          { label: 'Years', value: years, delayPct: 0.15 },
          { label: 'Months', value: months, delayPct: 0.25 },
          { label: 'Weeks', value: weeks, delayPct: 0.35 },
          { label: 'Days', value: days, delayPct: 0.45 },
          { label: 'Hours', value: hours, delayPct: 0.55 },
          { label: 'Minutes', value: minutes, delayPct: 0.65 },
          // Seconds is special (Main Finale)
      ];

      // Setup Recorder
      const stream = canvas.captureStream(60); // 60 FPS
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8000000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = generateFilename('webm');
          a.click();
          URL.revokeObjectURL(url);
          setIsGenerating(false);
      };

      recorder.start();

      // Animation Constants
      const fps = 60;
      const totalFrames = videoDuration * fps;
      
      // Particle System
      const particles = Array.from({ length: 70 }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          speedY: Math.random() * 2 - 1,
          speedX: Math.random() * 2 - 1,
          size: Math.random() * 4,
          alpha: Math.random() * 0.5,
          offset: Math.random() * 100
      }));

      // --- Render Loop ---
      let frame = 0;

      const renderFrame = () => {
          if (frame >= totalFrames) {
              recorder.stop();
              return;
          }

          // Clear & Background
          ctx.clearRect(0,0,w,h);
          ctx.save();
          
          // --- 1. Background Styles ---
          if (videoStyle === 'cinematic') {
              const grad = ctx.createLinearGradient(0, 0, w, h);
              grad.addColorStop(0, '#0f172a');
              grad.addColorStop(1, '#020617');
              ctx.fillStyle = grad;
              ctx.fillRect(0, 0, w, h);
              
              particles.forEach(p => {
                  p.y -= 0.5;
                  if (p.y < 0) p.y = h;
                  ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha * 0.6})`;
                  ctx.beginPath();
                  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                  ctx.fill();
              });
          } 
          else if (videoStyle === 'neon') {
               ctx.fillStyle = '#050505';
               ctx.fillRect(0, 0, w, h);
               
               ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)';
               ctx.lineWidth = 2;
               const gridSize = 100;
               const offset = (frame * 2) % gridSize;
               for (let i = 0; i <= w; i += gridSize) {
                   ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
               }
               for (let i = offset; i <= h; i += gridSize) {
                    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
               }
          }
          else if (videoStyle === 'minimal') {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, w, h);
              const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w);
              grad.addColorStop(0, 'rgba(79, 70, 229, 0.05)');
              grad.addColorStop(1, 'rgba(255,255,255,0)');
              ctx.fillStyle = grad;
              ctx.fillRect(0,0,w,h);
          }
          else if (videoStyle === 'cosmic') {
              const grad = ctx.createRadialGradient(w/2, h/2, 100, w/2, h/2, h);
              grad.addColorStop(0, '#1e1b4b');
              grad.addColorStop(1, '#000000');
              ctx.fillStyle = grad;
              ctx.fillRect(0,0,w,h);
              particles.forEach(p => {
                  ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
                  ctx.beginPath();
                  ctx.arc(p.x, p.y, p.size * (Math.sin((frame + p.offset)*0.05) + 1.5), 0, Math.PI * 2);
                  ctx.fill();
              });
          }
          else if (videoStyle === 'retro') {
              const grad = ctx.createLinearGradient(0,0,0,h);
              grad.addColorStop(0, '#2a0a2e');
              grad.addColorStop(1, '#0f041a');
              ctx.fillStyle = grad;
              ctx.fillRect(0,0,w,h);
              const sunY = h * 0.7;
              const sunGrad = ctx.createLinearGradient(0, sunY - 200, 0, sunY + 200);
              sunGrad.addColorStop(0, '#fbbf24');
              sunGrad.addColorStop(1, '#db2777');
              ctx.fillStyle = sunGrad;
              ctx.beginPath();
              ctx.arc(w/2, sunY, 400, 0, Math.PI, true);
              ctx.fill();
              ctx.fillStyle = 'rgba(0,0,0,0.2)';
              for(let i=0; i<h; i+=6) ctx.fillRect(0,i,w,3);
          }
          ctx.restore();

          // --- 2. Title Entrance (First 10-15%) ---
          const titleEnterEnd = 0.15;
          const titleFrames = totalFrames * titleEnterEnd;
          const titleAlpha = frame < titleFrames 
            ? easeOutBack(frame/titleFrames)
            : 1;
            
          const titleY = 100 - (100 * titleAlpha);

          ctx.save();
          ctx.globalAlpha = Math.min(titleAlpha, 1);
          ctx.translate(w/2, 150 + titleY);
          
          if (videoStyle === 'minimal') ctx.fillStyle = '#0f172a';
          else if (videoStyle === 'retro') ctx.fillStyle = '#fcd34d';
          else ctx.fillStyle = '#fff';

          ctx.textAlign = 'center';
          ctx.font = '800 50px Inter';
          ctx.fillText("TOTAL EXISTENCE", 0, 0);
          
          // Subtitle (Name)
          ctx.font = '600 24px Inter';
          ctx.globalAlpha = Math.min(titleAlpha * 0.7, 1);
          ctx.fillText(userProfile.name.toUpperCase(), 0, 40);
          ctx.restore();

          // --- 3. Grid of Stats (One by One) ---
          // Layout Config
          const gridStartX = w * 0.15;
          const gridStartY = 350;
          const gridGapX = w * 0.1;
          const gridGapY = 60;
          const colWidth = (w - (gridStartX * 2) - gridGapX) / 2;

          statItems.forEach((item, idx) => {
              const startFrame = totalFrames * item.delayPct;
              const animDuration = 40; // frames to fully enter
              
              if (frame >= startFrame) {
                  let localProgress = (frame - startFrame) / animDuration;
                  if (localProgress > 1) localProgress = 1;
                  const ease = easeOutBack(localProgress);
                  const opacity = localProgress;

                  const col = idx % 2;
                  const row = Math.floor(idx / 2);
                  
                  const x = gridStartX + (col * (colWidth + gridGapX)) + (colWidth/2); // Center of box
                  const y = gridStartY + (row * (120 + gridGapY));

                  // Rolling Number
                  const rolledValue = Math.floor(item.value * easeOutExpo(localProgress));

                  ctx.save();
                  ctx.translate(x, y + (50 * (1 - ease)));
                  ctx.globalAlpha = opacity;
                  ctx.scale(ease, ease);

                  // Box Background (Glass)
                  if (videoStyle !== 'minimal') {
                      ctx.fillStyle = 'rgba(255,255,255,0.05)';
                      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                      if (videoStyle === 'neon') ctx.strokeStyle = '#d946ef';
                      
                      // Draw rounded rect
                      const boxW = colWidth;
                      const boxH = 120;
                      drawRoundedRect(ctx, -boxW/2, -boxH/2, boxW, boxH, 20);
                      ctx.fill();
                      ctx.stroke();
                  }

                  // Label
                  ctx.textAlign = 'center';
                  ctx.font = '700 16px Inter';
                  if (videoStyle === 'minimal') ctx.fillStyle = '#64748b';
                  else ctx.fillStyle = 'rgba(255,255,255,0.6)';
                  ctx.fillText(item.label.toUpperCase(), 0, -15);

                  // Value
                  ctx.font = '900 40px Inter';
                  if (videoStyle === 'minimal') ctx.fillStyle = '#0f172a';
                  else if (videoStyle === 'neon') {
                      ctx.fillStyle = '#fff';
                      ctx.shadowColor = '#d946ef'; ctx.shadowBlur = 10;
                  }
                  else if (videoStyle === 'retro') ctx.fillStyle = '#00f3ff';
                  else ctx.fillStyle = '#fff';
                  
                  ctx.fillText(rolledValue.toLocaleString(), 0, 35);

                  ctx.restore();
              }
          });

          // --- 4. The Finale: Seconds (75% onwards) ---
          const secStartPct = 0.75;
          const secStartFrame = totalFrames * secStartPct;
          
          if (frame >= secStartFrame) {
              const localProgress = Math.min((frame - secStartFrame) / 60, 1);
              const ease = easeOutBack(localProgress);
              
              // Rolling Seconds
              const rolledSeconds = Math.floor(seconds * easeOutExpo(localProgress));

              // Heartbeat (72 BPM)
              const beatFrames = 50;
              const beatPhase = (frame % beatFrames) / beatFrames;
              let pulse = 1;
              if (beatPhase < 0.2) pulse = 1 + Math.sin(beatPhase * Math.PI * 5) * 0.1;
              
              const finalY = h - 350;

              ctx.save();
              ctx.translate(w/2, finalY);
              ctx.scale(ease, ease);
              ctx.globalAlpha = localProgress;

              // Heart Icon
              ctx.save();
              ctx.translate(0, -120);
              ctx.scale(2 * pulse, 2 * pulse);
              const heartColor = videoStyle === 'neon' ? '#ec4899' : '#f43f5e';
              ctx.fillStyle = heartColor;
              ctx.shadowColor = heartColor;
              ctx.shadowBlur = 30;
              const p = new Path2D("M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z");
              ctx.translate(-12, -12); 
              ctx.fill(p);
              ctx.restore();

              // Big Number
              ctx.font = '900 100px Inter';
              if (videoStyle === 'minimal') ctx.fillStyle = '#0f172a';
              else ctx.fillStyle = '#ffffff';
              ctx.textAlign = 'center';
              ctx.shadowBlur = 0;
              
              ctx.fillText(rolledSeconds.toLocaleString(), 0, 50);

              // Label
              ctx.font = '700 24px Inter';
              if (videoStyle === 'minimal') ctx.fillStyle = '#64748b';
              else ctx.fillStyle = 'rgba(255,255,255,0.7)';
              ctx.fillText("SECONDS ALIVE", 0, 100);

              ctx.restore();
          }

          frame++;
          requestAnimationFrame(renderFrame);
      };

      requestAnimationFrame(renderFrame);
  };

  // --- Image Handling ---

  const getHtmlToImageConfig = async (w: number, h: number, pixelRatio: number) => {
      const fontUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
      let fontEmbedCSS = '';
      try {
          const res = await fetch(fontUrl);
          fontEmbedCSS = await res.text();
      } catch (e) { console.warn("Font fetch failed", e); }

      const filter = (node: any) => {
          if (node.tagName === 'LINK' && node.href && node.href.includes('fonts.googleapis.com')) return false;
          return true;
      };

      return { width: w, height: h, pixelRatio, style: { transform: 'none' }, fontEmbedCSS, filter, cacheBust: true };
  };

  const handleDownloadImage = async () => {
    setIsGenerating(true);
    const targetRef = exportRef.current;
    if (!targetRef) return;
    
    try {
        const { w, h } = getBaseDimensions();
        const config = await getHtmlToImageConfig(w, h, 2); // 2x Pixel Ratio for sharpness

        if (exportFormat === 'pdf') {
            const pngDataUrl = await htmlToImage.toPng(targetRef, config);
            const pdf = new jsPDF({ orientation: h > w ? 'p' : 'l', unit: 'px', format: [w, h] });
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
        alert("Export failed.");
    } finally {
        setIsGenerating(false);
    }
  };

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
  };

  // --- Renderers ---

  const renderCardHTML = () => {
      const commonContainerStyles = {
          width: '100%',
          height: '100%',
          position: 'relative' as const,
          overflow: 'hidden',
          backgroundColor: themes[userProfile.theme].colors.base,
          color: themes[userProfile.theme].colors.text,
      };
      
      // --- TOTAL EXISTENCE (AGE) ---
      if (cardType === 'age') {
          const ageStats = (extraData as any) || {};
          return (
              <div style={{ ...commonContainerStyles, background: '#0f172a', color: '#fff' }} className="flex flex-col items-center justify-center p-12 relative">
                   {/* Cinematic Background */}
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-rose-950 opacity-100"></div>
                   {/* Grid Pattern */}
                   <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                   
                   {/* Content */}
                   <div className="relative z-10 flex flex-col items-center text-center gap-8">
                        <div className="flex items-center gap-3 bg-white/10 px-5 py-2 rounded-full border border-white/10 backdrop-blur-md">
                            <Activity className="text-rose-500 animate-pulse" size={24} />
                            <span className="text-lg font-bold tracking-widest uppercase">Total Existence</span>
                        </div>

                        <div>
                            <h1 className="text-[10rem] font-black leading-none tracking-tighter drop-shadow-2xl">
                                {(ageStats.years || 0)}
                            </h1>
                            <div className="text-3xl font-bold text-rose-500 uppercase tracking-[0.5em] mt-2">Years On Earth</div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 w-full max-w-2xl mt-8">
                             <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                                <div className="text-4xl font-mono font-black">{(ageStats.days || 0).toLocaleString()}</div>
                                <div className="text-xs uppercase font-bold opacity-60 tracking-wider">Days Lived</div>
                             </div>
                             <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                                <div className="text-4xl font-mono font-black">{(ageStats.seconds || 0).toLocaleString()}</div>
                                <div className="text-xs uppercase font-bold opacity-60 tracking-wider">Seconds Lived</div>
                             </div>
                        </div>

                        <div className="mt-12 opacity-50 font-bold uppercase tracking-widest text-sm">
                            Life Timeline of {userProfile.name}
                        </div>
                   </div>
              </div>
          );
      }

      // --- PROGRESS / ZODIAC / CLOCK (Simplified for brevity) ---
      if (cardType === 'progress' || cardType === 'zodiac') {
           // Reuse logic for standard cards (omitted for brevity, default render below)
           return (
              <div style={commonContainerStyles} className="flex flex-col items-center justify-center p-10">
                  <h1 className="text-6xl font-black">{title}</h1>
                  <p className="text-2xl mt-4 opacity-80">{text}</p>
              </div>
           )
      }

      // --- MILESTONE CARD ---
      const activeMilestone = selectedMilestone || { title, description: text, date: new Date(), value: 0, unit: '', isPast: false, id: 'temp', category: 'Custom' as any, color: '#fff' };
      const showStats = true;
      
      return (
        <div style={commonContainerStyles} className="flex flex-col items-center justify-center text-center p-12">
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
             <div className="relative z-10 max-w-4xl">
                 <div className="text-2xl font-bold uppercase tracking-[0.3em] opacity-60 mb-8 border-b-2 inline-block pb-2 border-current">
                    Milestone Unlocked
                 </div>
                 <h1 className="text-7xl font-black leading-tight mb-8 break-words drop-shadow-sm">{activeMilestone.title}</h1>
                 <div className="inline-block px-8 py-4 rounded-2xl border-2 border-current backdrop-blur-md bg-white/10">
                     <div className="text-4xl font-bold font-mono">
                         {activeMilestone.date ? format(activeMilestone.date, 'MMMM do, yyyy') : 'Today'}
                     </div>
                 </div>
                 {showStats && (
                     <div className="mt-12 grid grid-cols-2 gap-8 text-left opacity-80">
                         <div>
                             <div className="text-xs uppercase font-bold opacity-60">Earth Rotations</div>
                             <div className="text-2xl font-bold">{calculateCosmicStats(activeMilestone.date).earthRotations.toLocaleString()}</div>
                         </div>
                         <div>
                             <div className="text-xs uppercase font-bold opacity-60">Sun Orbits</div>
                             <div className="text-2xl font-bold">{calculateCosmicStats(activeMilestone.date).sunOrbits}</div>
                         </div>
                     </div>
                 )}
             </div>
        </div>
      );
  };

  // --- Main Render ---

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
                
                {/* Format Toggle */}
                <div>
                    <label className="text-xs font-bold text-skin-muted uppercase mb-3 block tracking-wider">Output Format</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <button onClick={() => setFormatType('image')} className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-sm font-medium transition-all ${formatType === 'image' ? 'border-skin-primary bg-skin-primary/10 text-skin-primary ring-1 ring-skin-primary' : 'border-skin-border/50 hover:border-skin-muted/50 bg-skin-card/50'}`}>
                            <ImageIcon size={24} /> <span>Image</span>
                        </button>
                        <button onClick={() => setFormatType('video')} className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-sm font-medium transition-all ${formatType === 'video' ? 'border-skin-primary bg-skin-primary/10 text-skin-primary ring-1 ring-skin-primary' : 'border-skin-border/50 hover:border-skin-muted/50 bg-skin-card/50'}`}>
                            <Video size={24} /> <span>Video</span>
                        </button>
                    </div>

                    {/* Image Options */}
                    {formatType === 'image' && (
                        <div className="grid grid-cols-3 gap-2">
                            {(['png', 'pdf', 'svg'] as const).map(fmt => (
                                <button key={fmt} onClick={() => setExportFormat(fmt)} className={`py-2 px-2 rounded-lg border text-xs font-bold uppercase transition-all ${exportFormat === fmt ? 'bg-skin-primary text-white border-skin-primary' : 'bg-skin-card/50 border-skin-border/50 hover:bg-skin-input/80'}`}>{fmt}</button>
                            ))}
                        </div>
                    )}

                    {/* Video Options (Styles) */}
                    {formatType === 'video' && (
                         <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-skin-muted uppercase block mb-2">Video Style</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {VIDEO_STYLES.map(style => (
                                        <button 
                                            key={style.id}
                                            onClick={() => setVideoStyle(style.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${videoStyle === style.id ? 'bg-skin-primary text-white border-skin-primary' : 'bg-skin-card/50 border-skin-border/50 hover:bg-skin-input/50'}`}
                                        >
                                            <div className={`p-2 rounded-lg ${videoStyle === style.id ? 'bg-white/20' : 'bg-skin-input'}`}>
                                                <style.icon size={18} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold">{style.label}</div>
                                                <div className={`text-[10px] ${videoStyle === style.id ? 'text-white/70' : 'text-skin-muted'}`}>{style.desc}</div>
                                            </div>
                                            {videoStyle === style.id && <Check size={16} className="ml-auto" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-skin-muted uppercase mb-2 block">Duration</label>
                                <div className="flex gap-2">
                                    {[5, 10, 15].map(d => (
                                        <button key={d} onClick={() => setVideoDuration(d as any)} className={`flex-1 py-1 rounded-lg border text-xs font-bold transition-all ${videoDuration === d ? 'bg-skin-primary text-white' : 'bg-skin-card/50'}`}>{d}s</button>
                                    ))}
                                </div>
                            </div>
                         </div>
                    )}
                </div>

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
                <button 
                    onClick={formatType === 'video' ? handleGenerateVideo : handleDownloadImage} 
                    disabled={isGenerating} 
                    className="w-full py-3 px-6 bg-skin-primary hover:bg-skin-primary/90 text-white rounded-full font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg"
                >
                    {isGenerating ? (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                            <span>Rendering...</span>
                        </div>
                    ) : (
                        <>
                            {formatType === 'video' ? <Video size={18} /> : <Download size={18} />}
                            <span>Save {formatType === 'video' ? 'Video' : exportFormat.toUpperCase()}</span>
                        </>
                    )}
                </button>
                {formatType === 'video' && (
                    <p className="text-[10px] text-center text-skin-muted opacity-70">
                        Generates high-quality WebM (VP9).<br/>Elements enter sequentially with rolling numbers.
                    </p>
                )}
            </div>
        </div>

        {/* Right Preview */}
        <div className="flex-1 bg-skin-input/50 relative flex flex-col h-[55vh] md:h-full overflow-hidden z-0">
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-gradient-to-b from-skin-input/80 to-transparent pointer-events-none">
                 <span className="bg-skin-card/80 backdrop-blur-md border border-skin-border/50 px-4 py-1.5 rounded-full text-[10px] font-bold text-skin-muted uppercase tracking-wider shadow-sm flex items-center gap-2">
                    <Check size={12} className="text-green-500"/> {formatType === 'video' ? 'Video Preview' : 'Image Preview'}
                 </span>
            </div>
            
            {/* Preview Area */}
            <div ref={previewContainerRef} className={`flex-1 w-full h-full flex items-center justify-center overflow-hidden relative`}>
                <div 
                    style={{ 
                        width: baseW, 
                        height: baseH, 
                        transform: `scale(${previewScale})`, 
                        transformOrigin: 'center center', 
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
                        flexShrink: 0 
                    }} 
                    className="transition-transform duration-200 ease-out will-change-transform shadow-2xl bg-white"
                >
                    {formatType === 'video' ? (
                        <div className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500
                            ${videoStyle === 'cinematic' ? 'bg-[#0f172a] text-white' : ''}
                            ${videoStyle === 'neon' ? 'bg-[#050505] text-white' : ''}
                            ${videoStyle === 'minimal' ? 'bg-white text-[#0f172a]' : ''}
                            ${videoStyle === 'cosmic' ? 'bg-[#1e1b4b] text-white' : ''}
                            ${videoStyle === 'retro' ? 'bg-[#2a0a2e] text-[#fcd34d]' : ''}
                        `}>
                             {/* Static preview of video style */}
                             <div className="relative z-10 flex flex-col items-center gap-4 animate-pulse">
                                 <Play size={80} className="opacity-50" />
                                 <div className="text-4xl font-black">{videoStyle.toUpperCase()}</div>
                                 <p className="text-xl opacity-70">Press 'Save Video' to Animate</p>
                             </div>
                             {/* Hidden Canvas for recording */}
                             <canvas ref={videoCanvasRef} className="absolute top-0 left-0 opacity-0 pointer-events-none" />
                        </div>
                    ) : (
                        <div ref={cardRef}>{renderCardHTML()}</div>
                    )}
                </div>
            </div>

            {/* Offscreen Render Target for Images */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, width: baseW, height: baseH, pointerEvents: 'none' }}>
                <div ref={exportRef} id="export-container" style={{ width: baseW, height: baseH }}>{renderCardHTML()}</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;