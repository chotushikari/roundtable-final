'use client';

import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>>; resultIndex: number }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function speechRecognitionConstructor() {
  const browser = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

export function RecruiterVoiceControl({ onCommand }: { onCommand: (transcript: string) => Promise<string> }) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState('Voice control: create a job and interview link in English or Hinglish.');

  useEffect(() => () => recognitionRef.current?.abort(), []);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = speechRecognitionConstructor();
    if (!Recognition) {
      setFeedback('Voice input is not supported in this browser. Use Chrome or Edge, or type the details below.');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = async (event) => {
      const transcript = Array.from(event.results).slice(event.resultIndex)
        .map((result) => result[0]?.transcript ?? '').join(' ').trim();
      if (!transcript) return;
      setFeedback(`Heard: “${transcript}”`);
      try { setFeedback(await onCommand(transcript)); }
      catch { setFeedback('I could not complete that action. Your existing jobs were not changed. Please try again.'); }
    };
    recognition.onerror = (event) => setFeedback(event.error === 'not-allowed'
      ? 'Microphone permission is required for voice control.'
      : 'I could not hear that. Please try again.');
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    setFeedback('Listening… say, “Create an interview for Backend Engineer, intern, candidate Aditi Sharma, email aditi@example.com.”');
    recognition.start();
  }

  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <p className="hidden max-w-72 text-xs text-muted-foreground lg:block">{feedback}</p>
      <Button type="button" size="sm" variant={listening ? 'destructive' : 'outline'} onClick={toggleListening} aria-pressed={listening}>
        {listening ? <MicOff size={14} /> : <Mic size={14} />}
        {listening ? 'Stop' : 'Voice command'}
      </Button>
      {!listening && <Volume2 className="hidden text-muted-foreground lg:block" size={14} aria-hidden="true" />}
    </div>
  );
}
