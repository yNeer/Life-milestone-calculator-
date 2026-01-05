import React, { useState, useMemo, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';
import InputSection from './components/InputSection';
import UpcomingShowcase from './components/UpcomingShowcase';
import NextBirthdayCard from './components/NextBirthdayCard';
import MilestoneList from './components/MilestoneList';
import VisualizationsPage from './components/VisualizationsPage';
import CurrentAgeCard from './components/CurrentAgeCard';
import NavBar from './components/NavBar';
import SettingsView from './components/SettingsView';
import ProfileView from './components/ProfileView';
import AboutView from './components/AboutView';
import ShareModal from './components/ShareModal';
import { LiveClockWidget, ZodiacWidget, DayBornWidget, YearProgressWidget } from './components/MosaicWidgets';
import { CustomEvent, ThemeId, UserProfile, Milestone } from './types';
import { getAllMilestones } from './utils/generators';
import { applyTheme } from './utils/themes';
import { Info, Sparkles, CalendarRange, Download, ChevronRight } from 'lucide-react';
import ShareButton from './components/ShareButton';

const STORAGE_KEY = 'life_milestones_data';

// Default Data
const DEFAULT_DOB = new Date(new Date().setFullYear(new Date().getFullYear() - 25)).toISOString().split('T')[0];
const DEFAULT_PROFILE: UserProfile = {
  name: 'User',
  dob: DEFAULT_DOB,
  tob: '12:00',
  theme: 'light'
};

const App: React.FC = () => {
  // --- State Initialization with Persistence ---
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).profile : DEFAULT_PROFILE;
  });

  const [customEvents, setCustomEvents] = useState<CustomEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).customEvents.map((e: any) => ({...e, date: new Date(e.date)})) : [];
  });

  const [currentView, setCurrentView] = useState<'dashboard' | 'visualizations' | 'list' | 'settings' | 'profile' | 'about'>('dashboard');
  
  // Share Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState<{title: string, text: string, milestone?: Milestone}>({ title: '', text: '' });

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // --- Effects ---

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      profile,
      customEvents
    }));
  }, [profile, customEvents]);

  // Theme Application Effect
  useEffect(() => {
    applyTheme(profile.theme);
  }, [profile.theme]);

  // PWA Install Event Listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // --- Handlers ---

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const addCustomEvent = (evt: CustomEvent) => {
    setCustomEvents(prev => [...prev, evt]);
  };

  const removeCustomEvent = (id: string) => {
    setCustomEvents(prev => prev.filter(e => e.id !== id));
  };

  const openShare = (title: string, text: string, milestone?: Milestone) => {
      setShareData({ title, text, milestone });
      setShareModalOpen(true);
  };

  const handleShareApp = () => {
      openShare("Life Milestones Calculator", "Discover the hidden mathematical poetry in your life's timeline. Calculate your next big moment!");
  };

  const handleInstallApp = () => {
      if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult: any) => {
              if (choiceResult.outcome === 'accepted') {
                  setIsAppInstalled(true);
              }
              setDeferredPrompt(null);
          });
      }
  };

  // --- Derived Data ---

  const milestones = useMemo(() => {
    if (!profile.dob) return [];
    return getAllMilestones(new Date(profile.dob), profile.tob, customEvents);
  }, [profile.dob, profile.tob, customEvents]);

  const milestonesThisYear = useMemo(() => {
      const currentYear = new Date().getFullYear();
      return milestones.filter(m => m.date.getFullYear() === currentYear);
  }, [milestones]);

  // --- Render Logic ---

  const renderContent = () => {
    switch (currentView) {
      case 'settings':
        return <SettingsView currentTheme={profile.theme} setTheme={(id: ThemeId) => updateProfile({ theme: id })} />;
      case 'visualizations':
        return <VisualizationsPage milestones={milestones} dob={new Date(profile.dob)} />;
      case 'list':
        return <MilestoneList milestones={milestones} onShare={openShare} />; 
      case 'profile':
        return (
          <ProfileView 
            profile={profile} 
            updateProfile={updateProfile} 
            customEvents={customEvents} 
            addCustomEvent={addCustomEvent}
            removeCustomEvent={removeCustomEvent}
            installPwa={handleInstallApp}
            isPwaInstalled={isAppInstalled}
            canInstallPwa={!!deferredPrompt}
          />
        );
      case 'about':
        return <AboutView />;
      case 'dashboard':
      default:
        return (
          <div className="flex flex-col gap-5 animate-in fade-in duration-500">
             
             {/* Hello Header */}
             <div className="flex items-center justify-between px-2">
                 <div>
                    <h2 className="text-2xl font-bold text-skin-text">Hello, {profile.name} 👋</h2>
                    <p className="text-sm text-skin-muted font-medium">Here is your life overview</p>
                 </div>
                 <button onClick={() => setCurrentView('profile')} className="p-2 bg-skin-card/50 rounded-full hover:bg-skin-primary hover:text-white transition-colors">
                     <ChevronRight size={20}/>
                 </button>
             </div>

             {/* MOSAIC GRID LAYOUT */}
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
                 
                 {/* 1. Upcoming Showcase (2x2 on Desktop, Full on Mobile) */}
                 <div className="col-span-2 lg:col-span-2 row-span-2">
                     <UpcomingShowcase milestones={milestones} onShare={openShare} />
                 </div>

                 {/* 2. Live Clock (1x1) */}
                 <div className="col-span-1 lg:col-span-1 min-h-[140px]">
                     <LiveClockWidget />
                 </div>

                 {/* 3. Year Progress (1x1) */}
                 <div className="col-span-1 lg:col-span-1 min-h-[140px]">
                     <YearProgressWidget />
                 </div>

                 {/* 4. Current Age (Stats) (2x1) */}
                 <div className="col-span-2 lg:col-span-1 row-span-2">
                     <CurrentAgeCard dob={profile.dob} tob={profile.tob} onShare={openShare} />
                 </div>

                 {/* 5. Next Birthday (1x1 or 1x2 depending on content) */}
                 <div className="col-span-2 lg:col-span-1 min-h-[200px]">
                     <NextBirthdayCard dob={profile.dob} onShare={openShare} />
                 </div>
                 
                 {/* 6. Zodiac (1x1) */}
                 <div className="col-span-1 lg:col-span-1 min-h-[140px]">
                     <ZodiacWidget dob={new Date(profile.dob)} />
                 </div>

                 {/* 7. Day Born (1x1) */}
                 <div className="col-span-1 lg:col-span-1 min-h-[140px]">
                     <DayBornWidget dob={new Date(profile.dob)} />
                 </div>

             </div>

             {/* Secondary Grid (Insights) */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                
                {/* Year Stats Tile */}
                <div 
                    onClick={() => setCurrentView('list')}
                    className="bg-skin-card/40 backdrop-blur-2xl p-5 rounded-[2rem] shadow-lg border border-white/20 relative overflow-hidden group cursor-pointer hover:bg-skin-card/60 transition-colors"
                >
                    <div className="absolute -right-6 -top-6 text-skin-text opacity-5 group-hover:opacity-10 transition-opacity">
                        <CalendarRange size={140} />
                    </div>
                    <div className="relative z-10">
                         <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-skin-primary/10 text-skin-primary">
                                <CalendarRange size={16} />
                            </div>
                            <span className="font-bold text-sm text-skin-text">{new Date().getFullYear()} Overview</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                             <div className="text-4xl font-black text-skin-text tracking-tight">{milestonesThisYear.length}</div>
                             <div className="text-xs font-bold text-skin-muted uppercase">Events</div>
                        </div>
                    </div>
                </div>

                {/* Fun Fact Tile */}
                <div className="bg-skin-card/40 backdrop-blur-2xl p-5 rounded-[2rem] shadow-lg border border-white/20 flex flex-col justify-center">
                     <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                            <Info size={16} />
                        </div>
                        <span className="font-bold text-sm text-skin-text">Did You Know?</span>
                    </div>
                    <p className="text-xs text-skin-muted leading-relaxed font-medium">
                        We calculate based on Powers of 10, Repdigits (11,111), and mathematical sequences like Fibonacci to find hidden gems in your timeline.
                    </p>
                </div>

                {/* Highlights Tile */}
                <div className="bg-skin-card/40 backdrop-blur-2xl p-5 rounded-[2rem] shadow-lg border border-white/20 flex flex-col justify-between">
                     <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                             <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                                <Sparkles size={16} />
                            </div>
                            <span className="font-bold text-sm text-skin-text">Recent</span>
                        </div>
                        <button onClick={() => setCurrentView('list')} className="text-[10px] font-bold text-skin-primary bg-skin-primary/10 px-2 py-1 rounded-lg hover:bg-skin-primary hover:text-white transition-colors">VIEW ALL</button>
                    </div>
                    
                    <div className="space-y-2">
                        {milestones
                            .filter(m => m.date > new Date(new Date().setDate(new Date().getDate() - 30))) 
                            .filter(m => m.isPast || differenceInSeconds(m.date, new Date()) < 2592000)
                            .sort((a,b) => Math.abs(a.date.getTime() - new Date().getTime()) - Math.abs(b.date.getTime() - new Date().getTime()))
                            .slice(0, 2)
                            .map(m => (
                                <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-skin-base/30 border border-white/5">
                                    <div className="truncate pr-2">
                                        <div className="text-xs font-bold text-skin-text truncate">{m.title}</div>
                                        <div className="text-[10px] text-skin-muted">{m.date.toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>

             </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen text-skin-text transition-colors duration-300">
      
      {/* Share Modal */}
      <ShareModal 
        isOpen={shareModalOpen} 
        onClose={() => setShareModalOpen(false)} 
        title={shareData.title}
        text={shareData.text}
        milestone={shareData.milestone}
        userProfile={profile}
        allMilestones={milestones} 
      />

      <NavBar 
        currentView={currentView} 
        setView={setCurrentView} 
        onShareApp={handleShareApp}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-32">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;