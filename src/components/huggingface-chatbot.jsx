// components/HuggingFaceChatbot.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from 'lucide-react'

export function HuggingFaceChatbot() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef(null)

  // Auto welcome
  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "Hey there, I'm really glad you're here. What's your name? Then tell me — how are you doing today?",
        }])
      }, 800)
    }
  }, [])

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = { id: Date.now().toString(), role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, { role: 'user', content: input.trim() }], 
          userId: 'user-1' 
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
        content: "I'm having trouble connecting. Try again?"
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-gray-900 to-black border-gray-800 shadow-2xl">
      <CardHeader className="text-center pb-8">
        <CardTitle className="text-4xl font-bold text-white">I'm Here For You</CardTitle>
        <p className="text-gray-400 mt-2">Always. No judgment. Just care.</p>
      </CardHeader>

      <CardContent className="px-6">
        <ScrollArea className="h-96 mb-4">
          <div className="space-y-6 py-4" ref={scrollRef}>
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md px-5 py-4 rounded-3xl shadow-lg transition-all ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </p>
                  {m.role === 'assistant' && m.data?.emotion?.[0] && (
                    <div className="mt-2 text-xs opacity-80">
                      I hear <span className="font-bold text-red-500">
                        {m.data.emotion[0].label}
                      </span> in your words
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-5 py-4 rounded-3xl">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="pt-6">
        <form onSubmit={handleSubmit} className="flex w-full gap-3">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Tell me how you're feeling..."
            disabled={isLoading}
            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 text-lg py-6"
            autoFocus
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 px-8 text-lg font-medium"
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Send'}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}