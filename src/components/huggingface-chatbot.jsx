'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from 'lucide-react'

export function HuggingFaceChatbot() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sentiment, setSentiment] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const assistantMessage = await response.json()
      
      if (assistantMessage.error) {
        throw new Error(assistantMessage.error)
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Update sentiment if provided
      if (assistantMessage.data && assistantMessage.data.sentiment) {
        setSentiment(assistantMessage.data.sentiment[0]?.label || 'Neutral')
      }

    } catch (err) {
      console.error('Chat error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
      case 'joy':
      case 'love':
        return 'text-green-400';
      case 'negative':
      case 'sadness':
      case 'anger':
      case 'fear':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Sentiment Analysis Chatbot</CardTitle>
        <p className="text-sm text-gray-400">
          This is an AI chatbot, not a licensed therapist. It cannot provide medical advice.
        </p>
        {sentiment && (
          <div className={`text-sm ${getSentimentColor(sentiment)}`}>
            Current sentiment: {sentiment}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 ${message?.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`inline-block p-2 rounded-lg text-wrap break-words max-w-[80%] ${
                  message?.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
                }`}>
                {message.content}
              </div>
              {message.role === 'assistant' && message.data?.sentiment && (
                <div className={`mt-1 text-sm ${getSentimentColor(message.data.sentiment[0]?.label)}`}>
                  Sentiment: {message.data.sentiment[0]?.label || 'Neutral'}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          )}
          {error && (
            <div className="text-red-500 text-center mt-2">
              Error: {error}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Type your message..."
            className="flex-grow text-white bg-gray-700 border-gray-600"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}