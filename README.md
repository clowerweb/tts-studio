# 🎙️ TTS Studio

A unified web-based interface for **multiple text-to-speech models** - featuring **Kitten TTS**, **Piper TTS**, and **Kokoro TTS** running entirely in your browser! Switch between models seamlessly and choose the perfect voice for your needs.

[Try the web demo!](https://clowerweb.github.io/tts-studio/)

## ✨ Features

### 🔄 **Triple Model Support**
- **😻 Kitten TTS** - Lightweight 24MB model with 8 voice embeddings
- **🃏 Piper TTS** - High-quality 75MB model with 904 different voices  
- **🌸 Kokoro TTS** - Premium 82MB model with 21 expressive voices

### ⚡ **Smart Controls**
- **Model Switcher** - Seamless switching between TTS engines
- **Dynamic Interface** - Controls adapt to each model's capabilities
- **Voice Selection** - From 8 expressive voices (Kitten), 21 premium voices (Kokoro), to 904 diverse voices (Piper)
- **Voice Preview** - Click to instantly hear any voice before selecting it! 🎧
- **Speed Control** - Adjustable speech rate from 0.5x to 2.0x
- **Sample Rate Control** - Multiple quality levels (Kitten & Kokoro)
- **WebGPU Acceleration** - Optional GPU acceleration (Kitten & Kokoro)

### 🌐 **100% Browser-Based**
- No server required - runs completely locally
- Real-time generation using WebAssembly
- Smart model loading - only loads selected model
- Intelligent caching for optimal performance
- One-click voice previews with personalized greetings

## 🚀 Quick Start

### **GHCO/Docker**  
`docker pull ghcr.io/clowerweb/tts-studio:latest`

### **Git/NPM**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/clowerweb/tts-studio
   cd tts-studio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

5. **Choose your model and generate speech!** 🎉

## 📋 Requirements

- Node.js 16+
- Modern browser with WebAssembly support
- ~180MB disk space for all model files

## 🎛️ Model Comparison

| Feature | 😻 Kitten TTS | 🌸 Kokoro TTS | 🃏 Piper TTS |
|---------|----------------|----------------|---------------|
| **Model Size** | ~24MB | ~82MB | ~75MB |
| **Voices** | 8 expressive embeddings | 21 premium voices | 904 diverse speakers |
| **Voice Preview** | ✅ Instant previews | ✅ Instant previews | ✅ Instant previews |
| **Quality** | High quality, fast | Highest quality, natural | Premium quality |
| **Speed** | ~2-3x realtime | ~1-2x realtime | ~3-5x realtime |
| **WebGPU** | ✅ Optional acceleration | ✅ Optional acceleration | ❌ WASM only |
| **Sample Rate** | ✅ 8-48kHz configurable | 24kHz fixed | 22kHz fixed |
| **Best For** | Quick generation, mobile | Natural speech, production | Diverse voices, high-quality |

## 🏗️ How It Works

The TTS Studio provides a unified interface that:

1. **Model Selection** - Choose between Kitten TTS, Kokoro TTS, or Piper TTS
2. **Dynamic Loading** - Only loads the selected model to save bandwidth
3. **Adaptive UI** - Shows relevant controls for each model
4. **Unified Processing** - All models use the same audio pipeline
5. **Smart Caching** - Models are cached locally for faster subsequent loads

## 📦 Technical Details

### Kitten TTS Model
- **Size:** 24MB quantized ONNX model
- **Architecture:** 15M parameter neural TTS
- **Voices:** 8 expression-based embeddings
- **Features:** WebGPU support, configurable sample rates
- **Source:** [KittenML/kitten-tts-nano-0.1](https://huggingface.co/KittenML/kitten-tts-nano-0.1)

### Kokoro TTS Model
- **Size:** 82MB quantized ONNX model
- **Architecture:** StyleTextToSpeech2 neural architecture
- **Voices:** 21 premium voices (American & British English)
- **Features:** WebGPU support, natural speech synthesis, adaptive voice embeddings
- **Source:** [onnx-community/Kokoro-82M-v1.0-ONNX](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX)

### Piper TTS Model
- **Size:** 75MB ONNX model + config
- **Architecture:** Neural TTS with LibriTTS training
- **Voices:** 904 diverse speakers from LibriTTS dataset
- **Features:** High-quality synthesis, voice preview
- **Source:** [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices)

## 🛠️ Technical Stack

- **Frontend:** Vue 3 + Vite + Tailwind CSS
- **ML Runtime:** ONNX Runtime Web (WebGPU + WebAssembly)
- **Phonemization:** phonemizer.js (espeak-ng backend)
- **Audio Processing:** Web Audio API with WAV encoding
- **Text Processing:** Smart text cleaning and chunking
- **Worker Architecture:** Web Workers for non-blocking inference

## 📁 Project Structure

```
├── index.html              # Main HTML entry point
├── src/
│   ├── App.vue             # Main TTS Studio application
│   ├── main.js             # Application entry point
│   ├── components/         # Vue components
│   │   ├── AudioChunk.vue  # Audio playback component
│   │   ├── ModelSwitcher.vue # Model selection interface
│   │   ├── SampleRateSelector.vue
│   │   ├── SpeedControl.vue
│   │   ├── TextStatistics.vue
│   │   ├── ThemeToggle.vue
│   │   ├── VoiceSelector.vue
│   │   └── WebGPUToggle.vue
│   ├── lib/
│   │   ├── kitten-tts.js   # Kitten TTS implementation
│   │   ├── kokoro-tts.js   # Kokoro TTS implementation
│   │   └── piper-tts.js    # Piper TTS implementation
│   ├── utils/
│   │   ├── model-cache.js  # Intelligent model caching
│   │   ├── text-cleaner.js # Advanced text processing
│   │   └── utils.js        # Shared utilities
│   └── workers/
│       └── tts-worker.js   # Unified TTS Web Worker
├── public/
│   ├── onnx-runtime/       # ONNX Runtime WASM files
│   └── tts-models/         # Model files
│       ├── kitten-tts/     # Kitten TTS model files
│       │   ├── model_quantized.onnx
│       │   ├── tokenizer.json
│       │   └── voices.json
│       ├── kokoro/         # Kokoro TTS model files
│       │   ├── model_quantized.onnx
│       │   ├── tokenizer.json
│       │   └── voices/     # 21 voice embedding files
│       └── piper/          # Piper TTS model files
│           ├── en_US-libritts_r-medium.onnx
│           ├── en_US-libritts_r-medium.onnx.json
│           └── voices.json
├── piper/                  # Reference Piper TTS code
├── package.json            # Dependencies and scripts
└── vite.config.js          # Vite configuration
```

## 🎯 Usage Tips

### For Quick Generation:
- Choose **😻 Kitten TTS** for fast, lightweight synthesis
- Great for prototyping, mobile devices, or real-time applications
- Enable WebGPU for even faster generation (if supported)

### For Natural Speech:
- Choose **🌸 Kokoro TTS** for the most natural-sounding voices
- 21 carefully crafted voices with exceptional expressiveness
- Perfect for content creation, audiobooks, and premium applications
- Enable WebGPU for faster generation

### For Voice Variety:
- Choose **🃏 Piper TTS** for maximum voice diversity
- 904 voices provide extensive variety for any project
- Use voice preview to find the perfect speaker

## 🎧 Voice Preview Feature

**Test voices instantly!** Every voice across all models includes an instant preview:

- **🎯 One-Click Preview** - Click the play button next to any voice to hear it immediately
- **🎭 Personalized Greetings** - Each voice introduces itself with a unique message
- **⚡ Zero Setup** - No configuration needed, works with all models
- **🔄 Easy Comparison** - Switch between voices to find your favorite
- **🛑 Smart Controls** - Click again to stop, automatic cleanup when finished

Perfect for finding the ideal voice for your project without any guesswork!

### Performance Optimization:
- Only one model loads at a time to save memory
- Models are cached locally after first download
- Use shorter text chunks for faster streaming
- Voice previews are lightweight and don't interfere with main generation

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs or issues
- Suggest new TTS models to integrate
- Submit pull requests for features
- Improve documentation
- Add more voice options

## 📄 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

- **Kitten TTS** - Apache 2.0 License ([KittenML](https://github.com/KittenML))
- **Piper TTS** - MIT License ([rhasspy/piper](https://github.com/rhasspy/piper))
- **Piper Voices** - MIT License ([rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices))
- **LibriTTS Dataset** - CC-BY 4.0 License (original voice recordings)
- **phonemizer.js** - MIT License (espeak-ng phonemization)

## 🙏 Acknowledgments

- **KittenML Team** for the lightweight and efficient Kitten TTS model
- **ONNX Community** for the outstanding Kokoro TTS model conversion and optimization
- **Rhasspy/Piper Team** for the high-quality Piper TTS model and voice collection
- **LibriTTS Dataset** for the diverse, high-quality voice recordings
- **Microsoft ONNX Runtime** for excellent WebAssembly inference
- **Xenova/transformers.js** for ONNX Runtime Web integration
- **espeak-ng** for robust phonemization support

## 🐛 Troubleshooting

### Model Loading Issues
- **Check browser console** for CORS or network errors  
- **Ensure sufficient space** (~100MB for both models)
- **Try refreshing** to retry model download
- **Use modern browser** (Chrome/Firefox/Safari recommended)

### Audio Playback Problems
- **Check audio permissions** in browser settings
- **Disable audio blockers** or ad blockers interfering
- **Click page first** to enable audio context (browser requirement)
- **Try different browsers** if issues persist

### Performance Issues
- **Close other tabs** to free memory for models
- **Use shorter text** for faster generation
- **Try different models** - Kitten is fastest, Kokoro most natural, Piper most diverse
- **Check device compatibility** - WebGPU requires modern GPU

### Model-Specific Issues
- **Kitten TTS WebGPU not working?** This is experimental - WASM fallback will activate
- **Kokoro TTS slow generation?** Enable WebGPU toggle for significant speedup
- **Kokoro voices not loading?** Wait for all 21 voice embeddings to download
- **Piper voice preview silent?** Wait for model to fully load before previewing
- **Poor audio quality?** Try different voices or adjust speed settings

---

## Roadmap

Awaiting feedback to update!

---

🎤 **Ready to create amazing speech synthesis?** Choose your model and start generating! 

Made with ❤️ combining the best of Kitten TTS, Kokoro TTS, and Piper TTS
