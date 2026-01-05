import React from 'react';
import { Github, Instagram, ExternalLink, Code2, Rocket, GraduationCap } from 'lucide-react';

const AboutView: React.FC = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-skin-card/40 backdrop-blur-2xl rounded-[2.5rem] shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-skin-primary to-blue-600 h-40 relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute -bottom-12 left-8">
                     <div className="w-28 h-28 bg-skin-card/80 rounded-full p-1.5 shadow-2xl backdrop-blur-md">
                        <div className="w-full h-full rounded-full bg-skin-input flex items-center justify-center text-3xl font-black text-skin-primary border border-skin-border/20 shadow-inner">
                            itN
                        </div>
                     </div>
                </div>
            </div>
            
            <div className="pt-16 px-8 pb-10">
                <h1 className="text-4xl font-black text-skin-text mb-1 tracking-tight">itnNeer</h1>
                <p className="text-skin-muted font-semibold text-lg mb-8">Full Stack Developer & Creative Technologist</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    <a href="https://github.com/yNeer" target="_blank" rel="noopener noreferrer" 
                       className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-skin-base/30 hover:bg-skin-base/50 transition-all group backdrop-blur-sm shadow-sm">
                        <div className="bg-[#24292e] p-3 rounded-xl text-white group-hover:scale-110 transition-transform shadow-md">
                            <Github size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-skin-text text-lg">GitHub</div>
                            <div className="text-xs font-bold text-skin-muted uppercase tracking-wider">@yNeer</div>
                        </div>
                        <ExternalLink size={18} className="ml-auto text-skin-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>

                    <a href="https://instagram.com/itneer" target="_blank" rel="noopener noreferrer" 
                       className="flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-skin-base/30 hover:bg-skin-base/50 transition-all group backdrop-blur-sm shadow-sm">
                        <div className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-3 rounded-xl text-white group-hover:scale-110 transition-transform shadow-md">
                            <Instagram size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-skin-text text-lg">Instagram</div>
                            <div className="text-xs font-bold text-skin-muted uppercase tracking-wider">@itneer</div>
                        </div>
                        <ExternalLink size={18} className="ml-auto text-skin-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                </div>

                <h3 className="text-sm font-bold text-skin-muted uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Ventures & Projects</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-5 p-5 rounded-2xl bg-skin-base/30 border border-white/10 backdrop-blur-sm">
                        <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                            <Rocket size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-skin-text text-lg">Wagad Plus</h4>
                            <p className="text-sm text-skin-muted mt-1 leading-relaxed">A digital platform connecting communities. Innovation in local news and media consumption.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-5 p-5 rounded-2xl bg-skin-base/30 border border-white/10 backdrop-blur-sm">
                        <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-skin-text text-lg">LearnNow!</h4>
                            <p className="text-sm text-skin-muted mt-1 leading-relaxed">Educational initiative focused on making complex tech concepts accessible to everyone.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center text-xs font-medium text-skin-muted opacity-60">
                    <p>Designed and Developed with <Code2 size={12} className="inline mx-1" /> by itnNeer</p>
                    <p className="mt-1">© {new Date().getFullYear()} Life Milestones Calculator</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AboutView;