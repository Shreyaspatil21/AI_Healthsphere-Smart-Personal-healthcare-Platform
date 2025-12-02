"use client"
import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import axios from 'axios';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

interface ConversationManagerProps {
  isCallActive: boolean;
  doctorPrompt: string;
  sessionId: string;
  onNewMessage: (message: Message) => void;
  onError: (error: string) => void;
}

export interface ConversationManagerRef {
  handleTranscript: (transcript: string, isFinal: boolean) => void;
}

const ConversationManager = forwardRef<ConversationManagerRef, ConversationManagerProps>(
  ({ isCallActive, doctorPrompt, sessionId, onNewMessage, onError }, ref) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const lastTranscriptRef = useRef<string>("");
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const processingTranscriptRef = useRef<boolean>(false);

    useEffect(() => {
      if (isCallActive) {
        const initialMessage = {
          role: 'assistant' as const,
          content: "Hello, I'm your AI medical assistant. Can you tell me Your Name, age and what is your problem?",
          timestamp: Date.now()
        };

        setMessages([initialMessage]);
        onNewMessage(initialMessage);
      } else {
        setMessages([]);
        lastTranscriptRef.current = "";

        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      }
    }, [isCallActive, onNewMessage]);

    const handleTranscript = (transcript: string, isFinal: boolean) => {
      if (!transcript || transcript.trim() === "" || processingTranscriptRef.current) return;

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      if (isFinal) {
        processTranscript(transcript);
      } else {
        silenceTimeoutRef.current = setTimeout(() => {
          if (transcript && transcript.trim() !== "") {
            console.log("Silence detected, processing transcript:", transcript);
            processTranscript(transcript);
          }
        }, 2000);       
      }
    };

    const saveConversationToDatabase = async (conversationMessages: Message[]) => {
      try {
        console.log(`[DEBUG] Saving conversation to database for session: ${sessionId}`);
        console.log(`[DEBUG] Conversation messages count: ${conversationMessages.length}`);
        console.log(`[DEBUG] Sample messages:`, conversationMessages.slice(0, 2));

        const response = await axios.put('/api/session-chat', {
          sessionId,
          conversation: conversationMessages
        });

        console.log(`[DEBUG] Conversation saved successfully, response:`, response.data);
      } catch (error: any) {
        console.error("[DEBUG] Error saving conversation to database:", error);
        console.error("[DEBUG] Error response:", error.response?.data);
        console.error("[DEBUG] Error status:", error.response?.status);
      }
    };

    const processTranscript = async (transcript: string) => {
      if (transcript.trim() === lastTranscriptRef.current.trim() || processingTranscriptRef.current) return;

      processingTranscriptRef.current = true;
      lastTranscriptRef.current = transcript;

      console.log(`[DEBUG] Processing transcript: "${transcript}"`);

      const userMessage: Message = {
        role: 'user',
        content: transcript,
        timestamp: Date.now()
      };

      console.log(`[DEBUG] Created user message:`, userMessage);

      setMessages(prev => [...prev, userMessage]);
      onNewMessage(userMessage);

      try {
        const conversationHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        conversationHistory.push({
          role: 'user',
          content: transcript
        });


        const response = await axios.post('/api/chat', {
          messages: conversationHistory,
          doctorPrompt: doctorPrompt || "You are a helpful AI medical assistant."
        });

        if (response.data && response.data.content) {
          const assistantMessage: Message = {
            role: 'assistant',
            content: response.data.content,
            timestamp: Date.now()
          };

          console.log(`[DEBUG] Created assistant message:`, assistantMessage);

          setMessages(prev => [...prev, assistantMessage]);
          onNewMessage(assistantMessage);

          // Save conversation to database
          const fullConversation = [...messages, userMessage, assistantMessage];
          console.log(`[DEBUG] Full conversation before saving:`, fullConversation.length, 'messages');
          await saveConversationToDatabase(fullConversation);
        }
      } catch (error) {
        console.error("Error sending to AI agent:", error);
        onError("Error communicating with AI. Please try again.");


        const fallbackMessage: Message = {
          role: 'assistant',
          content: "I'm sorry, I'm having trouble processing your request. Could you please try again?",
          timestamp: Date.now()
        };

        console.log(`[DEBUG] Created fallback message:`, fallbackMessage);

        setMessages(prev => [...prev, fallbackMessage]);
        onNewMessage(fallbackMessage);

        // Save conversation to database even with fallback
        const fullConversationWithFallback = [...messages, userMessage, fallbackMessage];
        console.log(`[DEBUG] Full conversation with fallback before saving:`, fullConversationWithFallback.length, 'messages');
        await saveConversationToDatabase(fullConversationWithFallback);
      } finally {
        processingTranscriptRef.current = false;
      }
    };


    useImperativeHandle(ref, () => ({
      handleTranscript
    }));

    return null; 
  }
);

ConversationManager.displayName = 'ConversationManager';

export default ConversationManager; 