import React from 'react';
import { Flame, ArrowUp } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    soundEngine.playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative w-full bg-[#05060a] text-slate-400 py-16 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-12 border-b border-slate-800/60">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-white">
                <Flame className="w-5 h-5 fill-white" />
              </div>
              <span className="font-heading text-2xl font-black text-white tracking-wider">
                DRIFT <span className="text-rose-500">X</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm">
              The premier browser 3D drifting simulation. Built with WebGL, real-time RWD physics, and street-racing culture.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-6 text-xs font-heading font-bold uppercase tracking-wider text-slate-300">
            <a href="#cars" className="hover:text-rose-400 transition-colors">CARS</a>
            <a href="#tracks" className="hover:text-rose-400 transition-colors">TRACKS</a>
            <a href="#modes" className="hover:text-rose-400 transition-colors">MODES</a>
            <a href="#leaderboard" className="hover:text-rose-400 transition-colors">LEADERBOARD</a>
            <a href="#how-to-play" className="hover:text-rose-400 transition-colors">HOW TO PLAY</a>
          </div>

          {/* Back to top button */}
          <button
            onClick={scrollToTop}
            className="p-3 rounded-2xl glass-panel hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition group"
            title="Back to Top"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-500">
          <div>
            © {new Date().getFullYear()} DRIFT X RACING. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 transition">WEBGL 3D ENGINE</span>
            <span>•</span>
            <span className="hover:text-slate-400 transition">WEB AUDIO SYNTH</span>
            <span>•</span>
            <span className="hover:text-slate-400 transition">ARCADE DRIFT PHYSICS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
