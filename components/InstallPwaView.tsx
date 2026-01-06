import React, { useEffect, useState } from 'react';
import { Download, CheckCircle, Smartphone, Share, PlusSquare, ArrowRight, ShieldCheck, Zap, WifiOff, AlertTriangle, ExternalLink } from 'lucide-react';
import Logo from './Logo';

interface Props {
  installPwa: () => void;
  isPwaInstalled: boolean;
  canInstallPwa: boolean;
}

const InstallPwaView: React.FC<Props> = ({ installPwa, isPwaInstalled, canInstallPwa }) => {
  const [isIos, setIsIos] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    // Simple iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(userAgent));
    
    // Iframe/Preview detection
    try {
        setIsInIframe(window.self !== window.top);
    } catch (e) {
        setIsInIframe(true);
    }
  }, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-20">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-skin-primary to-indigo-600 rounded-[2.5rem] p-8 text-white text-center relative overflow-hidden shadow-2xl border border-white/20">
         <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
         
         <div className="relative z-10 flex flex-col items-center gap-4">
             <div className="bg-white p-4 rounded-3xl shadow-xl">
                <Logo className="w-16 h-16" />
             </div>
             <div>
                 <h1 className="text-3xl font-black tracking-tight mb-2">Install App</h1>
                 <p className="text-indigo-100 font-medium max-w-xs mx-auto">
                    Get the full experience. Add Life Milestones to your home screen for instant access.
                 </p>
             </div>

             {isPwaInstalled ? (
                 <div className="flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md px-6 py-3 rounded-full border border-emerald-400/30 mt-4">
                     <CheckCircle className="text-emerald-300" size={20} />
                     <span className="font-bold text-emerald-100">App is Installed</span>
                 </div>
             ) : (
                <>
                    {canInstallPwa ? (
                        <button 
                            onClick={installPwa}
                            className="mt-4 bg-white text-skin-primary px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <Download size={24} /> Install Now
                        </button>
                    ) : (
                        <div className="mt-4 flex flex-col items-center gap-2">
                             <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 text-sm font-medium">
                                {isIos ? "Follow instructions below for iOS" : "Follow browser instructions below"}
                             </div>
                        </div>
                    )}
                </>
             )}
         </div>
      </div>

      {/* Warning for Preview Environments */}
      {isInIframe && !isPwaInstalled && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-[2rem] text-amber-600 flex items-start gap-4">
            <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
                <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-skin-text">Preview Mode Detected</h4>
              <p className="text-xs mt-1 text-skin-muted leading-relaxed">
                  Browser security prevents installation from inside a preview frame (like this one). 
                  Please open the app in a full window to install it.
              </p>
              <a 
                href={window.location.href} 
                target="_blank" 
                rel="noreferrer" 
                className="mt-3 inline-flex items-center gap-2 bg-skin-text text-skin-base px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Open Full Window <ExternalLink size={12} />
              </a>
            </div>
          </div>
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-skin-card/40 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/20 shadow-sm flex flex-col items-center text-center gap-2">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full"><WifiOff size={24} /></div>
              <h3 className="font-bold text-skin-text">Offline Ready</h3>
              <p className="text-xs text-skin-muted">Works perfectly without internet.</p>
          </div>
          <div className="bg-skin-card/40 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/20 shadow-sm flex flex-col items-center text-center gap-2">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-full"><Zap size={24} /></div>
              <h3 className="font-bold text-skin-text">Instant Load</h3>
              <p className="text-xs text-skin-muted">Opens instantly, no loading bars.</p>
          </div>
          <div className="bg-skin-card/40 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/20 shadow-sm flex flex-col items-center text-center gap-2">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full"><ShieldCheck size={24} /></div>
              <h3 className="font-bold text-skin-text">Privacy First</h3>
              <p className="text-xs text-skin-muted">Data stays on your device.</p>
          </div>
      </div>

      {/* Instructions Section */}
      {!isPwaInstalled && (
          <div className="bg-skin-card/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/20 shadow-xl">
              <h2 className="text-xl font-bold text-skin-text mb-6 flex items-center gap-2">
                  <Smartphone size={20} className="text-skin-primary" />
                  Installation Guide
              </h2>

              {canInstallPwa ? (
                  <div className="flex items-start gap-4 p-4 bg-skin-base/30 rounded-2xl border border-white/10">
                      <div className="w-8 h-8 rounded-full bg-skin-primary text-white flex items-center justify-center font-bold shrink-0">1</div>
                      <div>
                          <h4 className="font-bold text-skin-text mb-1">Android / Chrome</h4>
                          <p className="text-sm text-skin-muted mb-3">Simply click the big "Install Now" button above. If that doesn't work:</p>
                          <ol className="text-sm text-skin-muted space-y-1 list-disc pl-4">
                              <li>Tap the browser menu (three dots <span className="inline-block align-middle font-mono">⋮</span>)</li>
                              <li>Select <strong>Install App</strong> or <strong>Add to Home Screen</strong></li>
                          </ol>
                      </div>
                  </div>
              ) : isIos ? (
                   <div className="space-y-6">
                       <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-skin-input flex items-center justify-center shrink-0">
                               <Share size={20} className="text-blue-500" />
                           </div>
                           <div className="flex-1">
                               <h4 className="font-bold text-skin-text">Step 1</h4>
                               <p className="text-sm text-skin-muted">Tap the <strong>Share</strong> button on your browser toolbar.</p>
                           </div>
                       </div>
                       <div className="flex items-center justify-center">
                           <ArrowRight className="text-skin-muted rotate-90 md:rotate-0" />
                       </div>
                       <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-skin-input flex items-center justify-center shrink-0">
                               <PlusSquare size={20} className="text-skin-text" />
                           </div>
                           <div className="flex-1">
                               <h4 className="font-bold text-skin-text">Step 2</h4>
                               <p className="text-sm text-skin-muted">Scroll down and tap <strong>Add to Home Screen</strong>.</p>
                           </div>
                       </div>
                       <div className="p-4 bg-skin-base/30 rounded-xl text-center text-xs font-medium text-skin-muted">
                           Note: This feature works best in Safari on iOS.
                       </div>
                   </div>
              ) : (
                  <div className="text-center py-8">
                       <p className="text-skin-muted mb-2">Browser installation not directly detected.</p>
                       <p className="text-sm font-bold text-skin-text">Look for an "Install" or "Add to Home Screen" option in your browser menu.</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default InstallPwaView;