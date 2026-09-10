export interface CarModel {
  id: string;
  name: string;
  brandSubtitle: string;
  tagline: string;
  class: 'Tuner' | 'Muscle' | 'Super' | 'Legend';
  horsepower: number;
  topSpeed: number; // km/h
  weight: number; // kg
  driftScoreMultiplier: number;
  handling: number; // 1-100
  acceleration: number; // 1-100
  bodyColor: string;
  accentColor: string;
  neonColor: string;
  modelType: 'rx7' | 'gtr' | 'ae86' | 'supra';
  description: string;
  specs: {
    engine: string;
    drivetrain: string;
    aspiration: string;
    tires: string;
  };
}

export interface TrackData {
  id: string;
  name: string;
  location: string;
  difficulty: 'Easy' | 'Medium' | 'Expert';
  theme: 'tokyo' | 'mountain' | 'industrial';
  length: string;
  corners: number;
  bestScore: number;
  bestDrifter: string;
  description: string;
  surface: string;
  accentColor: string;
}

export type GameMode = 'freestyle' | 'time_attack' | 'drift_battle' | 'gymkhana';

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  car: string;
  trackId: string;
  score: number;
  maxCombo: number;
  maxAngle: number;
  date: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  target: number;
  progress: number;
  unlocked: boolean;
  reward: string;
}

export interface ControlState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  handbrake: boolean;
  nitro: boolean;
}

export interface DriftStats {
  currentScore: number;
  combo: number;
  comboTimer: number;
  driftAngle: number;
  speed: number;
  isDrifting: boolean;
  nitroAmount: number;
  driftQuality: 'NONE' | 'DRIFT' | 'GREAT' | 'EXTREME' | 'PERFECT';
}
