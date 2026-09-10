import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Play, Sparkles, ChevronRight, Zap, ShieldAlert, Award } from 'lucide-react';
import { CARS_DATA } from '../data/gameData';
import { buildCar3D } from '../game/carBuilder';

interface HeroSectionProps {
  onPlayNow: () => void;
  onExploreCars: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onPlayNow, onExploreCars }) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // 3D Cinematic Car Showcase in Hero
  useEffect(() => {
    if (!canvasRef.current) return;
    const container = canvasRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080912, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.8, 1.8, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.replaceChildren(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0x334155, 1.2);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xf43f5e, 3.2); // Neon red key
    keyLight.position.set(6, 6, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 4.0); // Cyan rim light
    rimLight.position.set(-6, 4, -4);
    scene.add(rimLight);

    // Wet road floor with reflections
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c14,
      roughness: 0.18,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.01;
    scene.add(floor);

    // Grid lines on road
    const gridHelper = new THREE.GridHelper(40, 40, 0xf43f5e, 0x1e293b);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Load first drift car (APEX RX-7)
    const heroCar = buildCar3D(CARS_DATA[0]);
    scene.add(heroCar.group);

    // Turn on headlights and underglow
    heroCar.headlights.forEach((h) => (h.intensity = 5));
    heroCar.underglowLight.intensity = 4.5;

    // Subtle drift angle on front wheels
    heroCar.frontLeftPivot.rotation.y = 0.45;
    heroCar.frontRightPivot.rotation.y = 0.45;

    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Subtle dynamic camera orbit
      camera.position.x = 4.6 + Math.sin(elapsed * 0.4) * 0.8;
      camera.position.z = 5.2 + Math.cos(elapsed * 0.4) * 0.6;
      camera.position.y = 1.6 + Math.sin(elapsed * 0.3) * 0.2;
      camera.lookAt(0, 0.6, 0);

      // Subtle chassis breathing / suspension vibration
      heroCar.group.position.y = 0.02 + Math.sin(elapsed * 2.5) * 0.008;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <section className="relative w-full min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#07080c] pt-20 pb-16">
      {/* Background Gradient & Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-purple-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* 3D Showcase Canvas Background / Hero Car Container */}
      <div className="absolute inset-0 z-0 opacity-75 sm:opacity-85 pointer-events-auto">
        <div ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Atmospheric Fog / Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#07080c] via-transparent to-[#07080c]/60" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#07080c]/85 via-transparent to-[#07080c]/85" />

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 text-center flex flex-col items-center">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-rose-500/30 text-xs font-bold uppercase tracking-widest text-rose-400 mb-6 shadow-lg shadow-rose-500/10 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>NEXT-GEN BROWSER 3D DRIFTING</span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span className="text-white">v2.4 ARCADE</span>
        </div>

        {/* Main Heading */}
        <h1 className="font-heading text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight text-white mb-4 drop-shadow-2xl">
          MASTER THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-purple-500 to-sky-400 text-glow-red">SLIDE.</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-lg sm:text-xl md:text-2xl text-slate-300 font-medium tracking-wide mb-10 text-shadow">
          Push your limits. Burn your tires. Own the drift.
        </p>

        {/* CTA BUTTONS WITH ANIMATED TIRE SMOKE BEHIND THEM */}
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-md mx-auto">
          {/* Animated Tire Smoke Layers behind buttons */}
          <div className="absolute -inset-6 pointer-events-none flex items-center justify-center overflow-visible">
            <div className="w-48 h-24 bg-white/10 rounded-full blur-2xl animate-smoke" />
            <div className="w-56 h-28 bg-rose-500/15 rounded-full blur-3xl animate-smoke delay-700" />
            <div className="w-40 h-20 bg-sky-400/10 rounded-full blur-2xl animate-smoke delay-1000" />
          </div>

          {/* PLAY NOW BUTTON */}
          <button
            onClick={onPlayNow}
            className="group relative w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-rose-600 via-rose-500 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-heading font-black text-lg uppercase tracking-wider rounded-2xl shadow-xl shadow-rose-600/40 hover:shadow-rose-500/60 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 overflow-hidden border border-rose-400/40"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <Play className="w-5 h-5 fill-white text-white" />
            <span>PLAY NOW</span>
          </button>

          {/* EXPLORE CARS BUTTON */}
          <button
            onClick={onExploreCars}
            className="relative w-full sm:w-auto px-9 py-5 glass-panel hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-500 text-white font-heading font-bold text-base uppercase tracking-wider rounded-2xl transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <span>EXPLORE CARS</span>
            <ChevronRight className="w-4 h-4 text-rose-500 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Quick Highlights Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl text-left">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-heading font-bold text-base text-white">RWD PHYSICS</div>
              <div className="text-xs text-slate-400">Weight transfer & slip</div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="font-heading font-bold text-base text-white">3 TRACKS</div>
              <div className="text-xs text-slate-400">Tokyo, Akina & Docks</div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-heading font-bold text-base text-white">DYNAMIC SMOKE</div>
              <div className="text-xs text-slate-400">Skidmarks & NOS fire</div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="font-heading font-bold text-base text-white">GLOBAL RANKS</div>
              <div className="text-xs text-slate-400">Live combo multipliers</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
