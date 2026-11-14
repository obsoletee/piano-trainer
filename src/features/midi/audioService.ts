import { getSampleFileName } from "./midiUtils";

export interface VelocityCurveSettings {
  min: number;
  max: number;
  shape: number;
}

interface ActiveVoice {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

const DEFAULT_VELOCITY_CURVE: VelocityCurveSettings = {
  min: 0.5,
  max: 1,
  shape: 1,
};

export class MidiAudioPlayer {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private samples = new Map<number, Promise<AudioBuffer>>();
  private voices = new Map<number, ActiveVoice>();
  private pendingNotes = new Map<number, symbol>();
  private volume = 0.8;
  private velocityCurve: VelocityCurveSettings = { ...DEFAULT_VELOCITY_CURVE };

  async initialize(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.context.destination);
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.masterGain && this.context) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.01);
    }
  }

  setVelocityCurve(settings: VelocityCurveSettings): void {
    this.velocityCurve = { ...settings };
  }

  private getVelocityGain(velocity: number): number {
    const input = Math.max(0, Math.min(127, velocity)) / 127;
    const progress = Math.pow(input, this.velocityCurve.shape);
    return this.velocityCurve.min + (this.velocityCurve.max - this.velocityCurve.min) * progress;
  }

  private async loadSample(noteNumber: number): Promise<AudioBuffer> {
    const cached = this.samples.get(noteNumber);
    if (cached) return cached;

    const fileName = getSampleFileName(noteNumber);
    const samplePromise = (async () => {
      const response = await fetch(`/samples/${fileName}`);
      if (!response.ok) {
        throw new Error(`Не найден сэмпл: ${fileName}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      if (!this.context) {
        throw new Error("Аудиодвижок не инициализирован");
      }

      return this.context.decodeAudioData(arrayBuffer);
    })();

    this.samples.set(noteNumber, samplePromise);

    try {
      return await samplePromise;
    } catch (error) {
      this.samples.delete(noteNumber);
      throw error;
    }
  }

  async noteOn(noteNumber: number, velocity: number): Promise<void> {
    if (!this.context || !this.masterGain) {
      throw new Error("Сначала инициализируйте аудиодвижок");
    }

    // Новое нажатие той же клавиши заменяет предыдущий голос.
    this.noteOff(noteNumber);
    const token = Symbol(`note-${noteNumber}`);
    this.pendingNotes.set(noteNumber, token);

    const buffer = await this.loadSample(noteNumber);

    // Если клавишу отпустили до окончания загрузки сэмпла, звук не запускаем.
    if (this.pendingNotes.get(noteNumber) !== token || !this.context || !this.masterGain) {
      return;
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    // Note Off мог прийти, пока AudioContext возобновлялся.
    if (this.pendingNotes.get(noteNumber) !== token || !this.context || !this.masterGain) {
      return;
    }

    const source = this.context.createBufferSource();
    const voiceGain = this.context.createGain();

    source.buffer = buffer;
    voiceGain.gain.value = this.getVelocityGain(velocity);
    source.connect(voiceGain);
    voiceGain.connect(this.masterGain);

    source.onended = () => {
      source.disconnect();
      voiceGain.disconnect();
      if (this.voices.get(noteNumber)?.source === source) {
        this.voices.delete(noteNumber);
      }
    };

    this.voices.set(noteNumber, { source, gain: voiceGain });
    this.pendingNotes.delete(noteNumber);
    source.start();
  }

  noteOff(noteNumber: number): void {
    // Отменяем ещё не завершившуюся загрузку сэмпла.
    this.pendingNotes.delete(noteNumber);

    const voice = this.voices.get(noteNumber);
    if (!voice || !this.context) return;

    const now = this.context.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setTargetAtTime(0, now, 0.015);

    try {
      voice.source.stop(now + 0.08);
    } catch {
      // Голос мог завершиться непосредственно перед Note Off.
    }

    this.voices.delete(noteNumber);
  }

  destroy(): void {
    for (const noteNumber of this.voices.keys()) {
      this.noteOff(noteNumber);
    }

    this.pendingNotes.clear();
    this.samples.clear();

    if (this.context) {
      void this.context.close();
      this.context = null;
      this.masterGain = null;
    }
  }
}
