'use client'

import { useState, useRef, useEffect } from 'react'
import { Brain, Send } from 'lucide-react'

export function HuggingFaceChatbot() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('')
  const scrollRef = useRef(null)

  // Load user name from localStorage on mount
  useEffect(() => {
    const storedName = localStorage.getItem('mindmend_user_name')
    if (storedName) {
      setUserName(storedName)
    }
  }, [])

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        const welcomeMessage = userName 
          ? `Welcome back, ${userName}! It's good to see you again. How are you feeling today?`
          : "Hi there! I'm MindMend, your personal AI therapist. I'm here to listen and support you. What's your name?"
        
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: welcomeMessage,
        }])
      }, 500)
    }
  }, [userName])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userInput = input.trim()
    
    // Extract name if user hasn't provided one yet
    if (!userName && messages.length <= 1) {
      // Simple name extraction - look for common patterns
      const namePatterns = [
        /(?:my name is|i'm|i am|call me|this is)\s+([a-z]+)/i,
        /^([a-z]+)$/i, // Just a single word (likely a name)
      ]
      
      for (const pattern of namePatterns) {
        const match = userInput.match(pattern)
        if (match && match[1]) {
          const extractedName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()
          setUserName(extractedName)
          localStorage.setItem('mindmend_user_name', extractedName)
          break
        }
      }
    }

    const userMsg = { id: Date.now().toString(), role: 'user', content: userInput }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      // Build context with user name if available (hidden from UI)
      const contextPrefix = userName 
        ? `[Context: User's name is ${userName}. Use their name naturally in conversation when appropriate.]\n\n`
        : ''
      
      // Prepare messages for API with hidden context
      const apiMessages = [...messages, { role: 'user', content: userInput }]
      
      // Add context to the first user message if name exists
      if (userName && apiMessages.length > 0) {
        apiMessages[0] = {
          ...apiMessages[0],
          content: contextPrefix + apiMessages[0].content
        }
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: apiMessages, 
          userId: userName || 'user-1' 
        })
      })

      const data = await res.json()
      setMessages(prev => [...prev, {
        id: data.id,
        role: 'assistant',
        content: data.content,
        data: data.data
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Could you try again?"
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const getEmotionColor = (label) => {
    const colors = {
      joy: 'text-emerald-500',
      love: 'text-pink-500',
      sadness: 'text-blue-500',
      anger: 'text-red-500',
      fear: 'text-amber-500',
      surprise: 'text-purple-500'
    }
    return colors[label?.toLowerCase()] || 'text-gray-500'
  }

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
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`group relative max-w-[90%] sm:max-w-[85%] ${m.role === 'user' ? 'ml-8 sm:ml-12' : 'mr-8 sm:mr-12'}`}>
                {/* Avatar - hidden on mobile */}
                <div className={`hidden sm:flex absolute top-0 ${m.role === 'user' ? '-right-10' : '-left-10'} w-8 h-8 rounded-full items-center justify-center text-xs font-medium ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                }`}>
                  {m.role === 'user' ? 'You' : 'AI'}
                </div>

                {/* Message bubble */}
                <div className={`px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800/50 text-gray-100 border border-gray-700/50'
                }`}>
                  <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </p>
                  
                  {/* Emotion tag */}
                  {m.role === 'assistant' && m.data?.emotion?.[0] && (
                    <div className={`mt-2 text-[10px] sm:text-xs font-medium flex items-center gap-1 ${getEmotionColor(m.data.emotion[0].label)}`}>
                      <span className="opacity-60">Detected:</span>
                      <span className="capitalize">{m.data.emotion[0].label}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="mr-8 sm:mr-12 relative">
                <div className="hidden sm:flex absolute -left-10 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center text-xs font-medium text-white">
                  AI
                </div>
                <div className="bg-gray-800/50 border border-gray-700/50 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex-none border-t border-gray-800/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Message MindMend..."
              disabled={isLoading}
              className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent disabled:opacity-50 transition-all"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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