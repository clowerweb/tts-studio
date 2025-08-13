<script setup>
import { ref, onMounted } from 'vue'
import { detectWebGPU } from '../utils/utils.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const webGPUSupported = ref(false)

onMounted(async () => {
  webGPUSupported.value = await detectWebGPU()
})

const onToggle = (event) => {
  emit('update:modelValue', event.target.checked)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <input
      id="webgpu-toggle"
      type="checkbox"
      :checked="modelValue"
      :disabled="!webGPUSupported"
      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
      @change="onToggle"
    />
    <label
      for="webgpu-toggle"
      class="text-sm font-medium text-gray-900 dark:text-gray-300"
      :class="{ 'opacity-50': !webGPUSupported }"
    >
      Try WebGPU (experimental)
      <span v-if="!webGPUSupported" class="text-xs text-gray-500 dark:text-gray-400">
        (not supported)
      </span>
    </label>
  </div>
</template>
