import React from 'react';
import { Compass, Zap, Flame, RotateCcw, ShieldCheck, Smartphone, Keyboard } from 'lucide-react';

export const HowToPlay: React.FC = () => {
  return (
    <section id="how-to-play" className="relative w-full py-24 bg-[#090b12] text-white border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-sky-500/30 text-xs font-bold uppercase tracking-widest text-sky-400 mb-3">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>DRIFT MASTERCLASS</span>
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-4">
            HOW TO <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-rose-500">PLAY.</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Master rear-wheel-drive physics, weight transfer, and counter-steering to sustain high-angle drifts.
          </p>
        </div>

        {/* 4 Core Drifting Techniques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* Step 1: Entry */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/90 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-heading font-black text-base mb-4">
                01
              </div>
              <h3 className="font-heading text-lg font-black text-white mb-2">INITIATION</h3>
              <p className="text-slate-300 text-xs leading-relaxed mb-4">
                Approach the turn at high speed (70+ km/h). Tap <strong className="text-white">SPACE (Handbrake)</strong> or quickly flick steering opposite then sharply inward to break rear traction.
              </p>
            </div>
            <div className="text-[11px] font-mono text-rose-400 bg-rose-950/30 p-2.5 rounded-xl border border-rose-900/40">
              Pro Tip: Feint drift builds maximum inertia.
            </div>
          </div>

          {/* Step 2: Counter Steer */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/90 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-heading font-black text-base mb-4">
                02
              </div>
              <h3 className="font-heading text-lg font-black text-white mb-2">COUNTER-STEER</h3>
              <p className="text-slate-300 text-xs leading-relaxed mb-4">
                The instant the rear kicks out, turn front wheels into the direction of the slide to prevent spin-out and lock the car at a stable 40°-65° angle.
              </p>
            </div>
            <div className="text-[11px] font-mono text-sky-400 bg-sky-950/30 p-2.5 rounded-xl border border-sky-900/40">
              Pro Tip: Don't over-correct or you'll straighten out.
            </div>
          </div>

          {/* Step 3: Throttle Control */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/90 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center justify-center font-heading font-black text-base mb-4">
                03
              </div>
              <h3 className="font-heading text-lg font-black text-white mb-2">THROTTLE BALANCE</h3>
              <p className="text-slate-300 text-xs leading-relaxed mb-4">
                Feather <strong className="text-white">W (Gas)</strong> to hold the radius. More gas pushes the rear wider; tapping brake tightens the trajectory closer to the apex.
              </p>
            </div>
            <div className="text-[11px] font-mono text-yellow-400 bg-yellow-950/30 p-2.5 rounded-xl border border-yellow-900/40">
              Pro Tip: Listen for the turbo blow-off hiss.
            </div>
          </div>

          {/* Step 4: Combo & Nitro */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/90 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-heading font-black text-base mb-4">
                04
              </div>
              <h3 className="font-heading text-lg font-black text-white mb-2">CHAIN & BOOST</h3>
              <p className="text-slate-300 text-xs leading-relaxed mb-4">
                Hit <strong className="text-white">SHIFT (Nitro)</strong> to extend your slide across straights. Transition smoothly into the next corner within 2.2 seconds to keep the combo alive!
              </p>
            </div>
            <div className="text-[11px] font-mono text-purple-400 bg-purple-950/30 p-2.5 rounded-xl border border-purple-900/40">
              Pro Tip: Combos multiply score up to 20x!
            </div>
          </div>
        </div>

        {/* Controls Layout Cards (Keyboard + Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Keyboard Controls */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/90 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest mb-4">
              <Keyboard className="w-4 h-4" />
              <span>DESKTOP CONTROLS</span>
            </div>
            <h3 className="font-heading text-2xl font-black text-white mb-6">KEYBOARD BINDINGS</h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-slate-400">Accelerate / Throttle</span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-md font-mono font-bold text-white">W / UP</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-slate-400">Brake / Reverse</span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-md font-mono font-bold text-white">S / DOWN</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-slate-400">Steer Left / Right</span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-md font-mono font-bold text-white">A / D</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-slate-400">Handbrake Drift</span>
                <span className="px-2.5 py-1 bg-rose-600/30 border border-rose-500/50 rounded-md font-mono font-bold text-rose-400">SPACE</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-slate-400">NOS Nitro Boost</span>
                <span className="px-2.5 py-1 bg-sky-600/30 border border-sky-500/50 rounded-md font-mono font-bold text-sky-400">SHIFT</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-slate-400">Switch Camera</span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-md font-mono font-bold text-white">C</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-slate-400">Reset Vehicle</span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-md font-mono font-bold text-amber-400">R</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-slate-400">Pause Menu</span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-md font-mono font-bold text-white">ESC</span>
              </div>
            </div>
          </div>

          {/* Mobile Touch Controls */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/90 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-widest mb-4">
                <Smartphone className="w-4 h-4" />
                <span>TOUCHSCREEN CONTROLS</span>
              </div>
              <h3 className="font-heading text-2xl font-black text-white mb-4">MOBILE / TABLET READY</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                DRIFT X features responsive on-screen touch pedals and steering buttons optimized for comfortable two-thumb arcade control on smartphones and tablets.
              </p>

              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span><strong>Left Thumb:</strong> Responsive left/right directional steering buttons.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span><strong>Right Thumb:</strong> Large Gas accelerator and Reverse / Footbrake.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span><strong>Quick Taps:</strong> Central Handbrake button and NOS booster.</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full 60 FPS hardware-accelerated WebGL performance.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
