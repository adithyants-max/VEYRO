import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { CarModel } from '../types';
import { CARS_DATA } from '../data/gameData';
import { buildCar3D, Car3DInstance } from '../game/carBuilder';
import { soundEngine } from '../audio/soundEngine';
import {
  Gauge,
  Zap,
  Flame,
  Award,
  ChevronRight,
  RotateCw,
  Palette,
  Cpu,
  CircleDot,
} from 'lucide-react';

interface FeaturedCarsProps {
  onSelectCarAndPlay: (car: CarModel) => void;
}

const COLOR_SWATCHES = [
  { name: 'Crimson Fury', hex: '#e11d48', neon: '#f43f5e' },
  { name: 'Cyber Blue', hex: '#2563eb', neon: '#38bdf8' },
  { name: 'Midnight Violet', hex: '#7c3aed', neon: '#c084fc' },
  { name: 'Acid Toxic', hex: '#10b981', neon: '#34d399' },
  { name: 'Ghost Panda', hex: '#f8fafc', neon: '#f43f5e' },
  { name: 'Matte Stealth', hex: '#18181b', neon: '#ef4444' },
];

export const FeaturedCars: React.FC<FeaturedCarsProps> = ({ onSelectCarAndPlay }) => {
  const [selectedCarIndex, setSelectedCarIndex] = useState(0);
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [customNeon, setCustomNeon] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const carInstanceRef = useRef<Car3DInstance | null>(null);

  const currentCarData = CARS_DATA[selectedCarIndex];
  const activeCar: CarModel = {
    ...currentCarData,
    bodyColor: customColor || currentCarData.bodyColor,
    neonColor: customNeon || currentCarData.neonColor,
  };

  // 3D Turntable Scene
  useEffect(() => {
    if (!canvasRef.current) return;
    const container = canvasRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(4.8, 2.2, 5.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.replaceChildren(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(5, 7, 5);
    scene.add(keyLight);

    const backRim = new THREE.DirectionalLight(new THREE.Color(activeCar.neonColor), 3.5);
    backRim.position.set(-6, 3, -6);
    scene.add(backRim);

    // Platform ring
    const platformGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.15, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x111420,
      metalness: 0.8,
      roughness: 0.3,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.07;
    scene.add(platform);

    const ringGeo = new THREE.TorusGeometry(3.6, 0.05, 16, 64);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(activeCar.neonColor) });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.01;
    scene.add(ring);

    // Build 3D Car
    const car3D = buildCar3D(activeCar);
    scene.add(car3D.group);
    carInstanceRef.current = car3D;

    let reqId: number;
    let rotation = 0;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      rotation += 0.007;
      car3D.group.rotation.y = rotation;
      ring.rotation.z = -rotation * 0.5;
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
  }, [selectedCarIndex, customColor, customNeon]);

  const handleSelectCarTab = (index: number) => {
    soundEngine.playClick();
    setSelectedCarIndex(index);
    setCustomColor(null);
    setCustomNeon(null);
  };

  const handleApplyColor = (color: typeof COLOR_SWATCHES[0]) => {
    soundEngine.playClick();
    setCustomColor(color.hex);
    setCustomNeon(color.neon);
  };

  return (
    <section id="cars" className="relative w-full py-24 bg-[#090b12] text-white overflow-hidden border-t border-slate-800/80">
      {/* Background accents */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest mb-2">
              <Flame className="w-4 h-4" />
              <span>THE DRIFT X FLEET</span>
            </div>
            <h2 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
              FEATURED <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-purple-500">CARS.</span>
            </h2>
          </div>
          <p className="max-w-md text-slate-400 text-sm mt-3 md:mt-0">
            Precision weight balance, extreme steering lock angles, and tuned horsepower for sustained smoke clouds.
          </p>
        </div>

        {/* Car Selector Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {CARS_DATA.map((car, idx) => {
            const isSelected = idx === selectedCarIndex;
            return (
              <button
                key={car.id}
                onClick={() => handleSelectCarTab(idx)}
                className={`p-4 rounded-2xl text-left transition-all duration-200 border relative overflow-hidden ${
                  isSelected
                    ? 'glass-panel-glow border-rose-500/60 shadow-lg shadow-rose-600/20'
                    : 'glass-panel border-slate-800/70 hover:border-slate-700 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  CLASS: {car.class}
                </div>
                <div className="font-heading font-black text-lg text-white truncate">
                  {car.name}
                </div>
                <div className="text-xs text-rose-400 font-semibold truncate mt-0.5">
                  {car.horsepower} HP | {car.specs.engine}
                </div>
              </button>
            );
          })}
        </div>

        {/* Main 3D Showcase & Spec Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 3D Turntable Viewer (7 cols) */}
          <div className="lg:col-span-7 glass-panel rounded-3xl border border-slate-800/90 p-4 sm:p-6 relative min-h-[380px] sm:min-h-[460px] flex flex-col justify-between overflow-hidden">
            {/* Top Bar inside viewer */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs uppercase tracking-widest font-mono text-slate-300">
                  3D REAL-TIME TURNTABLE
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-xs font-mono">
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>AUTOROTATING</span>
              </div>
            </div>

            {/* Three.js Canvas Container */}
            <div ref={canvasRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

            {/* Bottom Color Swatches Bar */}
            <div className="z-10 mt-auto pt-4 flex flex-wrap items-center justify-between gap-3 bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  LIVERY PAINT:
                </span>
              </div>
              <div className="flex items-center gap-2">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleApplyColor(color)}
                    title={color.name}
                    className="w-7 h-7 rounded-full border-2 border-white/20 hover:border-white transition-all transform hover:scale-110 shadow-md"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Specs & Tuning Info (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/90 shadow-2xl">
              <div className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-1">
                {activeCar.brandSubtitle}
              </div>
              <h3 className="font-heading text-3xl font-black text-white mb-3">
                {activeCar.name}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                {activeCar.description}
              </p>

              {/* Dynamic Stat Bars */}
              <div className="space-y-4 mb-6">
                {/* Horsepower */}
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-rose-400" /> HORSEPOWER
                    </span>
                    <span className="text-white font-mono">{activeCar.horsepower} HP</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${(activeCar.horsepower / 1000) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Handling / Angle */}
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-sky-400" /> DRIFT ANGLE CAPACITY
                    </span>
                    <span className="text-white font-mono">{activeCar.handling} / 100</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${activeCar.handling}%` }}
                    />
                  </div>
                </div>

                {/* Acceleration */}
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-yellow-400" /> ACCELERATION & SNAP
                    </span>
                    <span className="text-white font-mono">{activeCar.acceleration} / 100</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-500"
                      style={{ width: `${activeCar.acceleration}%` }}
                    />
                  </div>
                </div>

                {/* Drift Multiplier */}
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-400" /> SCORE BONUS MULTIPLIER
                    </span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {activeCar.driftScoreMultiplier}x
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${((activeCar.driftScoreMultiplier - 1.0) / 0.6) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Hardware Specs Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-8 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div>
                  <div className="text-slate-400 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-slate-400" /> Engine
                  </div>
                  <div className="font-semibold text-white mt-0.5 truncate">{activeCar.specs.engine}</div>
                </div>
                <div>
                  <div className="text-slate-400 flex items-center gap-1">
                    <CircleDot className="w-3 h-3 text-slate-400" /> Drivetrain
                  </div>
                  <div className="font-semibold text-white mt-0.5 truncate">{activeCar.specs.drivetrain}</div>
                </div>
                <div className="mt-2">
                  <div className="text-slate-400">Aspiration</div>
                  <div className="font-semibold text-white mt-0.5 truncate">{activeCar.specs.aspiration}</div>
                </div>
                <div className="mt-2">
                  <div className="text-slate-400">Tires</div>
                  <div className="font-semibold text-white mt-0.5 truncate">{activeCar.specs.tires}</div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button
                onClick={() => onSelectCarAndPlay(activeCar)}
                className="w-full py-4 bg-gradient-to-r from-rose-600 via-rose-500 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-heading font-black text-base uppercase tracking-wider rounded-2xl shadow-xl shadow-rose-600/30 hover:shadow-rose-600/50 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 border border-rose-400/30"
              >
                <span>SELECT & RACE THIS CAR</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
