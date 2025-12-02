"use client"
import { Message } from './ConversationManager';
<<<<<<< HEAD
import { Mic, MicOff } from 'lucide-react';
=======
import { Mic, MicOff, Loader2 } from 'lucide-react';
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa

interface ConversationDisplayProps {
  messages: Message[];
  userCaption: string;
  assistantCaption: string;
  isCallActive: boolean;
  isListening: boolean;
  isSpeaking: boolean;
<<<<<<< HEAD
=======
  isThinking?: boolean;
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
}

const ConversationDisplay = ({
  messages,
  userCaption,
  assistantCaption,
  isCallActive,
  isListening,
<<<<<<< HEAD
  isSpeaking
}: ConversationDisplayProps) => {
  return (
    <div className='flex flex-col gap-2 mt-10 w-full max-w-'>
      {/* Assistant caption with speaking indicator */}
      <div className='border p-2 rounded-md bg-gray-50 min-h-[40px] flex justify-between items-center'>
        <p className='text-sm text-blue-500'>🩺 Doctor: {assistantCaption}</p>
        {isCallActive && isSpeaking && (
          <div className="flex space-x-1">
            <div className="w-1 h-4 bg-blue-500 animate-pulse rounded-full"></div>
            <div className="w-1 h-4 bg-blue-500 animate-pulse rounded-full animation-delay-200"></div>
            <div className="w-1 h-4 bg-blue-500 animate-pulse rounded-full animation-delay-400"></div>
=======
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
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
          </div>
        )}
      </div>

<<<<<<< HEAD
      {/* User caption with listening indicator */}
      <div className='border p-2 rounded-md bg-gray-50 min-h-[40px] mb-2 flex justify-between items-center'>
        <p className='text-sm text-gray-500'>👤 User: {userCaption}</p>
        {isCallActive && (
          <div className="flex items-center">
=======
      {/* Status Indicators */}
      {isCallActive && (
        <div className='flex items-center justify-center gap-4 mt-4'>
          <div className='flex items-center gap-2'>
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
            {isListening ? (
              <Mic className="h-4 w-4 text-green-500 animate-pulse" />
            ) : (
              <MicOff className="h-4 w-4 text-gray-400" />
            )}
<<<<<<< HEAD
          </div>
        )}
      </div>

=======
            <span className='text-xs text-gray-500'>
              {isListening ? 'Listening...' : 'Not listening'}
            </span>
          </div>
        </div>
      )}
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
    </div>
  );
};

<<<<<<< HEAD
export default ConversationDisplay; 
=======
export default ConversationDisplay;
>>>>>>> 0a74951a08b525410bbc5b77e68a3dc7761227fa
