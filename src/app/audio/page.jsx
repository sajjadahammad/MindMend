'use client';

import { useState, useRef } from 'react';

// Audio conversion utilities
async function convertWebMToWAV(webmBlob) {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const fileReader = new FileReader();
    
    fileReader.onload = async function(e) {
      try {
        // Decode the WebM audio
        const audioBuffer = await audioContext.decodeAudioData(e.target.result);
        
        // Convert to WAV
        const wavBlob = audioBufferToWav(audioBuffer);
        resolve(wavBlob);
      } catch (error) {
        reject(error);
      }
    };
    
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(webmBlob);
  });
}

function audioBufferToWav(buffer) {
  const length = buffer.length;
  const sampleRate = buffer.sampleRate;
  const numberOfChannels = buffer.numberOfChannels;
  
  // Create WAV header
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);
  
  // Convert audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export default function Audio() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [responseAudio, setResponseAudio] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use webm format for recording (better browser support)
      const options = { mimeType: 'audio/webm;codecs=opus' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        audioChunksRef.current = [];
        await transcribeAudio(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const transcribeAudio = async (audioBlob) => {
    setIsProcessing(true);
    setError('');
    
    try {
      let processedAudio = audioBlob;
      
      console.log('Original audio type:', audioBlob.type);
      console.log('Original audio size:', audioBlob.size);
      
      // Check if conversion is needed
      if (audioBlob.type.includes('webm') || audioBlob.type.includes('opus')) {
        console.log('Converting WebM/Opus to WAV...');
        setError('Converting audio format...');
        processedAudio = await convertWebMToWAV(audioBlob);
        console.log('Converted audio type:', processedAudio.type);
        console.log('Converted audio size:', processedAudio.size);
      }
      
      setError('Transcribing audio...');
      const formData = new FormData();
      formData.append('audio', processedAudio, 'recording.wav');
      
      const response = await fetch('/api/therapist', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process audio');
      }
      
      setTranscript(data.transcript);
      setResponseAudio(data.audioUrl);
      setError('');
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to process audio: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">AI Therapist</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`w-full py-2 px-4 rounded transition-colors ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : isProcessing 
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isProcessing 
            ? 'Processing...' 
            : isRecording 
              ? 'Stop Recording' 
              : 'Start Recording'}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {audioUrl && (
          <div className="mt-4">
            <p className="font-semibold">Your Audio:</p>
            <audio controls src={audioUrl} className="w-full mt-2" />
          </div>
        )}
        
        {transcript && (
          <div className="mt-4">
            <p className="font-semibold">Transcript:</p>
            <p className="mt-2 p-3 bg-gray-50 rounded">{transcript}</p>
          </div>
        )}
        
        {responseAudio && (
          <div className="mt-4">
            <p className="font-semibold">AI Response:</p>
            <audio controls src={responseAudio} className="w-full mt-2" autoPlay />
          </div>
        )}
      </div>
    </div>
  );
}