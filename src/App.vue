<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  DownloadIcon,
  PauseIcon,
  PlayIcon,
  CopyIcon,
  CheckIcon,
  GithubIcon,
  ExternalLinkIcon,
  Heart
} from 'lucide-vue-next';
import TextStatistics from './components/TextStatistics.vue';
import VoiceSelector from './components/VoiceSelector.vue';
import SpeedControl from './components/SpeedControl.vue';
import SampleRateSelector from './components/SampleRateSelector.vue';
import ThemeToggle from './components/ThemeToggle.vue';
import WebGPUToggle from './components/WebGPUToggle.vue';
import AudioChunk from './components/AudioChunk.vue';
import ModelSwitcher from './components/ModelSwitcher.vue';

// State variables
const text = ref(
    "Hello there! Welcome to the TTS Studio! Choose your preferred TTS model and start generating high-quality speech from text, all running locally in your browser!"
);
const selectedModel = ref(null);
const lastGeneration = ref(null);
const isPlaying = ref(false);
const currentChunkIndex = ref(-1);
const speed = ref(1);
const copied = ref(false);
const status = ref("waiting");
const error = ref(null);
const worker = ref(null);
const voices = ref(null);
const selectedVoice = ref("expr-voice-2-m");
const selectedSampleRate = ref(24000);
const useWebGPU = ref(false);
const actualDevice = ref("wasm");
const chunks = ref([]);
const result = ref(null);

// Computed properties
const processed = computed(() => {
  return lastGeneration.value &&
      lastGeneration.value.text === text.value &&
      lastGeneration.value.speed === speed.value &&
      lastGeneration.value.voice === selectedVoice.value &&
      (selectedModel.value === 'kitten' ? lastGeneration.value.sampleRate === selectedSampleRate.value : true) &&
      lastGeneration.value.model === selectedModel.value;
});

// Methods
const setSelectedVoice = (voice) => {
  selectedVoice.value = voice;
};

const setSpeed = (newSpeed) => {
  speed.value = newSpeed;
};

const setSampleRate = (sampleRate) => {
  selectedSampleRate.value = sampleRate;
};

const handleModelChange = (model) => {
  if (selectedModel.value === model) return;
  
  selectedModel.value = model;
  
  // Reset voice selection and sample rate based on model
  if (model === 'kitten') {
    selectedVoice.value = "expr-voice-2-m";
    selectedSampleRate.value = 24000;
  } else if (model === 'piper') {
    selectedVoice.value = "0"; // Convert to string
    selectedSampleRate.value = null; // Will be set by model config
  } else if (model === 'kokoro') {
    selectedVoice.value = "af_heart";
    selectedSampleRate.value = 24000;
  }
  
  // Restart worker with new model
  restartWorker();
};

const handleWebGPUToggle = (enabled) => {
  // Only restart if the value actually changed and it's different from current device
  if (enabled !== (actualDevice.value === "webgpu")) {
    // Restart the worker with new device preference
    restartWorker(enabled);
  }
};

const restartWorker = (webGPUPreference = false) => {
  if (worker.value) {
    worker.value.terminate();
  }
  
  // Don't start worker if no model is selected
  if (!selectedModel.value) {
    status.value = "waiting";
    return;
  }
  
  // Reset all audio and UI state
  status.value = "loading";
  voices.value = null;
  chunks.value = [];
  result.value = null;
  lastGeneration.value = null; // Reset so button shows "Generate"
  isPlaying.value = false;
  currentChunkIndex.value = -1;
  
  worker.value = new Worker(new URL("./workers/tts-worker.js", import.meta.url), {
    type: "module",
  });
  
  worker.value.addEventListener("message", onMessageReceived);
  worker.value.addEventListener("error", onErrorReceived);
  
  // Send init message with model type and device preference
  worker.value.postMessage({ 
    type: 'init', 
    model: selectedModel.value,
    useWebGPU: webGPUPreference 
  });
};

const setCurrentChunkIndex = (index) => {
  currentChunkIndex.value = index;
};

