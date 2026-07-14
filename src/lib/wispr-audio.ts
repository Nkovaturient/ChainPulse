const RECORDING_SAMPLE_RATE = 48_000;
const TARGET_SAMPLE_RATE = 16_000;
const BUFFER_SIZE = 2400;

export type AudioChunkHandler = (buffer: ArrayBuffer, volume: number, packetDuration: number) => void;

export interface MicSession {
  stop: () => Promise<void>;
}

function convertToInt16(floatData: Float32Array): Int16Array {
  const intData = new Int16Array(floatData.length);
  for (let i = 0; i < floatData.length; i++) {
    const s = Math.max(-1, Math.min(1, floatData[i]));
    intData[i] = s < 0 ? Math.floor(s * 32768) : Math.floor(s * 32767);
  }
  return intData;
}

function calculateVolume(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / data.length);
}

async function resampleAudio(
  inputData: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number,
): Promise<Float32Array> {
  const offlineCtx = new OfflineAudioContext(
    1,
    Math.ceil(inputData.length * (outputSampleRate / inputSampleRate)),
    outputSampleRate,
  );
  const audioBuffer = offlineCtx.createBuffer(1, inputData.length, inputSampleRate);
  audioBuffer.copyToChannel(new Float32Array(inputData), 0);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start();
  const rendered = await offlineCtx.startRendering();
  return rendered.getChannelData(0);
}

export async function startMicCapture(onChunk: AudioChunkHandler): Promise<MicSession> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
  const packetDuration = BUFFER_SIZE / RECORDING_SAMPLE_RATE;
  let stopped = false;

  processor.onaudioprocess = (event) => {
    if (stopped) return;
    const input = event.inputBuffer.getChannelData(0);
    const chunk = new Float32Array(input);
    void resampleAudio(chunk, audioContext.sampleRate, TARGET_SAMPLE_RATE).then((resampled) => {
      const intData = convertToInt16(resampled);
      onChunk(intData.buffer as ArrayBuffer, calculateVolume(resampled), packetDuration);
    });
  };

  source.connect(processor);
  processor.connect(audioContext.destination);

  return {
    stop: async () => {
      stopped = true;
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      await audioContext.close();
    },
  };
}

export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
