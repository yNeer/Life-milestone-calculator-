import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Download, Share2, RefreshCw } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { differenceInDays } from 'date-fns';
import { Milestone, UserProfile } from '../types';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  milestones: Milestone[];
}

const filters = ['snapchat', 'vibrant', 'minimal'];

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, profile, milestones }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentFilterIndex, setCurrentFilterIndex] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Derived stats
  const birthDate = profile.dob ? new Date(profile.dob) : new Date();
  const daysAlive = differenceInDays(new Date(), birthDate);
  const nextMilestone = milestones.find(m => !m.isPast);
  const daysToMilestone = nextMilestone ? differenceInDays(nextMilestone.date, new Date()) : 0;

  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(err.message || "Could not access camera. Please check permissions.");
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      setCapturedImage(null);
    }
    // No need to stop stream on else, the component is unmounted. Let the cleanup handle it.
  }, [isOpen, startCamera, facingMode]);

  useEffect(() => {
    // Cleanup stream when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const handleScreenTap = () => {
    if (!capturedImage) {
      setCurrentFilterIndex((prev) => (prev + 1) % filters.length);
    }
  };

  const captureSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current || !containerRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    if (facingMode === 'user') {
      // Mirror the canvas context if using front camera
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Use htmlToImage on the container which holds the background canvas and the HTML overlay
      const dataUrl = await htmlToImage.toPng(containerRef.current, {
        cacheBust: true,
        style: {
           transform: 'none' // ensure no funny scaling issues
        }
      });
      setCapturedImage(dataUrl);
    } catch (err) {
      console.error("Failed to capture image:", err);
      // Fallback: just show canvas if htmlToImage fails
       setCapturedImage(canvas.toDataURL('image/png'));
    }
  };

  const downloadImage = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.download = `life-milestone-${Date.now()}.png`;
    link.href = capturedImage;
    link.click();
  };

  const shareImage = async () => {
    if (!capturedImage || !navigator.share) return;
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'milestone.png', { type: 'image/png' });
      await navigator.share({
        title: 'Life Milestones',
        text: 'Check out my life milestone!',
        files: [file]
      });
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const renderFilterOverlay = () => {
    const currentFilter = filters[currentFilterIndex];
    const textToShow = currentFilterIndex % 2 === 0
        ? `Day ${daysAlive.toLocaleString()} of my life`
        : (nextMilestone ? `${daysToMilestone.toLocaleString()} days to ${nextMilestone.title}` : `Day ${daysAlive.toLocaleString()} of my life`);

    switch(currentFilter) {
      case 'snapchat':
        return (
          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 bg-black/50 py-3 pointer-events-none">
             <p className="text-white text-center text-xl font-bold font-sans px-4 shadow-sm">{textToShow}</p>
          </div>
        );
      case 'vibrant':
        return (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
             <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] leading-tight uppercase transform -rotate-6">
               {textToShow}
             </h2>
           </div>
        );
      case 'minimal':
        return (
          <div className="absolute bottom-32 right-6 pointer-events-none text-right">
             <div className="text-white font-light text-4xl tracking-widest drop-shadow-md">
                 {daysAlive.toLocaleString()}
             </div>
             <div className="text-white/80 font-bold text-xs uppercase tracking-[0.3em] drop-shadow-md">
                 Days Lived
             </div>
          </div>
        );
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overscroll-none touch-none">

      {/* Top Controls */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50">
        <button onClick={onClose} className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors">
          <X size={24} />
        </button>
        {!capturedImage && (
            <button onClick={toggleCamera} className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors">
              <RefreshCw size={24} />
            </button>
        )}
      </div>

      {/* Main Content Area (Capture Container) */}
      <div
        ref={containerRef}
        onClick={handleScreenTap}
        className="relative w-full h-full max-h-screen max-w-lg bg-black overflow-hidden flex items-center justify-center"
      >
        {cameraError ? (
           <div className="text-white p-4 text-center">
              <p>{cameraError}</p>
           </div>
        ) : (
            <>
              {/* Hidden Canvas for Drawing Video Frame */}
              <canvas ref={canvasRef} className="hidden" />

              {!capturedImage ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                />
              ) : (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              )}

              {/* Filter Overlay */}
              {renderFilterOverlay()}
            </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 w-full p-8 flex justify-center items-center z-50 bg-gradient-to-t from-black/80 to-transparent">
        {!capturedImage ? (
          <button
            onClick={(e) => { e.stopPropagation(); captureSnapshot(); }}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur-sm" />
          </button>
        ) : (
          <div className="flex gap-6 w-full max-w-xs justify-center">
             <button
                onClick={(e) => { e.stopPropagation(); setCapturedImage(null); }}
                className="flex flex-col items-center gap-2 text-white p-2"
             >
                 <div className="p-4 bg-white/20 rounded-full backdrop-blur-md"><X size={24} /></div>
                 <span className="text-xs font-bold uppercase tracking-wider">Retake</span>
             </button>
             <button
                onClick={(e) => { e.stopPropagation(); downloadImage(); }}
                className="flex flex-col items-center gap-2 text-white p-2"
             >
                 <div className="p-4 bg-skin-primary rounded-full shadow-lg shadow-skin-primary/50"><Download size={24} /></div>
                 <span className="text-xs font-bold uppercase tracking-wider">Save</span>
             </button>
             {typeof navigator.share === 'function' && (
                <button
                  onClick={(e) => { e.stopPropagation(); shareImage(); }}
                  className="flex flex-col items-center gap-2 text-white p-2"
               >
                   <div className="p-4 bg-white/20 rounded-full backdrop-blur-md"><Share2 size={24} /></div>
                   <span className="text-xs font-bold uppercase tracking-wider">Share</span>
               </button>
             )}
          </div>
        )}
      </div>

      {/* Filter hint (only show briefly or when not captured) */}
      {!capturedImage && !cameraError && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/40 text-white/80 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md pointer-events-none">
              Tap screen to change filter
          </div>
      )}
    </div>
  );
};

export default CameraModal;