"use client"
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';

interface TextToSpeechProps {
  text: string;
<<<<<<< HEAD
  voiceId?: string;
  doctorId?: number;
  onSpeakingStart: () => void;
  onSpeakingEnd: () => void;
  onError: (error: string) => void;
=======
  onSpeakingStart: () => void;
  onSpeakingEnd: () => void;
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
}

export interface TextToSpeechRef {
  stopSpeaking: () => void;
}

const TextToSpeech = forwardRef<TextToSpeechRef, TextToSpeechProps>(({
  text,
<<<<<<< HEAD
  voiceId = 'will',
  doctorId,
  onSpeakingStart,
  onSpeakingEnd,
  onError
}, ref) => {
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [pendingText, setPendingText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const previousTextRef = useRef<string>("");
  const speechSynthesisUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [murfApiCalls, setMurfApiCalls] = useState<number>(0);
  const [browserTtsFallbacks, setBrowserTtsFallbacks] = useState<number>(0);
  const [lastApiError, setLastApiError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    stopSpeaking: () => {
      stopSpeaking();
    }
  }));

  useEffect(() => {
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio();

      audioElementRef.current.addEventListener('ended', handleAudioEnded);
      audioElementRef.current.addEventListener('error', handleAudioError);
    }

    return () => {
      stopSpeaking();

      if (audioElementRef.current) {
        audioElementRef.current.removeEventListener('ended', handleAudioEnded);
        audioElementRef.current.removeEventListener('error', handleAudioError);
        audioElementRef.current = null;
      }
    };
  }, []);


  useEffect(() => {
    if (text && text.trim() !== '' && text !== previousTextRef.current) {
      previousTextRef.current = text;

      if (isProcessing) {

        setPendingText(text);
      } else {
        processText(text);
      }
    }
  }, [text]);


  useEffect(() => {
    if (!isProcessing && pendingText) {
      const textToProcess = pendingText;
      setPendingText("");
      processText(textToProcess);
    }
  }, [isProcessing, pendingText]);


  useEffect(() => {
    console.log(`TTS Stats - Murf API calls: ${murfApiCalls}, Browser TTS fallbacks: ${browserTtsFallbacks}`);
    if (lastApiError) {
      console.error(`Last API error: ${lastApiError}`);
    }
  }, [murfApiCalls, browserTtsFallbacks, lastApiError]);

  const handleAudioEnded = () => {
    setIsProcessing(false);
    onSpeakingEnd();
  };

  const handleAudioError = (e: Event) => {
    const audioError = e as any;
    console.error("Audio playback error occurred", {
      error: audioError,
      target: audioError.target,
      errorCode: audioError.target?.error?.code,
      errorMessage: audioError.target?.error?.message,
      networkState: audioError.target?.networkState,
      readyState: audioError.target?.readyState,
      src: audioError.target?.src,
      currentSrc: audioError.target?.currentSrc,
      duration: audioError.target?.duration,
      buffered: audioError.target?.buffered
    });
    setIsProcessing(false);
    onSpeakingEnd();
  };


  const stopSpeaking = () => {
    console.log("TextToSpeech: stopSpeaking called");


    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
    }


    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }


    if (speechSynthesisUtteranceRef.current) {
      speechSynthesisUtteranceRef.current = null;
    }


    setIsProcessing(false);
    setPendingText("");
  };

  const processText = async (textToSpeak: string) => {
    if (!textToSpeak || textToSpeak.trim() === '') return;


    stopSpeaking();

    setIsProcessing(true);
    onSpeakingStart();

    try {
      console.log(`Calling Murf AI TTS API with doctorId: ${doctorId}, voiceId: ${voiceId}`);


      const response = await axios.post('/api/tts', {
        text: textToSpeak,
        voiceId: voiceId,
        doctorId: doctorId
      }, {
        responseType: 'blob',
        validateStatus: function (status) {
          return status < 500; 
        }
      });


      const contentType = response.headers['content-type'];

      if (contentType && contentType.includes('audio')) {

        console.log("Murf AI TTS successful - received audio data");
        setMurfApiCalls(prev => prev + 1);
        setLastApiError(null);

        const audioUrl = URL.createObjectURL(response.data);

        if (audioElementRef.current) {
          audioElementRef.current.src = audioUrl;

          try {
            await audioElementRef.current.play();

          } catch (error) {
            console.error("Error playing Murf AI audio:", error);
            setIsProcessing(false);
            onSpeakingEnd();


            await playBrowserTTS(textToSpeak);
          }
        }
      } else {

        console.log("Murf AI TTS returned JSON response - likely fallback to browser TTS");

        try {

          const jsonData = await response.data.text();
          const jsonResponse = JSON.parse(jsonData);


          if (jsonResponse.error) {
            setLastApiError(jsonResponse.error);
            if (jsonResponse.errorDetails) {
              console.error("Detailed Murf API error:", jsonResponse.errorDetails);
            }
          }

          if (jsonResponse.useBrowserTTS) {
            console.log("Murf API requested browser TTS fallback");
            setBrowserTtsFallbacks(prev => prev + 1);
            await playBrowserTTS(jsonResponse.text || textToSpeak);
          } else {
            throw new Error("Invalid TTS response");
          }
        } catch (error) {
          console.error("Error parsing TTS response:", error);
          setBrowserTtsFallbacks(prev => prev + 1);
          await playBrowserTTS(textToSpeak);
        }
      }
    } catch (error) {
      console.error("Failed to generate speech with Murf AI:", error);
      setIsProcessing(false);
      onError("Failed to generate speech. Using browser TTS instead.");
      setBrowserTtsFallbacks(prev => prev + 1);


      await playBrowserTTS(textToSpeak);
    }
  };


  const playBrowserTTS = (textToSpeak: string): Promise<void> => {
    console.log("Using browser's built-in TTS as fallback");

    return new Promise((resolve) => {
      try {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          speechSynthesisUtteranceRef.current = utterance;

          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          utterance.onend = () => {
            console.log("Browser TTS speech ended");
            setIsProcessing(false);
            onSpeakingEnd();
            resolve();
          };

          utterance.onerror = (event) => {
            console.error("Browser TTS error:", event);
            setIsProcessing(false);
            onSpeakingEnd();
            resolve();
          };

          window.speechSynthesis.speak(utterance);
        } else {
          console.warn("SpeechSynthesis not supported in this browser");
          setIsProcessing(false);
          onSpeakingEnd();
          resolve();
        }
      } catch (error) {
        console.error("Error with browser TTS:", error);
        setIsProcessing(false);
        onSpeakingEnd();
        resolve();
      }
    });
  };

  return null; 
=======
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
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
});

TextToSpeech.displayName = 'TextToSpeech';

<<<<<<< HEAD
export default TextToSpeech; 
=======
export default TextToSpeech;
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
