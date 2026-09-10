import React, { useState } from 'react';
import { LeaderboardEntry } from '../types';
import { INITIAL_LEADERBOARD } from '../data/gameData';
import { Trophy, Medal, Flame, Compass, Filter } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface LeaderboardProps {
  userBestScore?: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ userBestScore = 0 }) => {
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>('all');
  const [leaderboard] = useState<LeaderboardEntry[]>(() => {
    return INITIAL_LEADERBOARD;
  });

  const filteredEntries = leaderboard.filter((entry) => {
    if (selectedTrackFilter === 'all') return true;
    return entry.trackId === selectedTrackFilter;
  });

  return (
    <section id="leaderboard" className="relative w-full py-24 bg-[#07080c] text-white border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs uppercase tracking-widest mb-2">
              <Trophy className="w-4 h-4" />
              <span>GLOBAL HALL OF SLIDE</span>
            </div>
            <h2 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
              DRIFT <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">LEADERBOARD.</span>
            </h2>
          </div>

          {/* Track Filter Pills */}
          <div className="mt-4 md:mt-0 flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
            {[
              { id: 'all', label: 'ALL TRACKS' },
              { id: 'neo-tokyo', label: 'NEO-TOKYO' },
              { id: 'mount-akina', label: 'AKINA PASS' },
              { id: 'docklands-arena', label: 'DOCKLANDS' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedTrackFilter(tab.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-bold tracking-wider transition whitespace-nowrap ${
                  selectedTrackFilter === tab.id
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 shadow-md shadow-yellow-500/10'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* User personal banner if they have played */}
        {userBestScore > 0 && (
          <div className="mb-6 p-4 rounded-2xl glass-panel border border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 via-transparent to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-500/20 text-yellow-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-yellow-400">YOUR CURRENT BEST SCORE</div>
                <div className="font-heading text-xl font-black text-white">{userBestScore.toLocaleString()} PTS</div>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400">Verified Player Session</span>
          </div>
        )}

        {/* Table Container */}
        <div className="glass-panel rounded-3xl border border-slate-800/90 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono uppercase tracking-widest text-slate-400">
                  <th className="py-4 px-6 text-center w-20">RANK</th>
                  <th className="py-4 px-6">DRIFTER</th>
                  <th className="py-4 px-6">VEHICLE</th>
                  <th className="py-4 px-6 text-right">DRIFT SCORE</th>
                  <th className="py-4 px-6 text-center">MAX COMBO</th>
                  <th className="py-4 px-6 text-center">MAX ANGLE</th>
                  <th className="py-4 px-6 text-right">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredEntries.map((entry) => {
                  const isGold = entry.rank === 1;
                  const isSilver = entry.rank === 2;
                  const isBronze = entry.rank === 3;

                  return (
                    <tr
                      key={`${entry.rank}-${entry.playerName}`}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Rank badge */}
                      <td className="py-4 px-6 text-center">
                        {isGold ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 font-heading font-black">
                            <Medal className="w-4 h-4" />
                          </div>
                        ) : isSilver ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-300/20 text-slate-300 border border-slate-300/40 font-heading font-black">
                            2
                          </div>
                        ) : isBronze ? (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-700/20 text-amber-500 border border-amber-600/40 font-heading font-black">
                            3
                          </div>
                        ) : (
                          <span className="font-heading font-bold text-slate-500">#{entry.rank}</span>
                        )}
                      </td>

                      {/* Player Name */}
                      <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>{entry.playerName}</span>
                      </td>

                      {/* Car */}
                      <td className="py-4 px-6 text-slate-300 font-semibold text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                          {entry.car}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="py-4 px-6 text-right font-heading font-black text-base text-rose-500">
                        {entry.score.toLocaleString()}
                      </td>

                      {/* Max Combo */}
                      <td className="py-4 px-6 text-center font-bold text-yellow-400 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" />
                          {entry.maxCombo}x
                        </span>
                      </td>

                      {/* Max Angle */}
                      <td className="py-4 px-6 text-center font-bold text-sky-400 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Compass className="w-3.5 h-3.5" />
                          {entry.maxAngle}°
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-right text-xs text-slate-400 font-mono">
                        {entry.date}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
