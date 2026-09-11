import assert from 'node:assert/strict';
import test from 'node:test';
import { createInterviewTts } from '@/lib/interview-tts';

test('Gradium uses the configured server delivery voice', () => {
  const previousKey = process.env.GRADIUM_API_KEY;
  const previousVoice = process.env.GRADIUM_TTS_VOICE_ID;
  const previousHiringVoice = process.env.GRADIUM_HIRING_MANAGER_VOICE_ID;
  process.env.GRADIUM_API_KEY = 'test-gradium-key';
  process.env.GRADIUM_TTS_VOICE_ID = 'test-gradium-voice';
  delete process.env.GRADIUM_HIRING_MANAGER_VOICE_ID;

  assert.deepEqual(createInterviewTts().toConfig(), {
    vendor: 'gradium',
    params: {
      api_key: 'test-gradium-key',
      url: 'wss://api.gradium.ai/api/speech/tts',
      model_name: 'default',
      voice_id: 'test-gradium-voice',
      sample_rate: 24000,
    },
  });
  if (previousKey === undefined) delete process.env.GRADIUM_API_KEY; else process.env.GRADIUM_API_KEY = previousKey;
  if (previousVoice === undefined) delete process.env.GRADIUM_TTS_VOICE_ID; else process.env.GRADIUM_TTS_VOICE_ID = previousVoice;
  if (previousHiringVoice === undefined) delete process.env.GRADIUM_HIRING_MANAGER_VOICE_ID; else process.env.GRADIUM_HIRING_MANAGER_VOICE_ID = previousHiringVoice;
});

test('Gradium configuration is required', () => {
  const previousKey = process.env.GRADIUM_API_KEY;
  const previousVoice = process.env.GRADIUM_TTS_VOICE_ID;
  const previousHiringVoice = process.env.GRADIUM_HIRING_MANAGER_VOICE_ID;
  delete process.env.GRADIUM_API_KEY;
  delete process.env.GRADIUM_TTS_VOICE_ID;
  delete process.env.GRADIUM_HIRING_MANAGER_VOICE_ID;
  assert.throws(() => createInterviewTts(), /Gradium TTS requires/);
  if (previousKey === undefined) delete process.env.GRADIUM_API_KEY; else process.env.GRADIUM_API_KEY = previousKey;
  if (previousVoice === undefined) delete process.env.GRADIUM_TTS_VOICE_ID; else process.env.GRADIUM_TTS_VOICE_ID = previousVoice;
  if (previousHiringVoice === undefined) delete process.env.GRADIUM_HIRING_MANAGER_VOICE_ID; else process.env.GRADIUM_HIRING_MANAGER_VOICE_ID = previousHiringVoice;
});
