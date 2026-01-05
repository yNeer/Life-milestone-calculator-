import React from 'react';
import { Github, Instagram, ExternalLink, Code2, Rocket, GraduationCap } from 'lucide-react';

const AboutView: React.FC = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-skin-card rounded-2xl shadow-sm border border-skin-border overflow-hidden">
            <div className="bg-gradient-to-r from-skin-primary to-blue-600 h-32 relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute -bottom-10 left-8">
                     <div className="w-24 h-24 bg-skin-card rounded-full p-1 shadow-lg">
                        <div className="w-full h-full rounded-full bg-skin-input flex items-center justify-center text-3xl font-bold text-skin-primary">
                            itN
                        </div>
                     </div>
                </div>
            </div>
            
            <div className="pt-12 px-8 pb-8">
                <h1 className="text-3xl font-bold text-skin-text mb-1">itnNeer</h1>
                <p className="text-skin-muted font-medium mb-6">Full Stack Developer & Creative Technologist</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <a href="https://github.com/yNeer" target="_blank" rel="noopener noreferrer" 
                       className="flex items-center gap-4 p-4 rounded-xl border border-skin-border bg-skin-input/50 hover:bg-skin-input hover:border-skin-primary/30 transition-all group">
                        <div className="bg-[#24292e] p-3 rounded-full text-white group-hover:scale-110 transition-transform">
                            <Github size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-skin-text">GitHub</div>
                            <div className="text-sm text-skin-muted">@yNeer</div>
                        </div>
                        <ExternalLink size={16} className="ml-auto text-skin-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>

                    <a href="https://instagram.com/itneer" target="_blank" rel="noopener noreferrer" 
                       className="flex items-center gap-4 p-4 rounded-xl border border-skin-border bg-skin-input/50 hover:bg-skin-input hover:border-skin-primary/30 transition-all group">
                        <div className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-3 rounded-full text-white group-hover:scale-110 transition-transform">
                            <Instagram size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-skin-text">Instagram</div>
                            <div className="text-sm text-skin-muted">@itneer</div>
                        </div>
                        <ExternalLink size={16} className="ml-auto text-skin-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                </div>

                <h3 className="text-lg font-bold text-skin-text mb-4 border-b border-skin-border pb-2">Ventures & Projects</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-skin-base border border-skin-border">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Rocket size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-skin-text">Wagad Plus</h4>
                            <p className="text-sm text-skin-muted mt-1">A digital platform connecting communities. Innovation in local news and media consumption.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-skin-base border border-skin-border">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-skin-text">LearnNow!</h4>
                            <p className="text-sm text-skin-muted mt-1">Educational initiative focused on making complex tech concepts accessible to everyone.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-xs text-skin-muted">
                    <p>Designed and Developed with <Code2 size={12} className="inline mx-1" /> by itnNeer</p>
                    <p className="mt-1">© {new Date().getFullYear()} Life Milestones Calculator</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AboutView;