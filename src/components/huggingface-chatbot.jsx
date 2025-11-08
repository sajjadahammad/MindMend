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
  const abortController = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = { id: Date.now().toString(), role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // Cancel previous stream
    abortController.current?.abort()
    abortController.current = new AbortController()

    // Add streaming placeholder
    const aiPlaceholder = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      isStreaming: true,
      data: { emotion: [] }
    }
    setMessages(prev => [...prev, aiPlaceholder])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], userId: 'user-1' }),
        signal: abortController.current.signal
      })

      if (!res.ok) throw new Error('Network error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let finalEmotion = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        fullText += chunk

        // Try to parse emotion from the very last valid JSON in stream
        try {
          const jsonMatch = chunk.match(/\{.*"data":\{"emotion":\[\{.*?\}\]\}\}/s)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            if (parsed.data?.emotion?.[0]) {
              finalEmotion = parsed.data.emotion[0]
            }
          }
        } catch {}

        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last?.isStreaming) {
            last.content = fullText
            if (finalEmotion) last.data.emotion = [finalEmotion]
          }
          return updated
        })
      }

      // Final cleanup
      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last?.isStreaming) {
          delete last.isStreaming
        }
        return updated
      })

    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last?.isStreaming) {
            last.content = 'Sorry, something went wrong. Try again?'
            delete last.isStreaming
          }
          return updated
        })
      }
    } finally {
      setIsLoading(false)
      abortController.current = null
    }
  }

  const getEmotionColor = (label) => {
    switch (label?.toLowerCase()) {
      case 'joy': case 'love': return 'text-green-400'
      case 'anger': case 'fear': return 'text-red-400'
      case 'sadness': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gray-900 border-gray-800 shadow-2xl">
      <CardHeader className="text-center pb-3">
        <CardTitle className="text-3xl font-bold text-white">I'm Here For You</CardTitle>
        <p className="text-gray-400 text-sm">You're safe to share anything</p>
      </CardHeader>

      <CardContent>
        <ScrollArea ref={scrollRef} className="h-96 pr-4">
          <div className="space-y-6 py-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500">
                <p className="text-xl">Hey there</p>
                <p>How are you feeling right now?</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-5 py-3 rounded-3xl shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content || (msg.isStreaming ? '' : '...')}
                  </p>

                  {msg.role === 'assistant' && msg.data?.emotion?.[0] && (
                    <div className={`mt-2 text-xs font-semibold ${getEmotionColor(msg.data.emotion[0].label)}`}>
                      I hear {msg.data.emotion[0].label} in your words
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-5 py-3 rounded-3xl">
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

      <CardFooter className="pt-4">
        <form onSubmit={handleSubmit} className="flex w-full gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me how you're feeling..."
            disabled={isLoading}
            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 text-lg"
            autoFocus
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 px-8"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send'}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}