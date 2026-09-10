import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import {
  CarModel,
  TrackData,
  ControlState,
  DriftStats,
  GameMode,
} from '../types';
import { DriftPhysicsEngine } from './physics';
import { buildCar3D, Car3DInstance } from './carBuilder';
import { buildTrack, BuiltTrack } from './trackBuilder';
import { ParticleSystem, SkidmarkManager } from './particles';
import { soundEngine } from '../audio/soundEngine';
import {
  Gauge,
  Flame,
  Volume2,
  VolumeX,
  Music,
  RotateCcw,
  Camera,
  Maximize2,
  Pause,
  Play,
  ArrowLeft,
  Zap,
  Trophy,
  Compass,
} from 'lucide-react';

interface DriftGameProps {
  selectedCar: CarModel;
  selectedTrack: TrackData;
  gameMode: GameMode;
  onExit: () => void;
  onScoreSubmit?: (score: number, maxCombo: number, maxAngle: number) => void;
}

type CameraMode = 'chase' | 'hood' | 'orbit' | 'top';

export const DriftGame: React.FC<DriftGameProps> = ({
  selectedCar,
  selectedTrack,
  gameMode: _gameMode,
  onExit,
  onScoreSubmit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // UI state
  const [stats, setStats] = useState<DriftStats>({
    currentScore: 0,
    combo: 1.0,
    comboTimer: 0,
    driftAngle: 0,
    speed: 0,
    isDrifting: false,
    nitroAmount: 100,
    driftQuality: 'NONE',
  });

  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [isMusicOn, setIsMusicOn] = useState(soundEngine.getMusicEnabled());
  const [gameOver, setGameOver] = useState(false);
  const [sessionMaxAngle, setSessionMaxAngle] = useState(0);
  const [sessionMaxCombo, setSessionMaxCombo] = useState(1);
  const [lapTime, setLapTime] = useState(0);
  const [rpmGauge, setRpmGauge] = useState(1000);
  const [gear, setGear] = useState('1');

  // Input states
  const controlsRef = useRef<ControlState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
    nitro: false,
  });

  // Mobile touch active state
  const [touchControls, setTouchControls] = useState<ControlState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
    nitro: false,
  });

  // Refs for animation loop
  const physicsEngineRef = useRef<DriftPhysicsEngine | null>(null);
  const car3DRef = useRef<Car3DInstance | null>(null);
  const track3DRef = useRef<BuiltTrack | null>(null);
  const particleSysRef = useRef<ParticleSystem | null>(null);
  const skidmarkMgrRef = useRef<SkidmarkManager | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const reqIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const lastRearLeftPos = useRef<THREE.Vector3 | null>(null);
  const lastRearRightPos = useRef<THREE.Vector3 | null>(null);

  // Sync touch controls with controlsRef
  const updateTouch = useCallback((key: keyof ControlState, value: boolean) => {
    controlsRef.current[key] = value;
    setTouchControls((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      soundEngine.resume();

      if (e.key === 'Escape') {
        setIsPaused((p) => !p);
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        resetVehicle();
        return;
      }
      if (e.key === 'c' || e.key === 'C') {
        cycleCamera();
        return;
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          controlsRef.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          controlsRef.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          controlsRef.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          controlsRef.current.right = true;
          break;
        case 'Space':
          controlsRef.current.handbrake = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          controlsRef.current.nitro = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          controlsRef.current.forward = false;
          soundEngine.playBlowOff();
          break;
        case 'KeyS':
        case 'ArrowDown':
          controlsRef.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          controlsRef.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          controlsRef.current.right = false;
          break;
        case 'Space':
          controlsRef.current.handbrake = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          controlsRef.current.nitro = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const resetVehicle = () => {
    if (physicsEngineRef.current && track3DRef.current) {
      physicsEngineRef.current.reset(
        track3DRef.current.startPosition,
        track3DRef.current.startHeading
      );
      soundEngine.playClick();
    }
  };

  const cycleCamera = () => {
    setCameraMode((prev) => {
      if (prev === 'chase') return 'hood';
      if (prev === 'hood') return 'orbit';
      if (prev === 'orbit') return 'top';
      return 'chase';
    });
    soundEngine.playClick();
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    soundEngine.init();
    soundEngine.startMusic();

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06080e);
    scene.fog = new THREE.FogExp2(0x070912, 0.0075);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1200);
    camera.position.set(0, 5, -10);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    containerRef.current.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // Environment Lighting
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(60, 120, 60);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 400;
    const d = 120;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Build Track
    const builtTrack = buildTrack(selectedTrack);
    scene.add(builtTrack.group);
    track3DRef.current = builtTrack;

    // Build Car
    const builtCar = buildCar3D(selectedCar);
    scene.add(builtCar.group);
    car3DRef.current = builtCar;

    // Physics Engine
    const physics = new DriftPhysicsEngine(
      selectedCar,
      builtTrack.startPosition,
      builtTrack.startHeading
    );
    physicsEngineRef.current = physics;

    // Particle & Skidmark Systems
    const particles = new ParticleSystem(scene);
    particleSysRef.current = particles;

    const skids = new SkidmarkManager(scene);
    skidmarkMgrRef.current = skids;

    // Resize listener
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    lastTimeRef.current = performance.now();

    const animate = (time: number) => {
      reqIdRef.current = requestAnimationFrame(animate);

      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      if (!isPaused && physics && builtCar && builtTrack) {
        // Run physics step
        const currentStats = physics.update(dt, controlsRef.current, builtTrack.colliders);
        setStats(currentStats);

        setSessionMaxAngle((prev) => Math.max(prev, currentStats.driftAngle));
        setSessionMaxCombo((prev) => Math.max(prev, currentStats.combo));
        setLapTime((t) => t + dt);

        // RPM & Gear calculation for tachometer
        const speed = currentStats.speed;
        let currentGear = '1';
        let calcRpm = 1000;

        if (speed < 45) {
          currentGear = '1';
          calcRpm = 1000 + (speed / 45) * 6500;
        } else if (speed < 90) {
          currentGear = '2';
          calcRpm = 2500 + ((speed - 45) / 45) * 5500;
        } else if (speed < 140) {
          currentGear = '3';
          calcRpm = 3200 + ((speed - 90) / 50) * 5200;
        } else if (speed < 190) {
          currentGear = '4';
          calcRpm = 3800 + ((speed - 140) / 50) * 4800;
        } else {
          currentGear = '5';
          calcRpm = 4200 + ((speed - 190) / 70) * 4500;
        }

        if (controlsRef.current.nitro) calcRpm = Math.min(8800, calcRpm + 900);
        setGear(currentGear);
        setRpmGauge(Math.round(calcRpm));

        // Audio update
        soundEngine.updatePhysics(
          currentStats.speed,
          currentStats.isDrifting,
          currentStats.driftAngle,
          controlsRef.current.forward,
          controlsRef.current.nitro && controlsRef.current.forward
        );

        // Update Car 3D Transform
        const pState = physics.state;
        builtCar.group.position.copy(pState.position);
        builtCar.group.rotation.set(pState.pitch, pState.heading, pState.roll);

        // Update steer wheels
        builtCar.frontLeftPivot.rotation.y = pState.steerAngle;
        builtCar.frontRightPivot.rotation.y = pState.steerAngle;

        // Rotate wheel meshes
        builtCar.wheelMeshes[0].rotation.x = pState.wheelRotations[0];
        builtCar.wheelMeshes[1].rotation.x = pState.wheelRotations[1];
        builtCar.wheelMeshes[2].rotation.x = pState.wheelRotations[2];
        builtCar.wheelMeshes[3].rotation.x = pState.wheelRotations[3];

        // Taillight glow on braking / reverse
        const isBraking = controlsRef.current.backward || controlsRef.current.handbrake;
        builtCar.taillights.forEach((t) => {
          (t.material as THREE.MeshBasicMaterial).color.setHex(isBraking ? 0xff002b : 0xaa0e20);
        });

        // Compute tire world positions
        const carWorldPos = pState.position;
        const carYaw = pState.heading;

        const leftTireOffset = new THREE.Vector3(0.96, 0.15, -1.35).applyAxisAngle(new THREE.Vector3(0, 1, 0), carYaw);
        const rightTireOffset = new THREE.Vector3(-0.96, 0.15, -1.35).applyAxisAngle(new THREE.Vector3(0, 1, 0), carYaw);

        const leftTirePos = carWorldPos.clone().add(leftTireOffset);
        const rightTirePos = carWorldPos.clone().add(rightTireOffset);

        // Particle Smoke Emission
        if (currentStats.isDrifting || (controlsRef.current.forward && currentStats.speed < 25) || controlsRef.current.handbrake) {
          const smokeDensity = currentStats.driftAngle > 40 ? 4 : 2;
          particles.emitSmoke(leftTirePos, rightTirePos, smokeDensity);

          // Deposit Skidmarks
          if (lastRearLeftPos.current && lastRearRightPos.current) {
            skids.addMark(lastRearLeftPos.current, leftTirePos, 0.28);
            skids.addMark(lastRearRightPos.current, rightTirePos, 0.28);
          }
        }

        lastRearLeftPos.current = leftTirePos.clone();
        lastRearRightPos.current = rightTirePos.clone();

        // Update Nitro / Exhaust flame particles
        const exhaustL = carWorldPos.clone().add(builtCar.exhaustLeft.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), carYaw));
        const exhaustR = carWorldPos.clone().add(builtCar.exhaustRight.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), carYaw));
        particles.updateFlames(
          exhaustL,
          exhaustR,
          carYaw,
          controlsRef.current.nitro && controlsRef.current.forward && pState.nitroAmount > 0,
          calcRpm > 7200
        );

        particles.update(dt);

        // Camera Update
        updateCamera(camera, pState, dt, cameraMode);
      }

      renderer.render(scene, camera);
    };

    reqIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      window.removeEventListener('resize', handleResize);
      particles.cleanup();
      skids.cleanup();
      renderer.dispose();
    };
  }, [selectedCar, selectedTrack, isPaused, cameraMode]);

  // Smooth dynamic camera positioning
  const updateCamera = (
    camera: THREE.PerspectiveCamera,
    pState: DriftPhysicsEngine['state'],
    dt: number,
    mode: CameraMode
  ) => {
    const carPos = pState.position;
    const yaw = pState.heading;

    if (mode === 'chase') {
      // Dynamic chase cam that lags slightly during fast slides for dramatic angle view
      const behindDist = 6.8 + (pState.speedKmh / 200) * 2.2;
      const camHeight = 2.4 + (pState.speedKmh / 200) * 0.6;

      const idealOffset = new THREE.Vector3(
        -Math.sin(yaw) * behindDist,
        camHeight,
        -Math.cos(yaw) * behindDist
      );

      const targetCamPos = carPos.clone().add(idealOffset);
      camera.position.lerp(targetCamPos, Math.min(1.0, 12 * dt));

      const lookTarget = carPos.clone().add(new THREE.Vector3(
        Math.sin(yaw) * 4,
        1.1,
        Math.cos(yaw) * 4
      ));
      camera.lookAt(lookTarget);

      // Dynamic FOV kick on high speed & nitro
      const baseFov = pState.nitroActive ? 74 : 64;
      camera.fov = THREE.MathUtils.lerp(camera.fov, baseFov, 6 * dt);
      camera.updateProjectionMatrix();
    } else if (mode === 'hood') {
      // Cockpit / Hood camera
      const hoodOffset = new THREE.Vector3(0, 0.95, 0.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      camera.position.copy(carPos.clone().add(hoodOffset));

      const lookTarget = carPos.clone().add(new THREE.Vector3(
        Math.sin(yaw) * 20,
        0.8,
        Math.cos(yaw) * 20
      ));
      camera.lookAt(lookTarget);
    } else if (mode === 'orbit') {
      // Cinematic rotating showcase
      const angle = performance.now() * 0.0006;
      camera.position.set(
        carPos.x + Math.sin(angle) * 11,
        carPos.y + 3.2,
        carPos.z + Math.cos(angle) * 11
      );
      camera.lookAt(carPos.clone().add(new THREE.Vector3(0, 1, 0)));
    } else if (mode === 'top') {
      // Overhead tactical minimap view
      camera.position.set(carPos.x, carPos.y + 35, carPos.z);
      camera.lookAt(carPos);
    }
  };

  const handleFinishRun = () => {
    setGameOver(true);
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });
    if (onScoreSubmit) {
      onScoreSubmit(stats.currentScore, sessionMaxCombo, sessionMaxAngle);
    }
  };

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const toggleMusic = () => {
    const enabled = soundEngine.toggleMusic();
    setIsMusicOn(enabled);
  };

  return (
    <div className="relative w-full h-screen bg-[#07080c] overflow-hidden select-none font-sans">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* TOP HEADER HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between pointer-events-none z-20">
        {/* Left: Back & Track Title */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-xl text-slate-200 font-semibold text-sm transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-rose-500" />
            <span>EXIT TO HUB</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-950/70 backdrop-blur-md border border-slate-800 rounded-xl text-xs uppercase tracking-widest text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">{selectedTrack.name}</span>
            <span className="text-slate-500">|</span>
            <span className="text-rose-400 font-bold">{selectedCar.name}</span>
          </div>
        </div>

        {/* Center: Live Drift Score & Combo Meter */}
        <div className="flex flex-col items-center pointer-events-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">DRIFT SCORE</span>
            <span className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-wider text-glow-red">
              {stats.currentScore.toLocaleString()}
            </span>
          </div>

          {/* Combo Multiplier pill */}
          {stats.combo > 1.0 && (
            <div className="mt-1 flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-rose-600 to-purple-600 rounded-full text-white font-heading font-black text-sm tracking-wider shadow-lg shadow-rose-500/30 animate-pulse">
              <Flame className="w-4 h-4 text-yellow-300" />
              <span>{stats.combo.toFixed(1)}x COMBO</span>
              {stats.driftQuality !== 'NONE' && (
                <span className="text-xs font-bold text-yellow-300 bg-black/40 px-2 py-0.5 rounded-full">
                  {stats.driftQuality}
                </span>
              )}
            </div>
          )}

          {/* Combo countdown bar */}
          {stats.comboTimer > 0 && (
            <div className="w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5 border border-slate-700/50">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-rose-500 transition-all duration-75"
                style={{ width: `${(stats.comboTimer / 2.2) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Right: Camera, Audio, Pause Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={cycleCamera}
            title="Switch Camera (C)"
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-xl text-slate-200 hover:text-white transition"
          >
            <Camera className="w-4 h-4 text-sky-400" />
          </button>

          <button
            onClick={toggleSound}
            title="Toggle Engine Sound"
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-xl text-slate-200 hover:text-white transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={toggleMusic}
            title="Toggle Synth Beat"
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-xl text-slate-200 hover:text-white transition"
          >
            <Music className={`w-4 h-4 ${isMusicOn ? 'text-purple-400' : 'text-slate-500'}`} />
          </button>

          <button
            onClick={resetVehicle}
            title="Reset Car (R)"
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700/60 rounded-xl text-slate-200 hover:text-white transition"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={() => setIsPaused((p) => !p)}
            title="Pause (Esc)"
            className="p-2.5 bg-rose-600/90 hover:bg-rose-500 backdrop-blur-md rounded-xl text-white font-bold transition shadow-lg shadow-rose-600/30"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* BOTTOM-LEFT: DRIFT ANGLE & NITRO METER */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-3 pointer-events-none z-20">
        {/* Drift Angle Gauge */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 flex items-center gap-4 min-w-[200px]">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={stats.driftAngle > 50 ? 'text-yellow-400' : stats.driftAngle > 30 ? 'text-rose-500' : 'text-sky-400'}
                strokeDasharray={`${Math.min(100, (stats.driftAngle / 75) * 100)}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <Compass className="w-4 h-4 text-slate-400 mb-0.5" />
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">DRIFT ANGLE</div>
            <div className="font-heading text-2xl font-black text-white">
              {stats.driftAngle}°
            </div>
            <div className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">
              {stats.driftAngle > 55 ? 'PERFECT LOCK' : stats.driftAngle > 30 ? 'HIGH ANGLE' : 'STRAIGHTENING'}
            </div>
          </div>
        </div>

        {/* Nitro NOS Gauge */}
        <div className="glass-panel px-4 py-3 rounded-2xl border border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span>NOS BOOST (SHIFT)</span>
              <span className="text-sky-400">{stats.nitroAmount}%</span>
            </div>
            <div className="w-36 h-2 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/40">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-all duration-100 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                style={{ width: `${stats.nitroAmount}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM-RIGHT: DIGITAL SPEEDOMETER & TACHOMETER */}
      <div className="absolute bottom-6 right-6 pointer-events-none z-20">
        <div className="glass-panel p-5 rounded-3xl border border-slate-800/90 shadow-2xl flex items-center gap-5">
          {/* Gear Indicator */}
          <div className="flex flex-col items-center justify-center px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider">GEAR</span>
            <span className="font-heading text-3xl font-black text-rose-500">{gear}</span>
          </div>

          {/* Speed Number */}
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="font-heading text-5xl sm:text-6xl font-black text-white tracking-tight">
                {stats.speed}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">KM/H</span>
            </div>

            {/* RPM Tachometer Bar */}
            <div className="mt-2 flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              <div className="w-40 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 flex">
                <div
                  className={`h-full transition-all duration-75 ${
                    rpmGauge > 7800
                      ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-pulse'
                      : rpmGauge > 5500
                      ? 'bg-yellow-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, (rpmGauge / 8500) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">{rpmGauge}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE / TOUCH CONTROLS OVERLAY (VISIBLE ON PHONES / TOUCH DEVICES) */}
      <div className="sm:hidden absolute bottom-28 left-0 right-0 px-4 flex justify-between items-end pointer-events-auto z-30">
        {/* Left Touch: Steering */}
        <div className="flex gap-2">
          <button
            onPointerDown={() => updateTouch('left', true)}
            onPointerUp={() => updateTouch('left', false)}
            onPointerLeave={() => updateTouch('left', false)}
            className={`w-16 h-16 rounded-2xl border flex items-center justify-center font-heading font-black text-xl active:scale-95 transition backdrop-blur-md ${
              touchControls.left
                ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/40'
                : 'bg-slate-900/80 text-slate-200 border-slate-700/60'
            }`}
          >
            ◀
          </button>
          <button
            onPointerDown={() => updateTouch('right', true)}
            onPointerUp={() => updateTouch('right', false)}
            onPointerLeave={() => updateTouch('right', false)}
            className={`w-16 h-16 rounded-2xl border flex items-center justify-center font-heading font-black text-xl active:scale-95 transition backdrop-blur-md ${
              touchControls.right
                ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/40'
                : 'bg-slate-900/80 text-slate-200 border-slate-700/60'
            }`}
          >
            ▶
          </button>
        </div>

        {/* Center: Handbrake & Nitro */}
        <div className="flex flex-col gap-2">
          <button
            onPointerDown={() => updateTouch('nitro', true)}
            onPointerUp={() => updateTouch('nitro', false)}
            onPointerLeave={() => updateTouch('nitro', false)}
            className={`px-4 py-2.5 rounded-xl border flex items-center justify-center gap-1 font-bold text-xs uppercase tracking-wider transition backdrop-blur-md ${
              touchControls.nitro
                ? 'bg-sky-500 text-white border-sky-300 shadow-lg shadow-sky-500/40'
                : 'bg-slate-900/80 text-sky-400 border-sky-600/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            NOS
          </button>
          <button
            onPointerDown={() => updateTouch('handbrake', true)}
            onPointerUp={() => updateTouch('handbrake', false)}
            onPointerLeave={() => updateTouch('handbrake', false)}
            className={`px-4 py-2.5 rounded-xl border flex items-center justify-center font-bold text-xs uppercase tracking-wider transition backdrop-blur-md ${
              touchControls.handbrake
                ? 'bg-amber-500 text-black border-amber-300 shadow-lg shadow-amber-500/40'
                : 'bg-slate-900/80 text-amber-400 border-amber-600/40'
            }`}
          >
            BRAKE
          </button>
        </div>

        {/* Right Touch: Gas & Reverse */}
        <div className="flex gap-2">
          <button
            onPointerDown={() => updateTouch('backward', true)}
            onPointerUp={() => updateTouch('backward', false)}
            onPointerLeave={() => updateTouch('backward', false)}
            className={`w-16 h-16 rounded-2xl border flex items-center justify-center font-heading font-black text-sm active:scale-95 transition backdrop-blur-md ${
              touchControls.backward
                ? 'bg-rose-700 text-white border-rose-500'
                : 'bg-slate-900/80 text-slate-300 border-slate-700/60'
            }`}
          >
            REV
          </button>
          <button
            onPointerDown={() => updateTouch('forward', true)}
            onPointerUp={() => {
              updateTouch('forward', false);
              soundEngine.playBlowOff();
            }}
            onPointerLeave={() => updateTouch('forward', false)}
            className={`w-16 h-16 rounded-2xl border flex items-center justify-center font-heading font-black text-lg active:scale-95 transition backdrop-blur-md ${
              touchControls.forward
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/40'
                : 'bg-slate-900/80 text-emerald-400 border-slate-700/60'
            }`}
          >
            GAS
          </button>
        </div>
      </div>

      {/* PAUSE MODAL */}
      {isPaused && !gameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel-glow max-w-md w-full p-8 rounded-3xl text-center flex flex-col items-center">
            <h2 className="font-heading text-3xl font-black text-white tracking-wider mb-2">GAME PAUSED</h2>
            <p className="text-slate-400 text-sm mb-6">Take a breath, cool your tires, and get ready to slide.</p>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-heading font-bold text-sm tracking-wider rounded-xl transition shadow-lg shadow-rose-600/40 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> RESUME DRIFTING
              </button>
              <button
                onClick={() => {
                  resetVehicle();
                  setIsPaused(false);
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" /> RESTART TRACK
              </button>
              <button
                onClick={handleFinishRun}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4 text-yellow-400" /> FINISH & SUBMIT SCORE
              </button>
              <button
                onClick={onExit}
                className="w-full py-3 bg-transparent hover:bg-slate-800/40 text-slate-400 font-semibold text-sm rounded-xl transition"
              >
                RETURN TO GARAGE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER / RESULTS MODAL */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
          <div className="glass-panel-glow max-w-lg w-full p-8 rounded-3xl text-center flex flex-col items-center border border-rose-500/40 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-yellow-300 mb-4 shadow-lg shadow-rose-600/30">
              <Trophy className="w-8 h-8" />
            </div>

            <h2 className="font-heading text-3xl font-black text-white tracking-wider">DRIFT RUN COMPLETE</h2>
            <p className="text-slate-400 text-sm mb-6">Incredible session on {selectedTrack.name} with {selectedCar.name}</p>

            {/* Score Showcase */}
            <div className="w-full grid grid-cols-3 gap-3 mb-6">
              <div className="glass-panel p-3.5 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TOTAL SCORE</div>
                <div className="font-heading text-2xl font-black text-rose-500">
                  {stats.currentScore.toLocaleString()}
                </div>
              </div>
              <div className="glass-panel p-3.5 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">MAX ANGLE</div>
                <div className="font-heading text-2xl font-black text-sky-400">{sessionMaxAngle}°</div>
              </div>
              <div className="glass-panel p-3.5 rounded-2xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">MAX COMBO</div>
                <div className="font-heading text-2xl font-black text-yellow-400">{sessionMaxCombo.toFixed(1)}x</div>
              </div>
            </div>

            <div className="w-full flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setGameOver(false);
                  resetVehicle();
                }}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-heading font-bold text-sm tracking-wider rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> PLAY AGAIN
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-heading font-bold text-sm tracking-wider rounded-xl transition"
              >
                BACK TO MAIN HUB
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
