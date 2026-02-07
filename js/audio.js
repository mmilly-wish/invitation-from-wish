export class AudioSystem {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
    }

    async init() {
        // Ensure Tone.js context is available and use it
        if (!this.ctx && window.Tone) {
            this.ctx = Tone.context.rawContext; // Use the shared context
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.3;
        } else if (!this.ctx) {
            // Fallback if Tone isn't loaded (shouldn't happen)
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
        }

        if (this.ctx.state === 'suspended') {
            try {
                await this.ctx.resume();
            } catch (e) {
                console.warn("[AudioSystem] Resume failed", e);
            }
        }
    }

    playBeep(frequency = 800, duration = 0.05) {
        if (this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.value = frequency;

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playTypingSound() {
        // Variation in pitch to sound natural
        const freq = 700 + Math.random() * 200;
        this.playBeep(freq, 0.03);
    }

    playGlitch() {
        if (this.isMuted) return;
        const bufferSize = this.ctx.sampleRate * 0.2; // 0.2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.5;

        noise.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
    }

    startHum() {
        if (this.humOsc) return;
        this.humOsc = this.ctx.createOscillator();
        this.humGain = this.ctx.createGain();

        this.humOsc.type = 'sine';
        this.humOsc.frequency.value = 50; // Low hum

        this.humGain.gain.value = 0.05;

        this.humOsc.connect(this.humGain);
        this.humGain.connect(this.masterGain);

        this.humOsc.start();
    }
}

export const audio = new AudioSystem();
