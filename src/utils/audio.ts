// Custom Audio Synthesizer using developer-grade Web Audio API
class LiveSoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // resume if suspended (mobile interaction constraint)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Neon retro UI button press
  public playClick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {
      console.warn('Audio click failed', e);
    }
  }

  // Rotating mechanical / energy spin sound with oscillating speed
  public playSpin(durationMs: number) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      
      // Frequency sweeping down to represent the slowing wheel
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + (durationMs / 1000));

      // Quick amplitude modulation for clicking clicks during rotation
      const modulation = this.ctx.createOscillator();
      const modulationGain = this.ctx.createGain();
      
      modulation.type = 'sine';
      modulation.frequency.setValueAtTime(15, this.ctx.currentTime);
      modulation.frequency.exponentialRampToValueAtTime(4, this.ctx.currentTime + (durationMs / 1000));
      
      modulationGain.gain.setValueAtTime(30, this.ctx.currentTime);
      modulationGain.gain.exponentialRampToValueAtTime(5, this.ctx.currentTime + (durationMs / 1000));

      modulation.connect(modulationGain);
      modulationGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (durationMs / 1000));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      modulation.start();
      osc.start();
      
      modulation.stop(this.ctx.currentTime + (durationMs / 1000));
      osc.stop(this.ctx.currentTime + (durationMs / 1000));
    } catch (e) {
      console.warn('Audio spin failed', e);
    }
  }

  // Ticking of the countdown timer
  public playTick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      
      // Retro pitch pop
      o.frequency.setValueAtTime(800, this.ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);

      g.gain.setValueAtTime(0.05, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      o.connect(g);
      g.connect(this.ctx.destination);

      o.start();
      o.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn('Audio tick failed', e);
    }
  }

  // Correct Answer Success fanfare
  public playSuccess() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      chords.forEach((freq, idx) => {
        const o = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        g.gain.setValueAtTime(0.05, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.002, now + idx * 0.08 + 0.3);
        
        o.connect(g);
        g.connect(this.ctx!.destination);
        
        o.start(now + idx * 0.08);
        o.stop(now + idx * 0.08 + 0.3);
      });
    } catch (e) {
      console.warn('Audio success failed', e);
    }
  }

  // Wrong Answer fail buzzer
  public playFailure() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('Audio failure failed', e);
    }
  }

  // Tense ticker warning for the last 5 seconds
  public playWarningTick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(1000, this.ctx.currentTime);
      o.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + 0.15);

      g.gain.setValueAtTime(0.08, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      o.connect(g);
      g.connect(this.ctx.destination);

      o.start();
      o.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio warning failed', e);
    }
  }
}

export const liveAudio = new LiveSoundEffects();
export default liveAudio;
