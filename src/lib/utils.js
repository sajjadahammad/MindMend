import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


export function extractUserName(text) {
  const namePatterns = [
    /my\s+name\s+is\s+([a-zA-Z\s]+)/i,
    /i'?m\s+([a-zA-Z\s]+)/i,
    /im\s+([a-zA-Z\s]+)/i,
    /i\s+am\s+([a-zA-Z\s]+)/i,
    /call\s+me\s+([a-zA-Z\s]+)/i,
    /this\s+is\s+([a-zA-Z\s]+)/i,
    /hey\s+it'?s?\s+([a-zA-Z\s]+)/i,
    /^([a-zA-Z]+)$/i, // single word
  ]

  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      let name = match[1].trim()
      // Clean up common junk
      name = name
        .replace(/[^a-zA-Z\s]/g, '') // remove symbols
        .trim()
        .split(/\s+/)[0] // take first name only
      
      // Capitalize first letter
      name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()

      // Validate name length
      if (name.length >= 2 && name.length <= 20) {
        return name
      }
    }
  }
  
  return null
}

export function getEmotionColor(label) {
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

export function getWelcomeMessage(userName) {
  return userName 
    ? `Welcome back, ${userName}! It's good to see you again. How are you feeling today?`
    : "Hi there! I'm MindMend, your personal AI therapist. I'm here to listen and support you. What's your name?"
}


export function buildContextPrefix(userName) {
  return userName 
    ? `[Context: User's name is ${userName}. Use their name naturally in conversation when appropriate.]\n\n`
    : ''
}

export function storeUserName(name) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mindmend_user_name', name)
  }
}

export function getUserName() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('mindmend_user_name')
  }
  return null
}
