import { getSampleFileName } from "./midiUtils";

export type Instrument = "noire-piano" | "electric-piano";

export interface VelocityCurveSettings {
  min: number;
  max: number;
  shape: number;
}

export interface ARSettings {
  attack: number;
  release: number;
}

export const DEFAULT_AR: ARSettings = {
  attack: 0,
  release: 0.25,
};

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

  private samples = new Map<string, Promise<AudioBuffer>>();
  private voices = new Map<number, ActiveVoice>();
  private pendingNotes = new Map<number, symbol>();

  private instrument: Instrument = "noire-piano";
  private volume = 0.8;

  private velocityCurve: VelocityCurveSettings = {
    ...DEFAULT_VELOCITY_CURVE,
  };

  private ar = { ...DEFAULT_AR };

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

  isAudioReady(): boolean {
    return this.context?.state === "running";
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));

    if (this.masterGain && this.context) {
      this.masterGain.gain.setTargetAtTime(
        this.volume,
        this.context.currentTime,
        0.01,
      );
    }
  }

  setVelocityCurve(settings: VelocityCurveSettings): void {
    this.velocityCurve = { ...settings };
  }

  setAR(settings: ARSettings): void {
    this.ar = {
      attack: Math.max(0, Math.min(2, settings.attack)),
      release: Math.max(0, Math.min(5, settings.release)),
    };
  }

  setInstrument(instrument: Instrument): void {
    if (this.instrument === instrument) return;

    this.allNotesOff();
    this.instrument = instrument;
  }

  private getVelocityGain(velocity: number): number {
    const input = Math.max(0, Math.min(127, velocity)) / 127;
    const progress = Math.pow(input, this.velocityCurve.shape);

    return (
      this.velocityCurve.min +
      (this.velocityCurve.max - this.velocityCurve.min) * progress
    );
  }

  private async loadSample(
    noteNumber: number,
    instrument: Instrument,
  ): Promise<AudioBuffer> {
    const fileName = getSampleFileName(noteNumber);
    const cacheKey = `${instrument}/${fileName}`;

    const cached = this.samples.get(cacheKey);
    if (cached) return cached;

    const samplePromise = (async () => {
      const response = await fetch(`/samples/${instrument}/${fileName}`);

      if (!response.ok) {
        throw new Error(
          `Не найден сэмпл инструмента ${instrument}: ${fileName}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();

      if (!this.context) {
        throw new Error("Аудиодвижок не инициализирован");
      }

      return this.context.decodeAudioData(arrayBuffer);
    })();

    this.samples.set(cacheKey, samplePromise);

    try {
      return await samplePromise;
    } catch (error) {
      this.samples.delete(cacheKey);
      throw error;
    }
  }

  async noteOn(noteNumber: number, velocity: number): Promise<void> {
    if (!this.context || !this.masterGain) {
      throw new Error("Сначала инициализируйте аудиодвижок");
    }

    this.noteOff(noteNumber);

    const selectedInstrument = this.instrument;
    const token = Symbol(`note-${noteNumber}`);

    this.pendingNotes.set(noteNumber, token);

    const buffer = await this.loadSample(noteNumber, selectedInstrument);

    if (
      this.pendingNotes.get(noteNumber) !== token ||
      !this.context ||
      !this.masterGain ||
      this.instrument !== selectedInstrument
    ) {
      return;
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    if (
      this.pendingNotes.get(noteNumber) !== token ||
      !this.context ||
      !this.masterGain ||
      this.instrument !== selectedInstrument
    ) {
      return;
    }

    const source = this.context.createBufferSource();
    const voiceGain = this.context.createGain();

    const now = this.context.currentTime;
    const peakGain = this.getVelocityGain(velocity);

    source.buffer = buffer;

    voiceGain.gain.cancelScheduledValues(now);
    voiceGain.gain.setValueAtTime(0, now);

    if (this.ar.attack > 0) {
      voiceGain.gain.linearRampToValueAtTime(peakGain, now + this.ar.attack);
    } else {
      voiceGain.gain.setValueAtTime(peakGain, now);
    }

    source.connect(voiceGain);
    voiceGain.connect(this.masterGain);

    source.onended = () => {
      source.disconnect();
      voiceGain.disconnect();

      if (this.voices.get(noteNumber)?.source === source) {
        this.voices.delete(noteNumber);
      }
    };

    this.voices.set(noteNumber, {
      source,
      gain: voiceGain,
    });

    this.pendingNotes.delete(noteNumber);
    source.start();
  }

  noteOff(noteNumber: number): void {
    this.pendingNotes.delete(noteNumber);

    const voice = this.voices.get(noteNumber);

    if (!voice || !this.context) return;

    const now = this.context.currentTime;
    const releaseEnd = now + this.ar.release;

    const gainParam = voice.gain.gain;
    gainParam.cancelAndHoldAtTime(now);

    if (this.ar.release > 0) {
      gainParam.linearRampToValueAtTime(0, releaseEnd);
    } else {
      gainParam.setValueAtTime(0, now);
    }

    try {
      voice.source.stop(releaseEnd + 0.01);
    } catch {
      // Источник мог уже остановиться
    }

    this.voices.delete(noteNumber);

    try {
      voice.source.stop(releaseEnd + 0.01);
    } catch {
      // Голос мог завершиться непосредственно перед Note Off.
    }

    this.voices.delete(noteNumber);
  }

  allNotesOff(): void {
    this.pendingNotes.clear();

    for (const [noteNumber, voice] of this.voices) {
      try {
        voice.source.stop();
      } catch {
        // Голос мог уже завершиться.
      }

      voice.source.disconnect();
      voice.gain.disconnect();
      this.voices.delete(noteNumber);
    }
  }

  destroy(): void {
    this.allNotesOff();
    this.samples.clear();

    if (this.context) {
      void this.context.close();
      this.context = null;
      this.masterGain = null;
    }
  }
}
