import assert from 'node:assert/strict';
import test from 'node:test';
import { createInterviewTts } from '@/lib/interview-tts';

test('Sarvam Shubh is selected when a server-only key is configured', () => {
  assert.deepEqual(createInterviewTts('test-sarvam-key').toConfig(), {
    vendor: 'sarvam',
    params: {
      api_subscription_key: 'test-sarvam-key',
      speaker: 'shubh',
      target_language_code: 'en-IN',
    },
  });
});

test('MiniMax remains the startup fallback without a Sarvam key', () => {
  assert.deepEqual(createInterviewTts('').toConfig(), {
    vendor: 'minimax',
    params: {
      voice_setting: {
        voice_id: 'English_captivating_female1',
      },
    },
    _minimaxPresetModel: 'speech_2_6_turbo',
  });
});
