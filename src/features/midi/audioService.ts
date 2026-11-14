import { getSampleFileName } from "./midiUtils";

export class MidiAudioPlayer {
  private context: AudioContext | null = null;

  private samples = new Map<number, Promise<AudioBuffer>>();

  // Инициализация аудиодвижка
  async initialize(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  // Загрузка и кэширование сэмпла
  private async loadSample(noteNumber: number): Promise<AudioBuffer> {
    const existingSample = this.samples.get(noteNumber);

    if (existingSample) {
      return existingSample;
    }

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

      return await this.context.decodeAudioData(arrayBuffer);
    })();

    this.samples.set(noteNumber, samplePromise);

    try {
      return await samplePromise;
    } catch (error) {
      this.samples.delete(noteNumber);
      throw error;
    }
  }

  // Воспроизведение ноты
  async play(noteNumber: number, velocity: number): Promise<void> {
    if (!this.context) {
      throw new Error("Сначала инициализируйте аудиодвижок");
    }

    const buffer = await this.loadSample(noteNumber);

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();

    source.buffer = buffer;

    // Velocity определяет громкость звука
    gain.gain.value = velocity / 127;

    source.connect(gain);
    gain.connect(this.context.destination);

    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };

    source.start();
  }

  // Освобождение ресурсов
  destroy(): void {
    if (this.context) {
      void this.context.close();
      this.context = null;
    }

    this.samples.clear();
  }
}
