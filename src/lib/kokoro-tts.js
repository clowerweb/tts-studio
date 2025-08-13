/* eslint-disable no-undef */

import {chunkText, cleanTextForTTS} from '../utils/text-cleaner.js';

// Text splitting stream to break text into chunks (enhanced for streaming)
export class TextSplitterStream {
  constructor() {
    this.chunks = [];
    this.pendingText = '';
    this.closed = false;
  }

  chunkText(text) {
    // Clean the text first, then chunk it
    const cleanedText = cleanTextForTTS(text);
    return chunkText(cleanedText);
  }

  push(...texts) {
    // Support both single text and multiple texts like the official implementation
    for (const text of texts) {
      this.pendingText += text;
      
      // Check if we have complete sentences to process
      const sentences = this.pendingText.split(/(?<=[.!?])\s+/);
      
      // Keep the last fragment in case it's incomplete
      if (sentences.length > 1) {
        this.pendingText = sentences.pop();
        
        // Process complete sentences
        for (const sentence of sentences) {
          if (sentence.trim()) {
            const chunks = this.chunkText(sentence) || [sentence];
            this.chunks.push(...chunks);
          }
        }
      }
    }
  }

  flush() {
    // Process any remaining text without waiting for sentence completion
    if (this.pendingText.trim()) {
      const chunks = this.chunkText(this.pendingText) || [this.pendingText];
      this.chunks.push(...chunks);
      this.pendingText = '';
    }
  }

  close() {
    // Flush any remaining text and close the stream
    this.flush();
    this.closed = true;
  }

  async *[Symbol.asyncIterator]() {
    let processedIndex = 0;
    
    while (!this.closed || processedIndex < this.chunks.length) {
      // Yield any new chunks that have been added
      while (processedIndex < this.chunks.length) {
        yield this.chunks[processedIndex];
        processedIndex++;
      }
      
      // If not closed, wait a bit for more chunks
      if (!this.closed) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }
}

// RawAudio class to handle audio data
export class RawAudio {
  constructor(audio, sampling_rate) {
    this.audio = audio;
    this.sampling_rate = sampling_rate;
  }

  get length() {
    return this.audio.length;
  }

  toBlob() {
    // Convert Float32Array to WAV blob
    const buffer = this.encodeWAV(this.audio, this.sampling_rate);
    return new Blob([buffer], { type: 'audio/wav' });
  }

  encodeWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + samples.length * 2, true);
    // RIFF type
    this.writeString(view, 8, 'WAVE');
    // format chunk identifier
    this.writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    this.writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, samples.length * 2, true);

    this.floatTo16BitPCM(view, 44, samples);

    return buffer;
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }
}

// Kokoro TTS class for local model
export class KokoroTTS {
  constructor(voices, session, voiceEmbeddings, tokenizer) {
    this.voices = voices || [];
    this.session = session;
    this.voiceEmbeddings = voiceEmbeddings || {};
    this.tokenizer = tokenizer;
    this.wasmSession = null; // Fallback WASM session
  }

