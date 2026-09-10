import assert from 'node:assert/strict';
import test from 'node:test';
import { createInterviewTts } from '@/lib/interview-tts';

test('Sarvam Shubh uses the authenticated Bulbul v3 PCM bridge when configured', () => {
  assert.deepEqual(createInterviewTts('test-sarvam-key', 'https://example.com/').toConfig(), {
    vendor: 'generic_http',
    url: 'https://example.com/api/ai/sarvam/tts',
    headers: {
      Authorization: 'Bearer test-sarvam-key',
    },
    params: {
      model: 'bulbul:v3',
      voice: 'shubh',
      speed: 1,
      sample_rate: 24000,
      response_format: 'pcm',
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
