#!/bin/bash
echo "Downloading Chatterbox TTS models..."
python3 -c "
import os
os.environ.setdefault('HF_HOME', '/app/data/models')

print('Downloading Turbo model...')
from chatterbox.tts_turbo import ChatterboxTurboTTS
ChatterboxTurboTTS.from_pretrained(device='cpu')
print('Turbo model downloaded.')

print('Downloading Standard model...')
from chatterbox.tts import ChatterboxTTS
ChatterboxTTS.from_pretrained(device='cpu')
print('Standard model downloaded.')

print('Downloading Multilingual model...')
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
ChatterboxMultilingualTTS.from_pretrained(device='cpu')
print('Multilingual model downloaded.')

print('All models downloaded successfully!')
"
