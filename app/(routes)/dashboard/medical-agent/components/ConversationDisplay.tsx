"use client"
import { Message } from './ConversationManager';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface ConversationDisplayProps {
  messages: Message[];
  userCaption: string;
  assistantCaption: string;
  isCallActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking?: boolean;
}

const ConversationDisplay = ({
  messages,
  userCaption,
  assistantCaption,
  isCallActive,
  isListening,
  isSpeaking,
  isThinking = false
}: ConversationDisplayProps) => {
  return (
    <div className='flex flex-col gap-4 mt-10 w-full max-w-4xl mx-auto'>
      {/* Chat Messages */}
      <div className='flex flex-col gap-3 max-h-96 overflow-y-auto p-2'>
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-gray-200 text-gray-800 rounded-bl-none'
            }`}>
              <p className='text-sm'>{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Live Assistant Message */}
        {assistantCaption && (
          <div className='flex justify-start'>
            <div className='max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none'>
              <p className='text-sm'>🩺 {assistantCaption}</p>
              {isSpeaking && (
                <div className="flex space-x-1 mt-1">
                  <div className="w-1 h-3 bg-blue-500 animate-pulse rounded-full"></div>
                  <div className="w-1 h-3 bg-blue-500 animate-pulse rounded-full animation-delay-200"></div>
                  <div className="w-1 h-3 bg-blue-500 animate-pulse rounded-full animation-delay-400"></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Thinking Loader */}
        {isThinking && (
          <div className='flex justify-start'>
            <div className='max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none'>
              <div className='flex items-center gap-2'>
                <Loader2 className='w-4 h-4 animate-spin' />
                <p className='text-sm'>AI is thinking…</p>
              </div>
            </div>
          </div>
        )}

        {/* Live User Caption */}
        {userCaption && (
          <div className='flex justify-end'>
            <div className='max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-blue-500 text-white rounded-br-none'>
              <p className='text-sm'>👤 {userCaption}</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Indicators */}
      {isCallActive && (
        <div className='flex items-center justify-center gap-4 mt-4'>
          <div className='flex items-center gap-2'>
            {isListening ? (
              <Mic className="h-4 w-4 text-green-500 animate-pulse" />
            ) : (
              <MicOff className="h-4 w-4 text-gray-400" />
            )}
            <span className='text-xs text-gray-500'>
              {isListening ? 'Listening...' : 'Not listening'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationDisplay;