const setIsPlaying = (playing) => {
  isPlaying.value = playing;
};

const handleChunkEnd = () => {
  if (status.value !== "generating" && currentChunkIndex.value === chunks.value.length - 1) {
    isPlaying.value = false;
    currentChunkIndex.value = -1;
  } else {
    currentChunkIndex.value = currentChunkIndex.value + 1;
  }
};

const handlePlayPause = () => {
  if (!isPlaying.value && status.value === "ready" && !processed.value) {
    status.value = "generating";
    chunks.value = [];
    currentChunkIndex.value = 0;
    const params = { 
      text: text.value, 
      voice: selectedModel.value === 'piper' ? parseInt(selectedVoice.value) : selectedVoice.value,
      speed: speed.value,
      model: selectedModel.value
    };
    
    // Add sample rate for Kitten model
    if (selectedModel.value === 'kitten') {
      params.sampleRate = selectedSampleRate.value;
    }
    
    lastGeneration.value = params;
    worker.value?.postMessage(params);
  }
  if (currentChunkIndex.value === -1) {
    currentChunkIndex.value = 0;
  }
  isPlaying.value = !isPlaying.value;
};

const downloadAudio = () => {
  if (!result.value) return;
  const url = URL.createObjectURL(result.value);
  const link = document.createElement("a");
  link.href = url;
  link.download = "audio.wav";
  link.click();
  URL.revokeObjectURL(url);
}

const handleCopy = async () => {
  await navigator.clipboard.writeText(text.value);
  copied.value = true;
  setTimeout(() => { copied.value = false }, 2000);
}

// Worker message handlers
const onMessageReceived = ({ data }) => {
  switch (data.status) {
    case "device":
      actualDevice.value = data.device;
      // Update checkbox to reflect actual device
      useWebGPU.value = data.device === "webgpu";
      break;
    case "ready":
      status.value = "ready";
      voices.value = data.voices;
      actualDevice.value = data.device;
      // Update checkbox to reflect actual device
      useWebGPU.value = data.device === "webgpu";
      break;
    case "error":
      status.value = "error";
      error.value = data.data;
      break;
    case "stream":
      chunks.value = [...chunks.value, data.chunk];
      break;
    case "complete":
      status.value = "ready";
      result.value = data.audio;
      break;
  }
};

const onErrorReceived = (e) => {
  console.error("Worker error:", e);
  error.value = e.message;
};

// Worker setup
onMounted(() => {
  // Don't automatically start worker - wait for model selection
  status.value = "waiting";
});

