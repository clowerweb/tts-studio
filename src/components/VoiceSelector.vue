<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { PlayIcon, SquareIcon } from 'lucide-vue-next';

const props = defineProps({
  voices: {
    type: Object,
    required: true
  },
  selectedVoice: {
    type: [String, Number],
    required: true
  },
  modelType: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['voiceChange', 'voicePreview']);

const isExpanded = ref(false);
const previewingVoice = ref(null);

const handleVoiceChange = (voiceId) => {
  emit('voiceChange', voiceId);
  isExpanded.value = false;
};

const handlePreview = async (voiceId, voiceName) => {
  if (previewingVoice.value === voiceId) {
    // Stop preview
    previewingVoice.value = null;
    emit('voicePreview', { voice: voiceId, action: 'stop' });
  } else {
    // Stop any existing preview first
    if (previewingVoice.value) {
      emit('voicePreview', { voice: previewingVoice.value, action: 'stop' });
    }
    
    // Start new preview
    previewingVoice.value = voiceId;
    const previewText = getPreviewText(voiceName);
    emit('voicePreview', { voice: voiceId, text: previewText, action: 'play' });
    
    // Auto-reset after a reasonable time if no explicit stop
    setTimeout(() => {
      if (previewingVoice.value === voiceId) {
        previewingVoice.value = null;
      }
    }, 10000); // 10 seconds max
  }
};

const getPreviewText = (voiceName) => {
  // Use different preview texts based on voice characteristics
  const name = voiceName.toLowerCase();
  if (name.includes('heart')) return "Hello! I'm Heart, your friendly voice assistant.";
  if (name.includes('bella')) return "Hi there! I'm Bella, ready to bring your words to life.";
  if (name.includes('nova')) return "Greetings! I'm Nova, here to make your content shine.";
  if (name.includes('sarah')) return "Hello! I'm Sarah, delighted to speak for you.";
  if (name.includes('adam')) return "Hi! I'm Adam, your reliable voice companion.";
  if (name.includes('echo')) return "Hello there! I'm Echo, echoing your thoughts perfectly.";
  
  // Default preview text
  return `Hi! I'm ${voiceName.replace(/\s*\(.*?\)\s*/g, '')}, nice to meet you!`;
};

const getSelectedVoice = () => {
  return Object.values(props.voices).find(voice => voice.id == props.selectedVoice);
};

const handlePreviewEnded = () => {
  previewingVoice.value = null;
};

onMounted(() => {
  document.addEventListener('voicePreviewEnded', handlePreviewEnded);
});

onUnmounted(() => {
  document.removeEventListener('voicePreviewEnded', handlePreviewEnded);
});
</script>

<template>
  <div class="relative w-full">
    <!-- Selected voice display -->
    <button
      @click="isExpanded = !isExpanded"
      class="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between dark:bg-gray-800 dark:border-gray-600 dark:text-white"
    >
      <span>{{ getSelectedVoice()?.name || 'Select Voice' }}</span>
      <svg 
        class="w-4 h-4 text-gray-500 transition-transform duration-200" 
        :class="{ 'rotate-180': isExpanded }"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <!-- Dropdown options -->
    <div 
      v-if="isExpanded"
      class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto dark:bg-gray-800 dark:border-gray-600"
    >
      <div
        v-for="(voice, key) in voices"
        :key="key"
        class="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 min-w-0"
        :class="{ 'bg-blue-50 dark:bg-blue-900/30': voice.id == selectedVoice }"
      >
        <!-- Voice name button -->
        <button
          @click="handleVoiceChange(voice.id)"
          class="flex-1 p-2 text-left focus:outline-none dark:text-white min-w-0 truncate"
        >
          {{ voice.name }}
        </button>
        
        <!-- Preview button -->
        <button
          @click.stop="handlePreview(voice.id, voice.name)"
          class="flex-shrink-0 p-2 m-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          :class="{ 
            'text-blue-600 dark:text-blue-400': previewingVoice === voice.id,
            'text-gray-500 dark:text-gray-400': previewingVoice !== voice.id
          }"
          :title="previewingVoice === voice.id ? 'Stop preview' : 'Preview voice'"
        >
          <SquareIcon v-if="previewingVoice === voice.id" class="w-4 h-4" />
          <PlayIcon v-else class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Click outside to close -->
    <div 
      v-if="isExpanded"
      @click="isExpanded = false"
      class="fixed inset-0 z-40"
    ></div>
  </div>
</template>
