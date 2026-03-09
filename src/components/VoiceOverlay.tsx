import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, X, Volume2, VolumeX } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { UserPreferences } from '../types';
import { GlassCard } from './GlassCard';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface VoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
}

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({
  isOpen,
  onClose,
  preferences,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startSession();
    } else {
      stopSession();
    }
    return () => stopSession();
  }, [isOpen]);

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      sessionRef.current = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setupAudio();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              playAudio(message.serverContent.modelTurn.parts[0].inlineData.data);
            }
            if (message.serverContent?.modelTurn?.parts[0]?.text) {
              setAiResponse(prev => prev + message.serverContent!.modelTurn!.parts[0].text);
            }
          },
          onclose: () => setIsActive(false),
          onerror: (err) => console.error("Live API Error:", err),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are Koma AI in Voice Mode. User: ${preferences.name}. Personality: ${preferences.personality}.`,
        },
      });
    } catch (err) {
      console.error("Failed to start voice session:", err);
    }
  };

  const setupAudio = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        sessionRef.current?.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
    } catch (err) {
      console.error("Audio setup error:", err);
    }
  };

  const playAudio = (base64Data: string) => {
    if (!audioContextRef.current) return;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 0x7FFF;
    }

    const buffer = audioContextRef.current.createBuffer(1, floatData.length, 16000);
    buffer.getChannelData(0).set(floatData);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start();
  };

  const stopSession = () => {
    sessionRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    setIsActive(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl"
        >
          <div className="max-w-md w-full p-8 text-center space-y-12">
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{
                  scale: isActive ? [1, 1.2, 1] : 1,
                  opacity: isActive ? [0.2, 0.5, 0.2] : 0.2,
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute w-48 h-48 rounded-full bg-indigo-500 blur-3xl"
              />
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                {isMuted ? <MicOff size={48} className="text-white" /> : <Mic size={48} className="text-white" />}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white">
                {isActive ? "Listening..." : "Connecting..."}
              </h2>
              <p className="text-white/40 font-medium tracking-wide">
                Speak naturally to Koma AI
              </p>
            </div>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={cn(
                  "p-5 rounded-2xl transition-all",
                  isMuted ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/5 text-white/60 hover:bg-white/10"
                )}
              >
                {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
              </button>
              <button
                onClick={onClose}
                className="p-5 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all border border-white/20"
              >
                <X size={28} />
              </button>
            </div>

            {aiResponse && (
              <GlassCard className="p-6 text-left">
                <p className="text-white/80 leading-relaxed italic">"{aiResponse}"</p>
              </GlassCard>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