// Cleanup
onUnmounted(() => {
  if (worker.value) {
    worker.value.terminate();
  }
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 transition-colors duration-300">
    <!-- Header -->
    <header class="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="text-3xl">🎙️</div>
          <div>
            <h1 class="text-xl font-bold bg-gradient-to-r text-blue-800 dark:text-blue-500">
              TTS Studio
            </h1>
            <p class="text-sm text-muted-foreground hidden sm:block">Local text-to-speech in your browser</p>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <a
              href="https://github.com/sponsors/clowerweb"
              target="_blank"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-pink-100 hover:bg-pink-200 dark:bg-pink-900/30 dark:hover:bg-pink-900/50 text-pink-700 dark:text-pink-300 transition-colors"
              title="Support this project"
          >
            <Heart class="w-4 h-4" />
            <span class="hidden sm:inline">Sponsor</span>
          </a>
          <a 
            href="https://github.com/clowerweb/tts-studio"
            target="_blank"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <GithubIcon class="w-4 h-4" />
            <span class="hidden sm:inline">GitHub</span>
            <ExternalLinkIcon class="w-3 h-3" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 pt-8 pb-4 max-w-4xl">
      <!-- Main Card -->
      <div class="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
        <div class="p-6 pb-0 space-y-6">
          <!-- Text Input Section -->
          <div class="space-y-4">
            <div class="relative">
              <textarea
                v-model="text"
                placeholder="Type or paste your text here..."
                class="w-full min-h-[180px] text-lg leading-relaxed resize-y p-4 pt-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-0 transition-colors"
                :class="voices ? '' : 'text-muted-foreground'"
              ></textarea>
              <button
                class="absolute top-1 right-3 h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                @click="handleCopy"
                :title="copied ? 'Copied!' : 'Copy text'"
              >
                <CheckIcon v-if="copied" class="h-4 w-4 text-green-500" />
                <CopyIcon v-else class="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div class="flex justify-end">
              <TextStatistics :text="text" />
            </div>
          </div>

          <!-- Model Selection Section -->
          <ModelSwitcher 
            :selected-model="selectedModel" 
            @model-change="handleModelChange"
          />

          <!-- Controls Section -->
          <div v-if="voices" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Voice Selection -->
              <div class="flex items-center">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                  Voice:
                </label>
                <VoiceSelector
                  :voices="voices"
                  :selected-voice="selectedVoice"
                  @voice-change="setSelectedVoice"
                />
              </div>

              <!-- Speed Control -->
              <div class="flex items-center">
                <SpeedControl
                  :speed="speed"
                  @speed-change="setSpeed"
                />
              </div>

              <!-- Sample Rate (Kitten only) -->
              <div v-if="selectedModel === 'kitten'" class="flex items-center">
                <SampleRateSelector
                  @sample-rate-change="setSampleRate"
                />
              </div>
            </div>

            <!-- WebGPU Toggle (Kitten & Kokoro) -->
            <WebGPUToggle v-if="selectedModel === 'kitten' || selectedModel === 'kokoro'" v-model="useWebGPU" @update:modelValue="handleWebGPUToggle" />
          </div>

          <div v-else-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {{ error }}
          </div>
          <div v-else-if="status === 'waiting'" class="flex items-center gap-2 text-muted-foreground">
            <span>👆 Please select a TTS model to get started</span>
          </div>
          <div v-else class="flex items-center gap-2 text-muted-foreground">
            <div class="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            <span>Loading {{ selectedModel }} model...</span>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              class="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="{
                'bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 shadow-lg shadow-orange-500/25': isPlaying,
                'bg-blue-800 shadow-lg': !isPlaying
              }"
              @click="handlePlayPause"
              :disabled="(status === 'ready' && !isPlaying && !text) || (status !== 'ready' && chunks.length === 0)"
            >
              <PauseIcon v-if="isPlaying" class="w-5 h-5" />
              <PlayIcon v-else class="w-5 h-5" />
              <span v-if="isPlaying">Pause</span>
              <span v-else>{{ processed || status === 'generating' ? 'Play' : 'Generate' }}</span>
            </button>

            <button
              class="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="downloadAudio"
              :disabled="!result || status !== 'ready'"
            >
              <DownloadIcon class="w-4 h-4" />
              Download Audio
            </button>
          </div>

          <!-- Hidden Audio Chunks -->
          <div class="w-0 h-0 hidden">
            <AudioChunk
              v-if="chunks.length > 0"
              v-for="(chunk, index) in chunks"
              :key="index"
              :audio="chunk.audio"
              :active="currentChunkIndex === index"
              :playing="isPlaying"
              class="hidden"
              @start="() => setCurrentChunkIndex(index)"
              @pause="() => { if (currentChunkIndex === index) setIsPlaying(false) }"
              @end="handleChunkEnd"
            />
          </div>
        </div>
      </div>

      <div class="max-w-4xl mx-auto px-4 py-4 mt-6 text-center">
        <p>
          Like one of these models? See my standalone
          <a
            href="https://clowerweb.github.io/kitten-tts-web-demo/"
            target="_blank"
            class="text-blue-500 hover:text-orange-700 transition-all duration-300"
          >Kitten TTS</a> and
          <a
            href="https://clowerweb.github.io/piper-tts-web-demo/"
            target="_blank"
            class="text-blue-500 hover:text-orange-700 transition-all duration-300"
          >Piper TTS</a>
          web demos!
        </p>
      </div>
    </main>
  </div>
</template>
