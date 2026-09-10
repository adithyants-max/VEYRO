import React, { useState } from 'react';
import { Play, Volume2, VolumeX, Flame, Menu, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface NavbarProps {
  onPlayClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onPlayClick }) => {
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const navLinks = [
    { label: 'CARS', href: '#cars' },
    { label: 'TRACKS', href: '#tracks' },
    { label: 'MODES', href: '#modes' },
    { label: 'LEADERBOARD', href: '#leaderboard' },
    { label: 'HOW TO PLAY', href: '#how-to-play' },
    { label: 'ACHIEVEMENTS', href: '#achievements' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#07080c]/85 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <a
          href="#"
          className="flex items-center gap-2 group"
          onClick={() => soundEngine.playClick()}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 group-hover:scale-105 transition-transform">
            <Flame className="w-6 h-6 fill-white text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-2xl font-black tracking-wider text-white flex items-center gap-1">
              DRIFT <span className="text-rose-500 text-glow-red">X</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-bold -mt-1">
              PRO STREET RACING
            </span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-8 text-xs font-heading font-bold uppercase tracking-wider text-slate-300">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => soundEngine.playClick()}
              className="hover:text-rose-400 transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-rose-500 hover:after:w-full after:transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2.5 rounded-xl glass-panel hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* PLAY NOW CTA */}
          <button
            onClick={onPlayClick}
            className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 hover:scale-105 active:scale-95 flex items-center gap-2 border border-rose-400/40"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>PLAY GAME</span>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={onPlayClick}
            className="px-4 py-2 bg-rose-600 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl"
          >
            PLAY
          </button>
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="p-2 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#07080c] border-b border-slate-800 px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => {
                soundEngine.playClick();
                setMobileMenuOpen(false);
              }}
              className="block text-sm font-heading font-bold uppercase tracking-wider text-slate-300 hover:text-rose-400"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Engine Sound & Beat</span>
            <button
              onClick={toggleSound}
              className="px-3 py-1.5 rounded-lg glass-panel text-xs text-white"
            >
              {isMuted ? 'Sound: OFF' : 'Sound: ON'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
