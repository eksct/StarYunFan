<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import windowPhoto from '@/assets/img/cathedral-window.webp'
import projectedLight from '@/assets/img/cathedral-caustics.webp'

const route = useRoute()
const scene = computed(() => route.name === 'home' ? 'home' : route.name === 'note' ? 'reading' : route.name === 'about' ? 'about' : 'quiet')
const root = ref<HTMLElement>()
const motion = window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
const motionAllowed = ref(motion.matches)
const visible = ref(!document.hidden)
const animated = computed(() => scene.value === 'home' && motionAllowed.value && visible.value)

// The light pattern is extracted from the reference photograph. Only its position moves.
let seed = 20261021
function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
const dust = Array.from({ length: 18 }, (_, id) => ({ id, x: 24 + random() * 47,
  y: 12 + random() * 76, size: .8 + random() * 1.3, delay: -random() * 20, duration: 16 + random() * 12 }))
let frame = 0
let pointerX = 0, pointerY = 0
function move(event: PointerEvent) {
  pointerX = (event.clientX / window.innerWidth - .5) * 5
  pointerY = (event.clientY / window.innerHeight - .5) * 4
  if (frame) return
  frame = requestAnimationFrame(() => {
    root.value?.style.setProperty('--light-x', `${pointerX.toFixed(2)}px`)
    root.value?.style.setProperty('--light-y', `${pointerY.toFixed(2)}px`)
    frame = 0
  })
}
function reset() {
  cancelAnimationFrame(frame); frame = 0
  root.value?.style.setProperty('--light-x', '0px')
  root.value?.style.setProperty('--light-y', '0px')
}
function motionChange() { motionAllowed.value = motion.matches }
function visibilityChange() { visible.value = !document.hidden }
function detachPointer() {
  window.removeEventListener('pointermove', move)
  document.documentElement.removeEventListener('pointerleave', reset)
  reset()
}
watch(animated, enabled => {
  detachPointer()
  if (enabled) {
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', reset)
  }
}, { immediate: true })
onMounted(() => {
  motion.addEventListener('change', motionChange)
  document.addEventListener('visibilitychange', visibilityChange)
})
onBeforeUnmount(() => {
  detachPointer()
  motion.removeEventListener('change', motionChange)
  document.removeEventListener('visibilitychange', visibilityChange)
})
</script>

<template>
  <div ref="root" class="glass-scene" :class="[`scene-${scene}`, { 'is-animated': animated }]" aria-hidden="true">
    <div class="stone-ambient"></div>
    <svg class="stone-texture" width="100%" height="100%" focusable="false">
      <defs>
        <filter id="decor:stone-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".4" numOctaves="2" seed="12" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <pattern id="decor:stone-joints" width="320" height="132" patternUnits="userSpaceOnUse" patternTransform="skewY(-7)">
          <path d="M0 0H320M0 66H320M160 0V66M0 66V132M320 66V132" fill="none" stroke="currentColor" stroke-width="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#decor:stone-joints)" opacity=".4" />
      <rect width="100%" height="100%" filter="url(#decor:stone-grain)" opacity=".18" />
    </svg>
    <img class="cathedral-photo" :src="windowPhoto" width="427" height="640" alt="" decoding="async" fetchpriority="low" />
    <div class="light-projection">
      <img :src="projectedLight" width="235" height="455" alt="" decoding="async" fetchpriority="low" />
    </div>
    <div class="scene-shade"></div>
    <div v-if="animated" class="light-dust">
      <span v-for="mote in dust" :key="mote.id" :style="{ left: `${mote.x}%`, top: `${mote.y}%`,
        width: `${mote.size}px`, height: `${mote.size}px`, animationDelay: `${mote.delay}s`, animationDuration: `${mote.duration}s` }"></span>
    </div>
  </div>
</template>

<style scoped>
.glass-scene {
  --strength: .18;
  --photo-opacity: .23;
  --projection-opacity: .3;
  --room-color: #dfe0e9;
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  contain: paint;
}
.scene-home { --strength: 1; }
.scene-about { --strength: .32; }
.scene-reading { --strength: .11; }
:global(:root[data-theme="dark"] .glass-scene) {
  --photo-opacity: .92;
  --projection-opacity: .4;
  --room-color: #1b1929;
}
.stone-ambient, .stone-texture, .scene-shade { position: absolute; inset: 0; }
.stone-ambient { background: radial-gradient(ellipse at 64% 36%, var(--room-color), transparent 80%); opacity: var(--strength); }
.stone-texture { color: var(--c-text-3); opacity: calc(var(--strength) * .15); mask-image: linear-gradient(90deg, #000, transparent 78%); }
.cathedral-photo {
  position: absolute;
  top: 0;
  right: 0;
  width: min(62vw, 840px);
  height: 100%;
  max-width: none;
  object-fit: cover;
  object-position: right top;
  opacity: calc(var(--strength) * var(--photo-opacity));
  mask-image: linear-gradient(90deg, transparent, #000 32%);
  filter: contrast(1.12) saturate(1.12);
}
.light-projection {
  position: absolute;
  width: clamp(560px, 61vw, 980px);
  height: 115vh;
  left: 13vw;
  top: -11vh;
  opacity: calc(var(--strength) * var(--projection-opacity));
  transform: translate(var(--light-x, 0px), var(--light-y, 0px)) rotate(-12deg) skewY(-7deg);
  filter: blur(2.5px);
  mix-blend-mode: multiply;
}
.light-projection img { width: 100%; height: 100%; object-fit: fill; }
:global(:root[data-theme="dark"] .light-projection) { mix-blend-mode: screen; }
.scene-shade {
  background: linear-gradient(90deg, var(--c-bg) 0%, color-mix(in srgb, var(--c-bg) 88%, transparent) 20%, color-mix(in srgb, var(--c-bg) 56%, transparent) 47%, transparent 79%),
    linear-gradient(0deg, var(--c-bg) 0%, transparent 40%);
  opacity: .85;
}
.light-dust { position: absolute; inset: 0; opacity: .35; }
.light-dust span { position: absolute; border-radius: 50%; background: #ece8ff; box-shadow: 0 0 4px #e7d9ff80; animation: float-in-light 20s linear infinite; }
@keyframes float-in-light {
  0% { opacity: 0; transform: translate(0, 12px); }
  22%, 68% { opacity: .6; }
  100% { opacity: 0; transform: translate(-14px, -32px); }
}
@media (max-width: 900px) {
  .scene-home { --strength: .5; }
  .scene-about { --strength: .17; }
  .scene-reading { --strength: .055; }
  .cathedral-photo { right: -25vw; width: 115vw; object-position: right top; mask-image: linear-gradient(90deg, transparent, #000 60%); }
  .light-projection { left: -36vw; top: 3vh; width: 115vw; height: 90vh; }
  .stone-texture { display: none; }
  .scene-shade { background: linear-gradient(90deg, var(--c-bg), transparent 150%), linear-gradient(0deg, var(--c-bg), transparent 85%); opacity: .85; }
}
@media (prefers-reduced-motion: reduce) {
  .light-projection { transform: rotate(-12deg) skewY(-7deg); }
  .light-dust { display: none; }
}
@media print { .glass-scene { display: none; } }
</style>
