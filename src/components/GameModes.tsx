import React from 'react';
import { GameMode } from '../types';
import { Flame, Timer, Target, Disc, Play } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface GameModesProps {
  onSelectModeAndPlay: (mode: GameMode) => void;
}

const MODES = [
  {
    id: 'freestyle' as GameMode,
    title: 'FREESTYLE DRIFT',
    tagline: 'Pure drifting freedom without clocks or limits.',
    description: 'Chain massive drift angles, build uninterrupted combo multipliers, and incinerate your tires at will across open asphalt sweeps.',
    icon: Flame,
    color: '#f43f5e',
    bonusText: 'Uncapped Combo Multiplier',
  },
  {
    id: 'time_attack' as GameMode,
    title: 'TIME ATTACK DRIFT',
    tagline: 'Maximum speed meets radical sideways angle.',
    description: 'Balance forward trajectory against lateral slip. Fast corner exits reward precious bonus seconds on the race clock.',
    icon: Timer,
    color: '#38bdf8',
    bonusText: 'Speed & Corner Exit Bonus',
  },
  {
    id: 'drift_battle' as GameMode,
    title: 'CLIPPING ZONE BATTLE',
    tagline: 'Scrape the barrier wall and hit the golden apexes.',
    description: 'Drive your rear bumper within inches of golden clipping beacons. Yields instant 3.5x multiplier bursts for daring proximity slides.',
    icon: Target,
    color: '#a855f7',
    bonusText: '3.5x Proximity Multiplier',
  },
  {
    id: 'gymkhana' as GameMode,
    title: 'GYMKHANA ARENA',
    tagline: 'Donut pylons, figure-8s, and container slaloms.',
    description: 'Technical handling arena demanding quick handbrake snaps, rapid pendulum weight transfers, and precision 360-degree donut rings.',
    icon: Disc,
    color: '#f59e0b',
    bonusText: 'Obstacle Precision Points',
  },
];

export const GameModes: React.FC<GameModesProps> = ({ onSelectModeAndPlay }) => {
  return (
    <section id="modes" className="relative w-full py-24 bg-[#090b12] text-white border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-purple-500/30 text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <span>DISCIPLINES OF DRIFTING</span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4">
            GAME <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-rose-500">MODES.</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Whether you want relaxed endless slides or tight precision gymkhana obstacles, DRIFT X delivers the adrenaline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                className="glass-panel p-6 rounded-3xl border border-slate-800/90 hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5"
              >
                <div>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border shadow-lg"
                    style={{
                      backgroundColor: `${mode.color}18`,
                      borderColor: `${mode.color}40`,
                      color: mode.color,
                    }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="font-heading text-xl font-black text-white mb-1 group-hover:text-rose-400 transition-colors">
                    {mode.title}
                  </h3>
                  <div className="text-xs font-semibold text-slate-400 mb-3">
                    {mode.tagline}
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed mb-6">
                    {mode.description}
                  </p>
                </div>

                <div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] font-mono text-slate-300 mb-4 flex items-center justify-between">
                    <span className="text-slate-500">REWARD:</span>
                    <span className="font-bold text-white">{mode.bonusText}</span>
                  </div>

                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectModeAndPlay(mode.id);
                    }}
                    className="w-full py-3 glass-panel hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-heading font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 group-hover:border-rose-500/50"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>LAUNCH MODE</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
