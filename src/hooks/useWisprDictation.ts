'use client';

import { useCallback, useRef, useState } from 'react';
import { bufferToBase64, startMicCapture } from '@/lib/wispr-audio';

const WISPR_CLIENT_WS_URL = 'wss://platform-api.wisprflow.ai/api/v1/dash/client_ws';

type DictationState = 'idle' | 'connecting' | 'recording' | 'processing';

interface Options {
  onTranscript: (text: string) => void;
  contextText?: string;
  disabled?: boolean;
}

interface WisprTextMessage {
  status: string;
  final?: boolean;
  body?: { text?: string };
  error?: string;
}

export function useWisprDictation({ onTranscript, contextText = '', disabled = false }: Options) {
  const [state, setState] = useState<DictationState>('idle');
  const wsRef = useRef<WebSocket | null>(null);
  const micRef = useRef<Awaited<ReturnType<typeof startMicCapture>> | null>(null);
  const packetPosition = useRef(0);
  const connectingRef = useRef(false);
  const supported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const cleanup = useCallback(async () => {
    if (micRef.current) {
      await micRef.current.stop();
      micRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    packetPosition.current = 0;
    connectingRef.current = false;
  }, []);

  const stopRecording = useCallback(async () => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'commit',
        total_packets: packetPosition.current,
      }));
      setState('processing');
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 2500);
        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data as string) as WisprTextMessage;
          if (msg.status === 'text' && msg.body?.text) {
            onTranscript(msg.body.text);
          }
          if (msg.final || msg.status === 'error') {
            clearTimeout(timer);
            resolve();
          }
        };
      });
    }
    await cleanup();
    setState('idle');
  }, [cleanup, onTranscript]);

  const startRecording = useCallback(async () => {
    if (!supported || disabled) return;

    setState('connecting');
    connectingRef.current = true;

    try {
      const tokenRes = await fetch('/api/wispr/token', { method: 'POST' });
      if (!tokenRes.ok) {
        throw new Error('Voice unavailable');
      }
      const { access_token: accessToken } = (await tokenRes.json()) as { access_token: string };

      const wsUrl = `${WISPR_CLIENT_WS_URL}?client_key=${encodeURIComponent(`Bearer ${accessToken}`)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Wispr connection timeout')), 12_000);

        ws.onopen = () => {
          ws.send(JSON.stringify({
            type: 'auth',
            language: ['en'],
            context: {
              app: { name: 'ChainPulse', type: 'ai' },
              dictionary_context: ['crypto', 'ethereum', 'bitcoin', 'defi', 'wallet'],
              textbox_contents: {
                before_text: contextText,
                selected_text: '',
                after_text: '',
              },
            },
          }));
        };

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data as string) as WisprTextMessage;
          if (msg.status === 'auth') {
            clearTimeout(timeout);
            connectingRef.current = false;
            resolve();
            return;
          }
          if (msg.status === 'text' && msg.body?.text) {
            onTranscript(msg.body.text);
          }
          if (msg.status === 'error' || msg.error) {
            clearTimeout(timeout);
            reject(new Error(msg.error ?? 'Wispr transcription failed'));
          }
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Wispr connection failed'));
        };

        ws.onclose = () => {
          if (connectingRef.current) {
            clearTimeout(timeout);
            reject(new Error('Wispr connection closed'));
          }
        };
      });

      const mic = await startMicCapture((buffer, volume, packetDuration) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({
          type: 'append',
          position: packetPosition.current,
          audio_packets: {
            packets: [bufferToBase64(buffer)],
            volumes: [volume],
            packet_duration: packetDuration,
            audio_encoding: 'wav',
            byte_encoding: 'base64',
          },
        }));
        packetPosition.current += 1;
      });

      micRef.current = mic;
      setState('recording');
    } catch {
      await cleanup();
      setState('idle');
    }
  }, [cleanup, contextText, disabled, onTranscript, supported]);

  const toggle = useCallback(async () => {
    if (state === 'recording') {
      await stopRecording();
    } else if (state === 'idle') {
      await startRecording();
    }
  }, [startRecording, state, stopRecording]);

  return {
    state,
    toggle,
    supported,
    isActive: state === 'recording' || state === 'connecting',
  };
}
