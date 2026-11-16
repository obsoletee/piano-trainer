import { useCallback, useEffect, useRef, useState } from "react";

export interface MidiInputCallbacks {
  onNoteOn?: (noteNumber: number, velocity: number) => void;
  onNoteOff?: (noteNumber: number) => void;
}

type NavigatorWithMidi = Navigator & {
  requestMIDIAccess?: () => Promise<MIDIAccess>;
};

export function useMidiInput(
  callbacks: MidiInputCallbacks = {},
  onConnected?: () => void,
) {
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [error, setError] = useState("");

  const accessRef = useRef<MIDIAccess | null>(null);
  const inputsRef = useRef<MIDIInput[]>([]);

  // Храним актуальные функции обратного вызова,
  // чтобы MIDI-обработчики не использовали устаревшие версии.
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const detachInputs = useCallback(() => {
    inputsRef.current.forEach((input) => {
      input.onmidimessage = null;
    });

    inputsRef.current = [];

    if (accessRef.current) {
      accessRef.current.onstatechange = null;
    }

    accessRef.current = null;
  }, []);

  const handleMidiMessage = useCallback((event: MIDIMessageEvent) => {
    const data = event.data;

    if (!data || data.length < 3) return;

    const status = data[0];
    const noteNumber = data[1];
    const velocity = data[2];

    if (
      status === undefined ||
      noteNumber === undefined ||
      velocity === undefined
    ) {
      return;
    }

    // Отделяем команду MIDI от номера канала.
    const command = status & 0xf0;

    // Note On с velocity больше нуля — клавиша нажата.
    if (command === 0x90 && velocity > 0) {
      callbacksRef.current.onNoteOn?.(noteNumber, velocity);
      return;
    }

    // Note Off или Note On с velocity = 0 — клавиша отпущена.
    if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      callbacksRef.current.onNoteOff?.(noteNumber);
    }
  }, []);

  const attachInputs = useCallback(
    (access: MIDIAccess): boolean => {
      // Сначала отключаем обработчики предыдущих устройств.
      inputsRef.current.forEach((input) => {
        input.onmidimessage = null;
      });

      const inputs = Array.from(access.inputs.values());
      inputsRef.current = inputs;

      inputs.forEach((input) => {
        input.onmidimessage = handleMidiMessage;
      });

      const names = inputs
        .map((input) => input.name)
        .filter((name): name is string => Boolean(name));

      setDeviceName(
        names.length > 0
          ? names.join(", ")
          : inputs.length > 0
            ? `${inputs.length} MIDI-устройство`
            : "",
      );

      setConnected(inputs.length > 0);

      return inputs.length > 0;
    },
    [handleMidiMessage],
  );

  const disconnect = useCallback(() => {
    detachInputs();
    setConnected(false);
    setDeviceName("");
    setError("");
  }, [detachInputs]);

  const connectVirtual = useCallback(() => {
    detachInputs();

    setConnected(true);
    setDeviceName("Virtual MIDI Keyboard");
    setError("");
  }, [detachInputs]);

  const virtualNoteOn = useCallback((noteNumber: number, velocity = 100) => {
    callbacksRef.current.onNoteOn?.(noteNumber, velocity);
  }, []);

  const virtualNoteOff = useCallback((noteNumber: number) => {
    callbacksRef.current.onNoteOff?.(noteNumber);
  }, []);

  const connect = useCallback(async () => {
    // Убираем старое подключение перед новым.
    detachInputs();

    setConnected(false);
    setDeviceName("");
    setError("");

    try {
      const midiNavigator = navigator as NavigatorWithMidi;

      if (!midiNavigator.requestMIDIAccess) {
        throw new Error(
          "Ваш браузер не поддерживает Web MIDI API. Попробуй Chrome или Edge.",
        );
      }

      const access = await midiNavigator.requestMIDIAccess();
      accessRef.current = access;

      onConnected?.();

      attachInputs(access);

      // Реагируем на подключение и отключение устройств.
      access.onstatechange = () => {
        const hasCurrentInputs = attachInputs(access);

        if (!hasCurrentInputs) {
          setError("MIDI-клавиатура отключена.");
        } else {
          setError("");
        }
      };
    } catch (err) {
      detachInputs();
      setConnected(false);
      setDeviceName("");

      setError(
        err instanceof Error
          ? err.message
          : "Не удалось подключить MIDI-устройство.",
      );
    }
  }, [attachInputs, detachInputs, onConnected]);

  // При удалении компонента отключаем все MIDI-обработчики.
  useEffect(() => {
    return () => {
      detachInputs();
    };
  }, [detachInputs]);

  return {
    connected,
    deviceName,
    error,
    connect,
    disconnect,
    connectVirtual,
    virtualNoteOn,
    virtualNoteOff,
  };
}
