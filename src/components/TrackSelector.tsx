import React from 'react';
import { TrackData } from '../types';
import { TRACKS_DATA } from '../data/gameData';
import { soundEngine } from '../audio/soundEngine';
import { MapPin, Flag, Trophy, Shield, Play, Layers } from 'lucide-react';

interface TrackSelectorProps {
  selectedTrackId: string;
  onSelectTrack: (track: TrackData) => void;
  onPlayTrack: (track: TrackData) => void;
}

export const TrackSelector: React.FC<TrackSelectorProps> = ({
  selectedTrackId,
  onSelectTrack,
  onPlayTrack,
}) => {
  return (
    <section id="tracks" className="relative w-full py-24 bg-[#07080c] text-white border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-widest mb-2">
              <MapPin className="w-4 h-4" />
              <span>GLOBAL CIRCUITS</span>
            </div>
            <h2 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
              DRIFT <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-500">TRACKS.</span>
            </h2>
          </div>
          <p className="max-w-md text-slate-400 text-sm mt-3 md:mt-0">
            From rain-slicked Tokyo highways to treacherous mountain touge passes and industrial obstacle arenas.
          </p>
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TRACKS_DATA.map((track) => {
            const isSelected = track.id === selectedTrackId;
            return (
              <div
                key={track.id}
                onClick={() => {
                  soundEngine.playClick();
                  onSelectTrack(track);
                }}
                className={`group cursor-pointer rounded-3xl p-6 sm:p-7 transition-all duration-300 border flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'glass-panel-glow border-sky-500/60 shadow-2xl shadow-sky-500/20 transform -translate-y-1.5'
                    : 'glass-panel border-slate-800/80 hover:border-slate-700 hover:-translate-y-1'
                }`}
              >
                {/* Background ambient color tint */}
                <div
                  className="absolute -top-10 -right-10 w-44 h-44 rounded-full blur-[80px] pointer-events-none opacity-25 group-hover:opacity-40 transition-opacity"
                  style={{ backgroundColor: track.accentColor }}
                />

                {/* Top Info */}
                <div className="relative z-10 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        track.difficulty === 'Easy'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : track.difficulty === 'Medium'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {track.difficulty}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <Flag className="w-3.5 h-3.5 text-slate-400" />
                      <span>{track.length}</span>
                    </div>
                  </div>

                  <h3 className="font-heading text-2xl font-black text-white mb-2 group-hover:text-sky-300 transition-colors">
                    {track.name}
                  </h3>
                  <div className="text-xs text-slate-400 font-semibold mb-3 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{track.location}</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                    {track.description}
                  </p>
                </div>

                {/* Track Stats Card */}
                <div className="relative z-10 space-y-2 mb-6 p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/80 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" /> Surface Grip:
                    </span>
                    <span className="font-semibold text-white">{track.surface}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-slate-400" /> Drift Corners:
                    </span>
                    <span className="font-semibold text-white">{track.corners} Apexes</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-yellow-400" /> Track Record:
                    </span>
                    <span className="font-mono font-bold text-yellow-400">
                      {track.bestScore.toLocaleString()} PTS
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEngine.playClick();
                    onPlayTrack(track);
                  }}
                  className="relative z-10 w-full py-3.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>RACE THIS TRACK</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
