import React from 'react';
import { INITIAL_ACHIEVEMENTS } from '../data/gameData';
import { Trophy, CheckCircle2, Lock, Gift, Flame, Zap, Compass, Wind } from 'lucide-react';

export const Achievements: React.FC = () => {
  return (
    <section id="achievements" className="relative w-full py-24 bg-[#07080c] text-white border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest mb-2">
              <Trophy className="w-4 h-4" />
              <span>STREET CRED & PERKS</span>
            </div>
            <h2 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
              LATEST <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-500">ACHIEVEMENTS.</span>
            </h2>
          </div>
          <p className="max-w-md text-slate-400 text-sm mt-3 md:mt-0">
            Complete high-angle drift milestones and chain insane combos to unlock custom underglow neon, colored tire smoke, and forged racing rims.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INITIAL_ACHIEVEMENTS.map((item) => {
            const isUnlocked = item.unlocked;
            const pct = Math.min(100, Math.round((item.progress / item.target) * 100));

            return (
              <div
                key={item.id}
                className={`glass-panel p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                  isUnlocked
                    ? 'border-rose-500/40 shadow-xl shadow-rose-600/10'
                    : 'border-slate-800/80 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        isUnlocked
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      {item.iconName === 'Flame' && <Flame className="w-6 h-6" />}
                      {item.iconName === 'Compass' && <Compass className="w-6 h-6" />}
                      {item.iconName === 'Zap' && <Zap className="w-6 h-6" />}
                      {item.iconName === 'Wind' && <Wind className="w-6 h-6" />}
                      {item.iconName === 'Trophy' && <Trophy className="w-6 h-6" />}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isUnlocked
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {isUnlocked ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> UNLOCKED
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" /> LOCKED
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="font-heading text-lg font-black text-white mb-1">{item.title}</h3>
                  <p className="text-slate-300 text-xs leading-relaxed mb-6">{item.description}</p>
                </div>

                <div>
                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                      <span>PROGRESS</span>
                      <span className="text-white font-bold">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isUnlocked
                            ? 'bg-gradient-to-r from-rose-500 to-purple-500'
                            : 'bg-gradient-to-r from-slate-600 to-slate-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Reward Badge */}
                  <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 flex items-center gap-2.5 text-xs">
                    <Gift className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="truncate">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">REWARD UNLOCK</div>
                      <div className="font-semibold text-white truncate">{item.reward}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
