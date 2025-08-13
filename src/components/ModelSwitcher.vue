<template>
  <div class="space-y-3">
    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
      TTS Model:
    </label>
    
    <div class="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <button
        @click="$emit('model-change', 'kitten')"
        :class="{
          'bg-white dark:bg-gray-700 shadow-sm': selectedModel === 'kitten',
          'hover:bg-gray-750': selectedModel !== 'kitten'
        }"
        class="px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
      >
        <div class="flex items-center gap-2">
          <span class="text-lg">😻</span>
          <span>Kitten TTS Nano</span>
        </div>
        <div v-if="selectedModel === 'kitten'" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          24MB • Best for edge devices
        </div>
      </button>
      
      <button
        @click="$emit('model-change', 'piper')"
        :class="{
          'bg-white dark:bg-gray-700 shadow-sm': selectedModel === 'piper',
          'hover:bg-gray-750': selectedModel !== 'piper'
        }"
        class="px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
      >
        <div class="flex items-center gap-2">
          <span class="text-lg">🃏</span>
          <span>Piper Voices</span>
        </div>
        <div v-if="selectedModel === 'piper'" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          75MB • High Quality • Fastest generation
        </div>
      </button>
      
      <button
        @click="$emit('model-change', 'kokoro')"
        :class="{
          'bg-white dark:bg-gray-700 shadow-sm': selectedModel === 'kokoro',
          'hover:bg-gray-750': selectedModel !== 'kokoro'
        }"
        class="px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
      >
        <div class="flex items-center gap-2">
          <span class="text-lg">🌸</span>
          <span>Kokoro</span>
        </div>
        <div v-if="selectedModel === 'kokoro'" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          80MB • Highest Quality • Slow generation
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  selectedModel: {
    type: [String, null],
    required: true,
    validator: value => ['kitten', 'piper', 'kokoro', null].includes(value)
  }
});

defineEmits(['model-change']);
</script>