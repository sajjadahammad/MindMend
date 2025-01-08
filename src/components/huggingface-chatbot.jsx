'use client'

import { useState } from 'react'
import { useChat } from 'ai/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from 'lucide-react'

export function HuggingFaceChatbot() {
  const [sentiment, setSentiment] = useState(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    onFinish: (message) => {
      console.log('Message received:', message);
      if (message?.role === 'assistant' && message?.data?.sentiment) {
        const sentiment = message.data.sentiment[0][0]?.label || 'Neutral';
        
        setSentiment(sentiment);
        
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
    body: {
      stream: true 
    },
    // streamProtocol:'text'
  })



  return (
    <Card className="w-full max-w-md mx-auto bg-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Sentiment Analysis Chatbot</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`mb-4 ${message?.role === 'user' ? 'text-right' : 'text-left'
                }`}>
              <div
                className={`inline-block p-2 rounded-lg  text-wrap break-words ${message?.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-black'
                  }`}>
                {message.content}
              </div>
              {message.role === 'assistant' && sentiment && (
                <div className="mt-1 text-sm text-gray-500">
                  Sentiment: {message.sentiment}
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
              Error: {error.message}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full space-x-2" >
          <Input
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            placeholder="Type your message..."
            className="flex-grow text-white" />
          <Button type="submit" disabled={isLoading}>{isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Send'
          )}</Button>
        </form>
      </CardFooter>
    </Card> 
  );
}

