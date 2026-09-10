import React, { useState } from 'react';
import { CARS_DATA, TRACKS_DATA } from './data/gameData';
import { CarModel, TrackData, GameMode } from './types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeaturedCars } from './components/FeaturedCars';
import { TrackSelector } from './components/TrackSelector';
import { GameModes } from './components/GameModes';
import { Leaderboard } from './components/Leaderboard';
import { HowToPlay } from './components/HowToPlay';
import { Achievements } from './components/Achievements';
import { Footer } from './components/Footer';
import { DriftGame } from './game/DriftGame';
import { soundEngine } from './audio/soundEngine';
import { Play } from 'lucide-react';

export default function App() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedCar, setSelectedCar] = useState<CarModel>(CARS_DATA[0]);
  const [selectedTrack, setSelectedTrack] = useState<TrackData>(TRACKS_DATA[0]);
  const [gameMode, setGameMode] = useState<GameMode>('freestyle');
  const [userBestScore, setUserBestScore] = useState<number>(0);

  // Play button actions
  const handlePlayNow = () => {
    soundEngine.resume();
    soundEngine.playClick();
    setIsPlaying(true);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleSelectCarAndPlay = (car: CarModel) => {
    soundEngine.resume();
    soundEngine.playClick();
    setSelectedCar(car);
    setIsPlaying(true);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handlePlayTrack = (track: TrackData) => {
    soundEngine.resume();
    soundEngine.playClick();
    setSelectedTrack(track);
    setIsPlaying(true);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleSelectModeAndPlay = (mode: GameMode) => {
    soundEngine.resume();
    soundEngine.playClick();
    setGameMode(mode);
    setIsPlaying(true);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleExitGame = () => {
    soundEngine.playClick();
    setIsPlaying(false);
  };

  const handleScoreSubmit = (score: number, _maxCombo: number, _maxAngle: number) => {
    setUserBestScore((prev) => Math.max(prev, score));
  };

  const handleScrollToCars = () => {
    soundEngine.playClick();
    const el = document.getElementById('cars');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // If in game mode, render playable 3D WebGL drifting game
  if (isPlaying) {
    return (
      <DriftGame
        selectedCar={selectedCar}
        selectedTrack={selectedTrack}
        gameMode={gameMode}
        onExit={handleExitGame}
        onScoreSubmit={handleScoreSubmit}
      />
    );
  }

  // Otherwise, render full gaming website hub
  return (
    <div className="relative min-h-screen bg-[#07080c] text-slate-100 selection:bg-rose-500 selection:text-white">
      {/* Top Header Navbar */}
      <Navbar onPlayClick={handlePlayNow} />

      <main>
        {/* 1. Dramatic Hero Section with 3D modified car & tire smoke CTAs */}
        <HeroSection
          onPlayNow={handlePlayNow}
          onExploreCars={handleScrollToCars}
        />

        {/* 2. Featured Cars with interactive 3D turntable & customizer */}
        <FeaturedCars onSelectCarAndPlay={handleSelectCarAndPlay} />

        {/* 3. Drift Tracks (Tokyo, Akina Pass, Docklands) */}
        <TrackSelector
          selectedTrackId={selectedTrack.id}
          onSelectTrack={setSelectedTrack}
          onPlayTrack={handlePlayTrack}
        />

        {/* 4. Game Modes */}
        <GameModes onSelectModeAndPlay={handleSelectModeAndPlay} />

        {/* 5. Global Leaderboard */}
        <Leaderboard userBestScore={userBestScore} />

        {/* 6. How To Play & Control Maps */}
        <HowToPlay />

        {/* 7. Latest Achievements */}
        <Achievements />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Instant Play Launch Widget */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={handlePlayNow}
          className="group relative flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-rose-600 via-rose-500 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-heading font-black text-sm uppercase tracking-wider rounded-2xl shadow-2xl shadow-rose-600/40 hover:shadow-rose-600/70 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 border border-rose-400/40"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-ping" />
          <Play className="w-4 h-4 fill-white text-white" />
          <span className="hidden sm:inline">LAUNCH DRIFT X</span>
          <span className="sm:hidden">PLAY</span>
        </button>
      </div>
    </div>
  );
}