  static async from_pretrained(model_path, options = {}) {
    try {
      // Import ONNX Runtime Web and caching utility
      const ort = await import('onnxruntime-web');
      const { cachedFetch } = await import('../utils/model-cache.js');
      
      // Use local files in public directory with threading enabled
      ort.env.wasm.wasmPaths = `${import.meta.env.BASE_URL}onnx-runtime/`;

      // Load model and tokenizer
      const [modelResponse, tokenizerResponse] = await Promise.all([
        cachedFetch(model_path),
        cachedFetch(`${import.meta.env.BASE_URL}tts-models/kokoro/tokenizer.json`)
      ]);

      const [modelBuffer, tokenizer] = await Promise.all([
        modelResponse.arrayBuffer(),
        tokenizerResponse.json()
      ]);

      // Try WebGPU with better configuration, fallback to WASM
      let session;
      try {
        if (options.device === 'webgpu') {
          // Try WebGPU with specific settings for better compatibility
          session = await ort.InferenceSession.create(modelBuffer, {
            executionProviders: [
              {
                name: 'webgpu',
                deviceType: 'gpu',
                powerPreference: 'high-performance',
                preferredLayout: 'NCHW',
                // Try to improve precision for better audio quality
                context: {
                  preferredChannelsLast: false,
                  enableDebugLogs: false
                }
              },
              'wasm'  // Keep WASM as fallback
            ],
            // Global session options that might help with precision
            optimizationLevel: 'basic',  // Less aggressive optimization
            enableProfiling: false
          });
        } else {
          throw new Error('Using WASM as requested');
        }
      } catch (webgpuError) {
        // Fallback to WASM with explicit configuration
        session = await ort.InferenceSession.create(modelBuffer, {
          executionProviders: [{
            name: 'wasm',
            simd: true
          }]
        });
      }
      
      // Load voice embeddings from .bin files
      const voiceEmbeddings = {};
      const voiceFiles = [
        'af', 'af_alloy', 'af_aoede', 'af_bella', 'af_heart', 'af_jessica', 'af_kore',
        'af_nicole', 'af_nova', 'af_river', 'af_sarah', 'af_sky',
        'am_adam', 'am_echo', 'am_eric', 'am_fenrir', 'am_liam', 'am_michael',
        'am_onyx', 'am_puck', 'am_santa'
      ];

      // Load voice embeddings in parallel
      const voicePromises = voiceFiles.map(async (voice) => {
        try {
          const voiceResponse = await cachedFetch(`${import.meta.env.BASE_URL}tts-models/kokoro/voices/${voice}.bin`);
          const arrayBuffer = await voiceResponse.arrayBuffer();
          // Convert binary data to Float32Array (assuming 32-bit floats)
          const fullArray = new Float32Array(arrayBuffer);
          
          // Keep the full voice embedding data - we'll slice it based on token count later
          voiceEmbeddings[voice] = fullArray;
        } catch (error) {
          console.warn(`Could not load voice ${voice}:`, error);
        }
      });

      await Promise.allSettled(voicePromises);
      
      // Transform the voice data into the format we need
      const voices = voiceFiles
        .filter(voice => voiceEmbeddings[voice]) // Only include successfully loaded voices
        .map(voice => {
          const prefix = voice.match(/^(af|am)/)?.[1];
          const gender = prefix === 'af' ? 'Female' : 'Male';
          const baseName = voice.replace(/^(af|am)_?/, '');
          
          return {
            id: voice,
            name: baseName 
              ? `${baseName.charAt(0).toUpperCase() + baseName.slice(1)} (${gender})`
              : gender
          };
        });
      
      return new KokoroTTS(voices, session, voiceEmbeddings, tokenizer);
    } catch (error) {
      console.error('Error loading Kokoro model:', error);
      // Fallback to default voices without model
      return new KokoroTTS();
    }
  }

  // Import and use the proper phonemization function
  async phonemize(text, language = "a") {
    try {
      // Import the phonemizer package with proper normalization
      const { phonemize } = await import('phonemizer');
      
      // Normalize text like the reference implementation
      let normalizedText = text
        .replace(/['']/g, "'")
        .replace(/[""]/g, '"')
        .replace(/\(/g, "«")
        .replace(/\)/g, "»")
        .replace(/\betc\.(?! [A-Z])/gi, "etc")
        .trim();
      
      // Use phonemizer with the appropriate language
      const lang = language === "a" ? "en-us" : "en";
      const result = await phonemize(normalizedText, lang);
      
      // Join phoneme arrays if necessary
      const phonemeString = Array.isArray(result) ? result.join(" ") : result;
      
      // Apply post-processing like the reference
      return phonemeString
        .replace(/ʲ/g, "j")
        .replace(/r/g, "ɹ")
        .replace(/x/g, "k")
        .replace(/ɬ/g, "l")
        .trim();
        
    } catch (error) {
      console.error('Phonemization error:', error);
      return text;
    }
  }

  // Use the tokenizer properly like the reference implementation
  async tokenizeText(text, language = "a") {
    if (!this.tokenizer) {
      throw new Error('Tokenizer not loaded');
    }

    // Get phonemes using proper phonemization
    const phonemes = await this.phonemize(text, language);
    
    // Use the tokenizer's encode method (simulated)
    // The tokenizer adds boundary tokens automatically
    const tokens = phonemes.split('').map(char => {
      const vocab = this.tokenizer.model?.vocab || {};
      const tokenId = vocab[char];
      if (tokenId !== undefined) {
        return tokenId;
      }
      // For unknown characters, use the boundary token
      return 0; // $ token
    });
    
    // Add start and end tokens manually to match reference behavior
    return [0, ...tokens, 0];
  }

