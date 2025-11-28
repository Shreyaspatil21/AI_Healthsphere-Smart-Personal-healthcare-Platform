"use client"
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MessageCircle, X, Send } from 'lucide-react'
import axios from 'axios'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isMedicalQuery = (input: string): boolean => {
    const medicalKeywords = [
      'symptom', 'pain', 'fever', 'cough', 'headache', 'stomach', 'nausea', 'vomit', 'diarrhea',
      'medicine', 'drug', 'prescription', 'treatment', 'diagnosis', 'doctor', 'hospital',
      'illness', 'disease', 'infection', 'allergy', 'rash', 'sore', 'throat', 'chest',
      'back', 'joint', 'muscle', 'bone', 'skin', 'eye', 'ear', 'nose', 'mouth', 'tooth',
      'blood', 'pressure', 'sugar', 'cholesterol', 'weight', 'diet', 'exercise', 'health'
    ]
    const lowerInput = input.toLowerCase()
    return medicalKeywords.some(keyword => lowerInput.includes(keyword))
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const userInput = inputValue
    setInputValue('')
    setIsLoading(true)

    try {
      // Check if it's a medical query
      const isMedical = isMedicalQuery(userInput)

      if (isMedical) {
        // Call the assistant API
        const response = await axios.post('/api/assistant', { transcript: userInput })
        const data = response.data
        const botText = data.data?.replyText || 'Sorry, I couldn\'t process your medical query.'
        // Format the response to display numbered/bulleted points on new lines
        const formattedText = formatBotResponse(botText)
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: formattedText,
          sender: 'bot',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botResponse])
      } else {
        // Use the existing logic for non-medical queries
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: getBotResponse(userInput),
          sender: 'bot',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botResponse])
      }
    } catch (error) {
      console.error('Error getting bot response:', error)
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble responding right now. Please try again later.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const formatBotResponse = (text: string): string => {
    // Split by numbered lists (1., 2., etc.) or bullet points
    const lines = text.split(/\n/)
    const formattedLines = lines.map(line => {
      // Check if line starts with number or bullet
      if (/^\d+\./.test(line.trim()) || /^[-•*]/.test(line.trim())) {
        return line.trim()
      }
      return line
    })
    return formattedLines.join('\n')
  }

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    if (/\b(hello|hi)\b/i.test(input)) {
      return 'Hello! Welcome to Doctor.ai. How can I assist you?'
    } else if (/\b(help|support)\b/i.test(input)) {
      return 'I can help you with information about our medical services, booking appointments, or general health questions. What would you like to know?'
    } else if (/\b(appointment|book)\b/i.test(input)) {
      return 'To book an appointment, please visit our dashboard and start a medical consultation. Would you like me to guide you there?'
    } else if (/\b(symptom|sick)\b/i.test(input)) {
      return 'For medical advice, please use our AI Medical Agent in the dashboard. It can provide personalized consultations.'
    } else {
      return 'I\'m here to help! For medical consultations, please use our AI Medical Agent. For other inquiries, feel free to ask.'
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-shadow"
          size="icon"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 w-80 max-w-sm">
          <Card className="shadow-2xl border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages */}
              <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t bg-white dark:bg-gray-800">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    disabled={!inputValue.trim() || isLoading}
                  >
                    {isLoading ? '...' : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

export default Chatbot
