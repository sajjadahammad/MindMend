'use client'

import { useRef, useEffect, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Brain, Send } from 'lucide-react'
import {
  extractUserName,
  getEmotionColor,
  getWelcomeMessage,
  storeUserName,
  getUserName,
  renderFormattedMessage,
  getMessageContentAndEmotion
} from '@/lib/utils'

export function HuggingFaceChatbot() {
  const [userName, setUserName] = useState('')
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  // Load user name
  useEffect(() => {
    const storedName = getUserName()
    if (storedName) setUserName(storedName)
  }, [])

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({
        userId: userName ? `user_${userName.toLowerCase()}` : 'anonymous'
      })
    }),
    initialMessages: [],
    onFinish: ({ message }) => {
      console.log('Message finished:', message);
      console.log('Metadata:', message.metadata);
    }
  })

  console.log('d',messages);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          parts: [{ type: 'text', text: getWelcomeMessage(userName) }]
        }])
      }, 700)
    }
  }, [userName, messages.length, setMessages])

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || status !== 'ready') return

    const userInput = input.trim()

    // Extract name
    if (!userName && messages.length <= 1) {
      const name = extractUserName(userInput)
      if (name) {
        setUserName(name)
        storeUserName(name)
      }
    }

    sendMessage({ text: userInput })
    setInput('')
  }

  const isLoading = status === 'submitted' || status === 'streaming'

  return (
    <div className="flex flex-col h-screen w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex-none px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-800/20 backdrop-blur-sm">
        <div className="flex items-center justify-center flex-col gap-1 sm:gap-2">
          <div className="flex gap-2 items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-medium text-gray-200">
              MindMend
            </h2>
          </div>
          <span className="text-[10px] sm:text-xs text-gray-500 font-normal">(Your personal AI therapist)</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
          {messages.map(m => {
            const { fullText, emotion } = getMessageContentAndEmotion(m);

            return (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`group relative max-w-[90%] sm:max-w-[85%] ${m.role === 'user' ? 'ml-8 sm:ml-12' : 'mr-8 sm:mr-12'}`}>
                  {/* Avatar */}
                  <div className={`hidden sm:flex absolute top-0 ${m.role === 'user' ? '-right-10' : '-left-10'} w-8 h-8 rounded-full items-center justify-center text-xs font-medium ${m.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                    }`}>
                    {m.role === 'user' ? 'You' : 'AI'}
                  </div>

                  {/* Message Bubble */}
                  <div className={`px-4 sm:px-6 py-3.5 sm:py-4 rounded-3xl shadow-lg ${m.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800/70 text-gray-100 border border-gray-700/60 backdrop-blur-sm'
                    }`}>
                    <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                      {renderFormattedMessage(fullText)}
                    </div>

                    {/* Emotion Tag */}
                    {m.role === 'assistant' && emotion && (
                      <div className={`mt-3 pt-2 border-t border-gray-600/40 flex items-center gap-2 text-xs font-semibold ${getEmotionColor(emotion.label)}`}>
                        <span className="opacity-70">I hear</span>
                        <span className="capitalize underline decoration-wavy">
                          {emotion.label}
                        </span>
                        <span className="opacity-70">in your words</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="mr-8 sm:mr-12 relative">
                <div className="hidden sm:flex absolute -left-10 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center text-xs font-medium text-white">
                  AI
                </div>
                <div className="bg-gray-800/70 backdrop-blur-sm border border-gray-700/60 px-6 py-4 rounded-3xl shadow-lg">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-none border-t border-gray-800/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Message MindMend..."
              disabled={isLoading}
              className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 sm:px-5 py-3.5 text-sm sm:text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent disabled:opacity-50 transition-all"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0 shadow-lg"
            >
              <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-2 text-center px-2">
            MindMend can make mistakes. Consider checking important information.
          </p>
        </form>
      </div>
    </div>
  )
}