  async *stream(textStreamer, options = {}) {
    const { voice = "af_heart", speed = 1.0 } = options;
    
    // Process the text stream
    for await (const text of textStreamer) {
      if (text.trim()) {
        try {
          if (this.session && this.voiceEmbeddings[voice]) {
            try {
              const language = voice.startsWith('a') ? 'a' : 'b'; // Determine language from voice ID
              
              // Get phonemes for the text chunk
              const phonemes = await this.phonemize(text, language);
              
              const tokenIds = await this.tokenizeText(text, language);
              const inputIds = new BigInt64Array(tokenIds.map(id => BigInt(id)));
              
              // Select voice style based on number of input tokens (like reference implementation)
              const numTokens = Math.min(Math.max(tokenIds.length - 2, 0), 509);
              const STYLE_DIM = 256;
              const fullVoiceData = this.voiceEmbeddings[voice];
              const offset = numTokens * STYLE_DIM;
              const speakerEmbedding = fullVoiceData.slice(offset, offset + STYLE_DIM);
              const ort = await import('onnxruntime-web');
              
              const inputs = {
                'input_ids': new ort.Tensor('int64', inputIds, [1, inputIds.length]),
                'style': new ort.Tensor('float32', speakerEmbedding, [1, speakerEmbedding.length]),
                'speed': new ort.Tensor('float32', new Float32Array([1.0 / speed]), [1])
              };

              let results = await this.session.run(inputs);
              
              // Extract audio data - assuming output is called 'waveform' or 'output'
              let audioOutput = results.waveform || results.output;
              let audioData = audioOutput.data;
              
              // Check if WebGPU produced NaN values and fallback to WASM
              if (audioData.length > 0 && isNaN(audioData[0])) {
                // Create WASM session if we don't have one
                if (!this.wasmSession) {
                  const ort = await import('onnxruntime-web');
                  this.wasmSession = await ort.InferenceSession.create(modelBuffer, {
                    executionProviders: ['wasm']
                  });
                }
                
                // Retry inference with WASM
                results = await this.wasmSession.run(inputs);
                audioOutput = results.waveform || results.output;
                audioData = audioOutput.data;
              }
              
              // Use the correct sample rate - Kokoro typically outputs 24kHz
              const sampleRate = 24000;
              
              // Don't apply additional speed adjustment since we already handled it in the model input
              let finalAudioData = new Float32Array(audioData);
              
              // Clean up NaN values and normalize
              let hasNaN = false;
              let maxAmplitude = 0;
              for (let i = 0; i < finalAudioData.length; i++) {
                if (isNaN(finalAudioData[i])) {
                  finalAudioData[i] = 0; // Replace NaN with silence
                  hasNaN = true;
                } else {
                  maxAmplitude = Math.max(maxAmplitude, Math.abs(finalAudioData[i]));
                }
              }
              
              // Gentle normalization to prevent "going in and out" effect
              if (maxAmplitude > 0) {
                // Only normalize if the audio is very quiet (< 0.05) or very loud (> 0.95)
                let normalizationFactor = 1.0;
                if (maxAmplitude < 0.05) {
                  normalizationFactor = 0.3 / maxAmplitude; // Boost quiet audio moderately
                } else if (maxAmplitude > 0.95) {
                  normalizationFactor = 0.8 / maxAmplitude; // Reduce loud audio slightly
                }
                
                if (normalizationFactor !== 1.0) {
                  for (let i = 0; i < finalAudioData.length; i++) {
                    finalAudioData[i] *= normalizationFactor;
                  }
                }
              }

              // Yield with phonemes information like the official implementation
              yield {
                text,
                phonemes, // Include phonemes in the output
                audio: new RawAudio(finalAudioData, sampleRate)
              };
            } catch (modelError) {
              console.error('Model inference error:', modelError);
              console.error('Error details:', modelError.message);
            }
          }
        } catch (error) {
          console.error('Error generating audio:', error);
          // Yield silence in case of error
          yield {
            text,
            phonemes: text, // Fallback phonemes
            audio: new RawAudio(new Float32Array(24000), 24000)
          };
        }
      }
    }
  }
}