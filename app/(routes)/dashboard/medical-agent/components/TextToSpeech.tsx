"use client"
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';

interface TextToSpeechProps {
  text: string;
  onSpeakingStart: () => void;
  onSpeakingEnd: () => void;
}

export interface TextToSpeechRef {
  stopSpeaking: () => void;
}

const TextToSpeech = forwardRef<TextToSpeechRef, TextToSpeechProps>(({
  text,
  onSpeakingStart,
  onSpeakingEnd,
}, ref) => {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const previousTextRef = useRef<string>("");

  useImperativeHandle(ref, () => ({
    stopSpeaking,
  }));

  const stopSpeaking = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      if (audioElementRef.current.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioElementRef.current.src);
      }
      audioElementRef.current.src = '';
    }
    setAudioUrl(null);
    setIsPlaying(false);
  };

  const handlePlay = () => {
    if (audioElementRef.current && audioUrl) {
      audioElementRef.current.src = audioUrl;
      audioElementRef.current.play();
      setIsPlaying(true);
      onSpeakingStart();
    }
  };
  
  useEffect(() => {
    const processText = async (textToSpeak: string) => {
      if (!textToSpeak || textToSpeak.trim() === '') return;
      
      stopSpeaking();

      const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_MURF_API_KEY;
      if (!ELEVENLABS_API_KEY) {
        console.error("ElevenLabs API key (NEXT_PUBLIC_MURF_API_KEY) is not set in .env.local");
        return;
      }
      
      const voiceId = "21m00Tcm4TlvDq8ikWAM"; 
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
      const headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      };
      const data = {
        text: textToSpeak,
        model_id: "eleven_monolingual_v1",
      };

      try {
        console.log("Calling ElevenLabs API to fetch audio...");
        const response = await axios.post(url, data, { headers, responseType: 'blob' });
        const newAudioUrl = URL.createObjectURL(response.data);
        setAudioUrl(newAudioUrl);
        console.log("Audio fetched successfully. Ready to play.");
      } catch (error) {
        console.error("Error calling ElevenLabs API:", error);
      }
    };

    if (text && text.trim() !== '' && text !== previousTextRef.current) {
      previousTextRef.current = text;
      processText(text);
    }
  }, [text]);

  useEffect(() => {
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();
      audioElementRef.current.onended = () => {
        setIsPlaying(false);
        onSpeakingEnd();
        setAudioUrl(null); // Clear the URL after playing
      };
      audioElementRef.current.onerror = (e) => {
        console.error("Audio playback error occurred", e);
        setIsPlaying(false);
        onSpeakingEnd();
      };
    }
  }, [onSpeakingEnd]);

  if (!audioUrl || isPlaying) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
      <button 
        onClick={handlePlay} 
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
      >
        Play AI Response
      </button>
    </div>
  );
});

TextToSpeech.displayName = 'TextToSpeech';

export default TextToSpeech;