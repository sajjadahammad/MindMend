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

// // Message formatting functions
// export function formatMessageLine(line, index) {
//   // Bold: **text**
//   if (line.match(/^\*\*.*\*\*$/)) {
//     return <p key={index} className="font-bold text-base sm:text-lg my-2">{line.replace(/\*\*/g, '')}</p>
//   }
//   // Italic: *text*
//   if (line.match(/^\*.*\*$/)) {
//     return <p key={index} className="italic opacity-90 my-1">{line.replace(/\*/g, '')}</p>
//   }
//   // Bullet points
//   if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
//     return (
//       <p key={index} className="ml-4 flex items-start gap-2">
//         <span className="text-blue-400 mt-1">•</span>
//         <span>{line.replace(/^[\s•\-\*]+/, '').trim()}</span>
//       </p>
//     )
//   }
//   // Numbered list
//   if (/^\d+\.\s/.test(line)) {
//     return (
//       <p key={index} className="ml-4 flex items-start gap-2">
//         <span className="text-blue-400 font-medium">{line.match(/^\d+/)[0]}.</span>
//         <span>{line.replace(/^\d+\.\s*/, '')}</span>
//       </p>
//     )
//   }
//   // Default paragraph
//   return <p key={index} className="mb-2 last:mb-0">{line}</p>
// }

export function renderFormattedMessage(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <strong key={i} className="font-bold text-base">{line.slice(2, -2)}</strong>;
    }
    if (line.startsWith('*') && line.endsWith('*')) {
      return <em key={i} className="italic">{line.slice(1, -1)}</em>;
    }
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return (
        <div key={i} className="flex items-center gap-2 ml-4">
          <span className="text-blue-400">•</span>
          <span>{line.replace(/^[\s•\-]+/, '')}</span>
        </div>
      );
    }
    return <p key={i} className="mb-1">{line}</p>;
  });
}

// src/lib/utils.ts

// === EXTRACT FULL TEXT + EMOTION FROM AI MESSAGE ===
export function getMessageContentAndEmotion(message) {
  // Handle different message formats
  let fullText = '';
  
  // Try content string first (most common for streaming)
  if (typeof message.content === 'string') {
    fullText = message.content;
  }
  // Try parts array (for structured messages)
  else if (message.parts && Array.isArray(message.parts)) {
    fullText = message.parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text || '')
      .join('');
  }
  // Fallback to empty string
  else {
    fullText = '';
  }

  // Extract emotion (supports multiple formats)
  const emotion = 
    message.experimental_attachments?.emotion?.[0] ||
    message.metadata?.emotion?.[0] ||
    message.emotion?.[0] ||
    null;

  return { fullText, emotion };
}