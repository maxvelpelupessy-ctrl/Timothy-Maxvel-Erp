import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import { Transaction, Bike } from '../types';

interface VoiceAgentProps {
  transactions: Transaction[];
  bikes: Bike[];
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ transactions, bikes }) => {
  const [active, setActive] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  
  // Refs for Audio context and processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<Promise<any> | null>(null);

  const startSession = async () => {
    // Create new instance right before connection
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prepare System Instruction Context
    const revenue = transactions.filter(t => t.category === 'Revenue').reduce((s, t) => s + t.amount, 0);
    const brokenBikes = bikes.filter(b => b.status === 'Maintenance').length;
    
    const systemContext = `
      You are the AI Assistant for 'MotoRent ERP'. 
      Current Data:
      - Total Revenue: Rp ${revenue}
      - Total Bikes: ${bikes.length}
      - Bikes in Maintenance: ${brokenBikes}
      - Bikes Available: ${bikes.filter(b => b.status === 'Available').length}
      
      Answer concise questions about the business stats. Speak professionally but friendly.
    `;

    try {
      // 1. Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // 2. Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          systemInstruction: systemContext,
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        },
        callbacks: {
          onopen: async () => {
            setConnected(true);
            
            // Start Mic Stream
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current);
            // Buffer size 4096
            processorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert to PCM 16-bit
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = inputData[i] * 32768;
              }
              
              // Safe encoding
              const base64Audio = encode(new Uint8Array(pcmData.buffer));
              
              sessionPromise.then(session => {
                  session.sendRealtimeInput({
                      media: {
                          mimeType: 'audio/pcm;rate=16000',
                          data: base64Audio
                      }
                  });
              });
            };

            source.connect(processorRef.current);
            processorRef.current.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (msg) => {
            const serverContent = msg.serverContent;
            
            // Handle Audio Output
            if (serverContent?.modelTurn?.parts?.[0]?.inlineData) {
              setIsTalking(true);
              const base64String = serverContent.modelTurn.parts[0].inlineData.data;
              
              const audioData = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
              
              // Decode PCM 16-bit 24kHz to Float32
              const int16Data = new Int16Array(audioData.buffer);
              const float32Data = new Float32Array(int16Data.length);
              for(let i=0; i<int16Data.length; i++) {
                 float32Data[i] = int16Data[i] / 32768.0;
              }

              const buffer = audioContextRef.current!.createBuffer(1, float32Data.length, 24000);
              buffer.getChannelData(0).set(float32Data);

              const source = audioContextRef.current!.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current!.destination);

              // Queueing
              const currentTime = audioContextRef.current!.currentTime;
              if (nextStartTimeRef.current < currentTime) {
                  nextStartTimeRef.current = currentTime;
              }
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              
              source.onended = () => {
                 if (audioContextRef.current && audioContextRef.current.currentTime >= nextStartTimeRef.current) {
                     setIsTalking(false);
                 }
              };
            }
          },
          onclose: () => {
             setConnected(false);
             setIsTalking(false);
          },
          onerror: (e) => {
             console.error("Live API Error", e);
             setConnected(false);
          }
        }
      });
      
      // Store session to close later
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start voice session", err);
      setActive(false);
    }
  };

  const stopSession = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (inputAudioContextRef.current) {
      await inputAudioContextRef.current.close();
    }
    if (audioContextRef.current) {
      await audioContextRef.current.close();
    }
    // Note: Live API session closure logic is handled by client disconnection typically
    // or by calling session.close() if available in the SDK interface wrapper.
    if (sessionRef.current) {
      sessionRef.current.then(session => {
         // session.close() if exists, otherwise assume GC/disconnect handles it
         if (typeof session.close === 'function') {
            session.close();
         }
      }).catch(() => {});
    }
    
    setConnected(false);
    setIsTalking(false);
    setActive(false);
  };

  const toggleVoice = () => {
    if (active) {
      stopSession();
    } else {
      setActive(true);
      startSession();
    }
  };

  return (
    <>
      <button
        onClick={toggleVoice}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all z-50 flex items-center gap-2
          ${active 
            ? 'bg-rose-500 text-white w-auto px-6' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 w-14 h-14 justify-center'}`}
      >
        {active ? (
          <>
            <X className="w-5 h-5" />
            <span className="font-medium">End Call</span>
          </>
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </button>

      {/* Visualizer Overlay */}
      {active && (
        <div className="fixed bottom-24 right-6 w-80 bg-slate-900 rounded-2xl shadow-2xl p-6 z-50 text-white animate-fade-in-up border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              MotoRent AI Agent
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {connected ? 'LIVE' : 'CONNECTING...'}
            </span>
          </div>

          <div className="h-24 flex items-center justify-center gap-1">
             {/* Fake visualizer bars */}
             {[1,2,3,4,5].map(i => (
                <div 
                  key={i} 
                  className={`w-3 bg-indigo-500 rounded-full transition-all duration-100 ease-in-out
                    ${isTalking ? 'animate-bounce' : 'h-2'}`}
                  style={{ 
                    height: isTalking ? `${Math.random() * 60 + 20}px` : '4px',
                    animationDelay: `${i * 0.1}s` 
                  }}
                />
             ))}
          </div>
          
          <div className="mt-4 text-center text-sm text-slate-400">
             {isTalking ? "AI is speaking..." : "Listening..."}
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAgent;