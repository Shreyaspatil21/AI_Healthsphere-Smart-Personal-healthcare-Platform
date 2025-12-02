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
<<<<<<< HEAD
  sessionId: string;
=======
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
  onNewMessage: (message: Message) => void;
  onError: (error: string) => void;
}

export interface ConversationManagerRef {
  handleTranscript: (transcript: string, isFinal: boolean) => void;
}

const ConversationManager = forwardRef<ConversationManagerRef, ConversationManagerProps>(
<<<<<<< HEAD
  ({ isCallActive, doctorPrompt, sessionId, onNewMessage, onError }, ref) => {
=======
  ({ isCallActive, doctorPrompt, onNewMessage, onError }, ref) => {
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
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

<<<<<<< HEAD
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

=======
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
    const processTranscript = async (transcript: string) => {
      if (transcript.trim() === lastTranscriptRef.current.trim() || processingTranscriptRef.current) return;

      processingTranscriptRef.current = true;
      lastTranscriptRef.current = transcript;

<<<<<<< HEAD
      console.log(`[DEBUG] Processing transcript: "${transcript}"`);

=======
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
      const userMessage: Message = {
        role: 'user',
        content: transcript,
        timestamp: Date.now()
      };

<<<<<<< HEAD
      console.log(`[DEBUG] Created user message:`, userMessage);

=======
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
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

<<<<<<< HEAD
          console.log(`[DEBUG] Created assistant message:`, assistantMessage);

          setMessages(prev => [...prev, assistantMessage]);
          onNewMessage(assistantMessage);

          // Save conversation to database
          const fullConversation = [...messages, userMessage, assistantMessage];
          console.log(`[DEBUG] Full conversation before saving:`, fullConversation.length, 'messages');
          await saveConversationToDatabase(fullConversation);
=======

          setMessages(prev => [...prev, assistantMessage]);
          onNewMessage(assistantMessage);
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
        }
      } catch (error) {
        console.error("Error sending to AI agent:", error);
        onError("Error communicating with AI. Please try again.");


        const fallbackMessage: Message = {
          role: 'assistant',
          content: "I'm sorry, I'm having trouble processing your request. Could you please try again?",
          timestamp: Date.now()
        };

<<<<<<< HEAD
        console.log(`[DEBUG] Created fallback message:`, fallbackMessage);

        setMessages(prev => [...prev, fallbackMessage]);
        onNewMessage(fallbackMessage);

        // Save conversation to database even with fallback
        const fullConversationWithFallback = [...messages, userMessage, fallbackMessage];
        console.log(`[DEBUG] Full conversation with fallback before saving:`, fullConversationWithFallback.length, 'messages');
        await saveConversationToDatabase(fullConversationWithFallback);
=======
        setMessages(prev => [...prev, fallbackMessage]);
        onNewMessage(fallbackMessage);
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
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