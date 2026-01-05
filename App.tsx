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
import { CustomEvent, ThemeId, UserProfile, Milestone } from './types';
import { getAllMilestones } from './utils/generators';
import { applyTheme } from './utils/themes';
import { Info, Sparkles, CalendarRange, Download } from 'lucide-react';
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
             {/* Left Column: Input & Stats */}
            <div className="lg:col-span-4 space-y-6">
               <div className="lg:hidden">
                     <UpcomingShowcase milestones={milestones} onShare={openShare} />
               </div>

              <div className="bg-skin-card p-6 rounded-xl shadow-sm border border-skin-border">
                <h3 className="text-xl font-bold text-skin-text mb-1">Hello, {profile.name || 'Friend'}!</h3>
                <p className="text-sm text-skin-muted mb-4">You are viewing your life timeline.</p>
                <button 
                    onClick={() => setCurrentView('profile')}
                    className="w-full py-2 px-4 bg-skin-input hover:bg-skin-border text-skin-primary font-medium rounded-lg text-sm transition-colors"
                >
                    Edit Profile Details
                </button>
              </div>
              
              <CurrentAgeCard dob={profile.dob} tob={profile.tob} onShare={openShare} />
              <NextBirthdayCard dob={profile.dob} onShare={openShare} />

              {/* Year Stats Card */}
              <div className="bg-skin-card p-5 rounded-xl shadow-sm border border-skin-border relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                      <CalendarRange size={100} className="text-skin-text"/>
                  </div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2 text-skin-text relative z-10">
                    <CalendarRange className="w-5 h-5 text-skin-primary" />
                    {new Date().getFullYear()} Overview
                  </h3>
                  <div className="relative z-10">
                      <div className="text-3xl font-bold text-skin-text">{milestonesThisYear.length}</div>
                      <p className="text-sm text-skin-muted">Milestones happening this year</p>
                  </div>
                  <button 
                    onClick={() => setCurrentView('list')}
                    className="mt-4 text-xs font-bold text-skin-primary hover:underline relative z-10"
                  >
                    View Calendar →
                  </button>
              </div>

              <div className="bg-skin-card p-5 rounded-xl shadow-sm border border-skin-border">
                <h3 className="font-semibold flex items-center gap-2 mb-2 text-skin-text">
                  <Info className="w-4 h-4 text-skin-primary" />
                  About the Math
                </h3>
                <p className="text-sm text-skin-muted leading-relaxed">
                  We calculate milestones based on <strong>Powers of 10</strong>, <strong>Repdigits</strong> (e.g. 11,111), 
                  <strong>Sequences</strong> (12345), and mathematical constants like <strong>π</strong> and <strong>Fibonacci</strong>.
                </p>
              </div>
            </div>

            {/* Right Column: Visualization & Feed */}
            <div className="lg:col-span-8 space-y-8">
              <div className="hidden lg:block">
                  <UpcomingShowcase milestones={milestones} onShare={openShare} />
              </div>
              
              {/* Short Preview List on Dashboard */}
              <div className="bg-skin-card rounded-xl shadow-sm border border-skin-border p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-skin-text flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Recent Highlights
                      </h3>
                      <button onClick={() => setCurrentView('list')} className="text-sm text-skin-primary font-medium hover:underline">View All</button>
                  </div>
                  <div className="space-y-3">
                      {milestones
                        .filter(m => m.date > new Date(new Date().setDate(new Date().getDate() - 30))) // last 30 days and future
                        .filter(m => m.isPast || differenceInSeconds(m.date, new Date()) < 2592000) // Recent past or near future
                        .sort((a,b) => Math.abs(a.date.getTime() - new Date().getTime()) - Math.abs(b.date.getTime() - new Date().getTime())) // Sort by closeness to now
                        .slice(0, 5) // Show top 5 relevant
                        .map(m => (
                          <div key={m.id} className="flex justify-between text-sm border-b border-skin-border pb-2 last:border-0 hover:bg-skin-base/50 p-2 rounded-lg transition-colors group">
                             <div className="flex flex-col">
                                <span className={m.isPast ? "text-skin-muted line-through opacity-70" : "text-skin-text font-medium"}>{m.title}</span>
                                <span className="text-[10px] text-skin-muted uppercase font-bold">{m.category}</span>
                             </div>
                             <div className="flex items-center gap-4">
                                <span className="text-skin-muted opacity-80 text-xs">{m.date.toLocaleDateString()}</span>
                                <ShareButton 
                                    title={m.title} 
                                    text={m.description} 
                                    className="opacity-0 group-hover:opacity-100" 
                                    iconSize={14} 
                                    onClick={() => openShare(m.title, m.description, m)}
                                />
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
    <div className="min-h-screen bg-skin-base text-skin-text transition-colors duration-300">
      
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;