<script setup>
const props = defineProps({
  voices: {
    type: Object,
    required: true
  },
  selectedVoice: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['voiceChange']);

const handleVoiceChange = (event) => {
  emit('voiceChange', event.target.value);
};
</script>

<template>
  <div class="relative">
    <select
      id="voice-selector"
      :value="selectedVoice" 
      @change="handleVoiceChange"
      class="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-8 dark:text-black"
    >
      <option 
        v-for="(voice, key) in voices" 
        :key="key" 
        :value="voice.id"
      >
        {{ voice.name }}
      </option>
    </select>
    <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </div>
  </div>
</template>
