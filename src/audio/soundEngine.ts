/**
 * DRIFT X Procedural Web Audio Engine
 * Real-time synthesis of engine RPM, turbo spool & blow-off, tire screech, nitro hiss, and music.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicEnabled: boolean = true;
  private isInitialized: boolean = false;

  // Engine audio nodes
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  // Tire squeal nodes
  private tireNoiseNode: AudioBufferSourceNode | null = null;
  private tireGain: GainNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;

  // Nitro node
  private nitroGain: GainNode | null = null;
  private nitroFilter: BiquadFilterNode | null = null;

  // Background Synth Beat
  private musicInterval: number | null = null;
  private beatStep: number = 0;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupEngine();
      this.setupTireSqueal();
      this.setupNitro();
      this.isInitialized = true;
    } catch {
      // Audio might be restricted until user gesture
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private setupEngine() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Main engine sawtooth oscillator
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(55, now);

    // Sub rumble oscillator
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'triangle';
    this.engineSubOsc.frequency.setValueAtTime(27.5, now);

    // Distortion / filter
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(450, now);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, now);

    this.engineOsc.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.engineOsc.start();
    this.engineSubOsc.start();
  }

  private setupTireSqueal() {
    if (!this.ctx) return;

    // White noise buffer for tire friction
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.tireNoiseNode = this.ctx.createBufferSource();
    this.tireNoiseNode.buffer = noiseBuffer;
    this.tireNoiseNode.loop = true;

    this.tireFilter = this.ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.tireFilter.Q.setValueAtTime(4, this.ctx.currentTime);

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.tireNoiseNode.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.ctx.destination);

    this.tireNoiseNode.start();
  }

  private setupNitro() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const nitroNoise = this.ctx.createBufferSource();
    nitroNoise.buffer = noiseBuffer;
    nitroNoise.loop = true;

    this.nitroFilter = this.ctx.createBiquadFilter();
    this.nitroFilter.type = 'highpass';
    this.nitroFilter.frequency.setValueAtTime(900, this.ctx.currentTime);

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

    nitroNoise.connect(this.nitroFilter);
    this.nitroFilter.connect(this.nitroGain);
    this.nitroGain.connect(this.ctx.destination);

    nitroNoise.start();
  }

  // Update real-time physics parameters
  public updatePhysics(speedKmh: number, isDrifting: boolean, driftAngle: number, throttle: boolean, nitro: boolean) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Engine sound
    if (this.engineOsc && this.engineGain && this.engineFilter) {
      const baseFreq = 48 + Math.min(speedKmh * 1.6, 280) + (throttle ? 35 : 0) + (nitro ? 60 : 0);
      this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.08);
      if (this.engineSubOsc) {
        this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.08);
      }
      this.engineFilter.frequency.setTargetAtTime(350 + speedKmh * 7, now, 0.08);
      
      const targetGain = throttle || speedKmh > 5 ? 0.16 : 0.06;
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);
    }

    // Tire squeal sound
    if (this.tireGain && this.tireFilter) {
      if (isDrifting && speedKmh > 18) {
        const slipIntensity = Math.min(Math.abs(driftAngle) / 45, 1.2);
        const squealGain = 0.22 * slipIntensity;
        this.tireGain.gain.setTargetAtTime(squealGain, now, 0.04);
        this.tireFilter.frequency.setTargetAtTime(1100 + slipIntensity * 900, now, 0.04);
      } else {
        this.tireGain.gain.setTargetAtTime(0, now, 0.08);
      }
    }

    // Nitro sound
    if (this.nitroGain) {
      if (nitro && speedKmh > 10) {
        this.nitroGain.gain.setTargetAtTime(0.24, now, 0.05);
      } else {
        this.nitroGain.gain.setTargetAtTime(0, now, 0.1);
      }
    }
  }

  // Turbo blow-off valve chirp
  public playBlowOff() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Collision impact thud
  public playCollision() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // UI click sound
  public playClick() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Phonk / Synthwave Procedural Bass beat loop
  public startMusic() {
    if (!this.isMusicEnabled || this.musicInterval !== null) return;
    this.beatStep = 0;

    // 132 BPM phonk tempo
    const stepTime = (60 / 132) / 4 * 1000; // 16th note

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted || !this.isMusicEnabled) return;
      const now = this.ctx.currentTime;
      const step = this.beatStep % 16;

      // Kick drum on beats 0, 4, 8, 12
      if (step === 0 || step === 8) {
        this.playKick(now);
      } else if (step === 4 || step === 12) {
        this.playSnare(now);
      }

      // Cowbell / synth hit on phonk accents
      if (step === 0 || step === 3 || step === 6 || step === 10 || step === 14) {
        const notes = [220, 261.6, 293.7, 329.6, 392.0];
        const note = notes[(step * 2) % notes.length];
        this.playBassNote(note, now);
      }

      // Hi-hat on every offbeat
      if (step % 2 === 1) {
        this.playHiHat(now);
      }

      this.beatStep++;
    }, stepTime);
  }

  public stopMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  private playKick(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.12);
  }

  private playSnare(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  private playHiHat(time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'highpass' as unknown as OscillatorType;
    osc.frequency.setValueAtTime(6000, time);
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.04);
  }

  private playBassNote(freq: number, time: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq / 2, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, time);
    filter.frequency.exponentialRampToValueAtTime(150, time + 0.18);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
      if (this.tireGain) this.tireGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
      if (this.nitroGain) this.nitroGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
    return this.isMuted;
  }

  public toggleMusic(): boolean {
    this.isMusicEnabled = !this.isMusicEnabled;
    if (!this.isMusicEnabled) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.isMusicEnabled;
  }

  public getMuted() {
    return this.isMuted;
  }

  public getMusicEnabled() {
    return this.isMusicEnabled;
  }
}

export const soundEngine = new SoundEngine();
