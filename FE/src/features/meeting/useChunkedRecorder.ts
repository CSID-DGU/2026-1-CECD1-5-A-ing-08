import { useRef, useState, useCallback, useEffect } from 'react';
import apiClient from '@/api/client';

export type CalibrationState = 'idle' | 'leader' | 'leader-recording' | 'leader-uploading'
  | 'member' | 'member-recording' | 'member-uploading' | 'done' | 'error';

const CALIBRATION_SECONDS = 5;

function wavBlob(samples: number[], sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeText(0, 'RIFF');
  view.setUint32(4, buffer.byteLength - 8, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) view.setInt16(44 + i * 2, samples[i], true);
  return new Blob([buffer], { type: 'audio/wav' });
}

export function useChunkedRecorder(meetingId: number) {
  const [isRecording, setIsRecording] = useState(false);
  const [calibrationState, setCalibrationState] = useState<CalibrationState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const sinkRef = useRef<GainNode | null>(null);
  const samplesRef = useRef<number[]>([]);
  const calibrationSamplesRef = useRef<number[]>([]);
  const calibrationStateRef = useRef<CalibrationState>('idle');
  const calibrationAbortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const allChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const segmentRef = useRef(0);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const failedRef = useRef(false);

  const enqueueChunk = useCallback((blob: Blob, sequence: number) => {
    if (failedRef.current) return;
    queueRef.current = queueRef.current.then(async () => {
      if (failedRef.current) return;
      const form = new FormData();
      form.append('audio', blob, 'segment.wav');
      try {
        form.append('sequence', String(sequence));
        await apiClient.post(`/api/v1/meetings/${meetingId}/audio-chunk`, form);
      } catch {
        failedRef.current = true;
        setCalibrationState('error');
        calibrationStateRef.current = 'error';
        setCaptureError('실시간 발화 비율 전송이 끊겼습니다. 녹음은 계속 저장됩니다.');
      }
    });
  }, [meetingId]);

  const startCalibration = useCallback(() => {
    const state = calibrationStateRef.current;
    if (state !== 'leader' && state !== 'member') return;
    calibrationSamplesRef.current = [];
    setCaptureError(null);
    const next = `${state}-recording` as CalibrationState;
    calibrationStateRef.current = next;
    setCalibrationState(next);
  }, []);

  const finishCalibration = useCallback(async () => {
    const state = calibrationStateRef.current;
    if (state !== 'leader-recording' && state !== 'member-recording') return;
    const role = state === 'leader-recording' ? 'leader' : 'member';
    const sampleRate = contextRef.current?.sampleRate;
    if (!sampleRate || calibrationSamplesRef.current.length < sampleRate * 2) {
      setCaptureError('2초 이상 말씀하신 뒤 등록해 주세요.');
      return;
    }
    const samples = calibrationSamplesRef.current;
    calibrationSamplesRef.current = [];
    const uploading = `${role}-uploading` as CalibrationState;
    calibrationStateRef.current = uploading;
    setCalibrationState(uploading);
    setCaptureError(null);
    const controller = new AbortController();
    calibrationAbortRef.current = controller;
    const runId = runIdRef.current;
    const form = new FormData();
    form.append('audio', wavBlob(samples, sampleRate), 'calibration.wav');
    try {
      await apiClient.post(`/api/v1/meetings/${meetingId}/calibrate/${role}`, form, { signal: controller.signal });
      if (runId !== runIdRef.current) return;
      const next: CalibrationState = role === 'leader' ? 'member' : 'done';
      samplesRef.current = [];
      segmentRef.current = 0;
      calibrationStateRef.current = next;
      setCalibrationState(next);
    } catch {
      if (runId !== runIdRef.current) return;
      calibrationStateRef.current = role;
      setCalibrationState(role);
      setCaptureError(`${role === 'leader' ? '리더' : '멤버'} 기준 발화 등록에 실패했습니다. 다시 말씀해 주세요.`);
    } finally {
      if (calibrationAbortRef.current === controller) calibrationAbortRef.current = null;
    }
  }, [meetingId]);

  const start = useCallback(async () => {
    runIdRef.current++;
    setCaptureError(null);
    setElapsed(0);
    elapsedRef.current = 0;
    segmentRef.current = 0;
    samplesRef.current = [];
    calibrationSamplesRef.current = [];
    calibrationStateRef.current = 'idle';
    allChunksRef.current = [];
    queueRef.current = Promise.resolve();
    failedRef.current = false;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    try {
      const context = new AudioContext();
      contextRef.current = context;
      await context.audioWorklet.addModule('/pcm-capture-worklet.js');
      const source = context.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(context, 'pcm-capture');
      const sink = context.createGain();
      sink.gain.value = 0;
      source.connect(worklet).connect(sink).connect(context.destination);
      await context.resume();
      sourceRef.current = source;
      workletRef.current = worklet;
      sinkRef.current = sink;
      const segmentSamples = Math.round(context.sampleRate * 5);
      worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
        const incoming = event.data;
        const phase = calibrationStateRef.current;
        if (phase !== 'leader-recording' && phase !== 'member-recording' && phase !== 'done') return;
        const target = phase === 'done' ? samplesRef.current : calibrationSamplesRef.current;
        for (let i = 0; i < incoming.length; i++) {
          const clamped = Math.max(-1, Math.min(1, incoming[i]));
          target.push(Math.round(clamped * (clamped < 0 ? 32768 : 32767)));
        }
        if (phase !== 'done' && target.length >= context.sampleRate * CALIBRATION_SECONDS) {
          void finishCalibration();
        }
        while (phase === 'done' && samplesRef.current.length >= segmentSamples) {
          const samples = samplesRef.current.splice(0, segmentSamples);
          enqueueChunk(wavBlob(samples, context.sampleRate), segmentRef.current++);
        }
      };

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) allChunksRef.current.push(event.data);
      };
      recorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      calibrationStateRef.current = 'leader';
      setCalibrationState('leader');
      timerRef.current = setInterval(() => {
        setElapsed((time) => { elapsedRef.current = time + 1; return time + 1; });
      }, 1000);
    } catch (error) {
      sourceRef.current?.disconnect();
      workletRef.current?.disconnect();
      sinkRef.current?.disconnect();
      await contextRef.current?.close();
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      throw error;
    }
  }, [enqueueChunk, finishCalibration]);

  const stop = useCallback(async (): Promise<{ blob: Blob; durationSec: number }> => {
    const recorder = recorderRef.current;
    if (!recorder) return { blob: new Blob(), durationSec: 0 };
    const durationSec = elapsedRef.current;
    const wasMeasuring = calibrationStateRef.current === 'done';
    runIdRef.current++;
    calibrationAbortRef.current?.abort();
    if (!wasMeasuring) calibrationStateRef.current = 'idle';
    workletRef.current?.port.postMessage('flush');
    await new Promise((resolve) => setTimeout(resolve, 100));
    calibrationStateRef.current = 'idle';
    workletRef.current?.disconnect();
    sourceRef.current?.disconnect();
    sinkRef.current?.disconnect();
    if (timerRef.current) clearInterval(timerRef.current);
    if (wasMeasuring && !failedRef.current && samplesRef.current.length >= contextRef.current!.sampleRate * 0.6) {
      enqueueChunk(wavBlob(samplesRef.current, contextRef.current!.sampleRate), segmentRef.current++);
    }
    samplesRef.current = [];
    calibrationSamplesRef.current = [];
    await queueRef.current;
    await contextRef.current?.close();
    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(allChunksRef.current, { type: recorder.mimeType }));
      recorder.stop();
    });
    streamRef.current?.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    setIsRecording(false);
    setCalibrationState('idle');
    return { blob, durationSec };
  }, [enqueueChunk]);

  useEffect(() => () => {
    runIdRef.current++;
    calibrationAbortRef.current?.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    workletRef.current?.disconnect();
    sourceRef.current?.disconnect();
    sinkRef.current?.disconnect();
    void contextRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  return { isRecording, calibrationState, captureError, elapsed, start, stop, startCalibration };
}
