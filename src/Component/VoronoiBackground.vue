<script setup lang="ts">
// 仿教堂彩绘玻璃的 Voronoi 镶嵌背景：用「抖动网格（jittered grid）」布种，
// 让每个单元格大小基本一致（不会外圈越铺越大、也不会大小悬殊），但形状自然错落。
// 只描边框线（铅条 came），填充用低饱和的柔和色块。
import { Delaunay } from 'd3-delaunay'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { theme } from '@/composables/useTheme'

// 固定种子的伪随机，保证每次刷新图案一致、不抖动
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 抖动网格布种：在规则网格的每个格点附近加随机扰动，得到大小均匀、略有变化的单元格。
// 隔行偏移半个格距，使镶嵌更接近六边形铺排（教堂玻璃的常见形态）。
function makeSeeds(w: number, h: number, rng: () => number): [number, number][] {
  const cell = Math.max(78, Math.min(140, Math.round(Math.min(w, h) / 8.5)))
  const jitter = cell * 0.42
  const pts: [number, number][] = []
  let row = 0
  for (let gy = -cell; gy <= h + cell; gy += cell) {
    const rowOffset = (row % 2) * (cell / 2)
    for (let gx = -cell; gx <= w + cell; gx += cell) {
      const x = gx + rowOffset + (rng() * 2 - 1) * jitter
      const y = gy + (rng() * 2 - 1) * jitter
      pts.push([x, y])
    }
    row++
  }
  return pts
}

interface Cell {
  id: number
  d: string
  fill: string
  op: number
}

const width = ref(window.innerWidth)
const height = ref(window.innerHeight)
const cells = ref<Cell[]>([])
const svgRef = ref<SVGSVGElement>()

// 调色板：分 3×3 色区，模拟彩绘玻璃的色块分区；每格再做轻微明暗抖动
const PALETTE_LIGHT = [222, 244, 266, 198, 168, 32, 350, 282, 210]
const PALETTE_DARK = [222, 248, 268, 190, 160, 36, 344, 286, 205]

function buildCells(isDark: boolean) {
  const w = width.value
  const h = height.value
  const rng = mulberry32(20240920)
  const points = makeSeeds(w, h, rng)

  const delaunay = Delaunay.from(points)
  const voronoi = delaunay.voronoi([0, 0, w, h])
  const palette = isDark ? PALETTE_DARK : PALETTE_LIGHT

  const next: Cell[] = []
  for (let i = 0; i < points.length; i++) {
    const poly = voronoi.cellPolygon(i)
    if (!poly || poly.length < 3) continue

    let sx = 0
    let sy = 0
    for (const p of poly) {
      sx += p[0]
      sy += p[1]
    }
    const cx = sx / poly.length
    const cy = sy / poly.length

    let d = ''
    for (let k = 0; k < poly.length; k++) {
      d += (k === 0 ? 'M' : 'L') + poly[k][0].toFixed(1) + ' ' + poly[k][1].toFixed(1)
    }
    d += ' Z'

    // 颜色随机分布：每个格子从调色板里随机取一个基色（不再按空间分区成片），
    // 再加轻微抖动，整体像教堂玻璃那样散落但协调
    const zone = Math.floor(rng() * palette.length)
    const hue = palette[zone] + (rng() * 2 - 1) * 8
    // 暗色模式提亮 + 提饱和，做成「发光」的宝石色调，避免发灰发闷
    const sat = isDark ? 52 + rng() * 20 : 46 + rng() * 16
    const light = isDark ? 40 + rng() * 15 : 86 + rng() * 8
    const op = isDark ? 0.62 : 0.52

    next.push({ id: i, d, fill: `hsl(${hue.toFixed(1)} ${sat.toFixed(1)}% ${light.toFixed(1)}%)`, op })
  }
  cells.value = next
}

const lead = computed(() => (theme.value === 'dark' ? 'rgba(232,236,244,0.32)' : 'rgba(28,32,45,0.22)'))
const leadWidth = 1.3
// 暗色模式下 vignette 压淡，避免中心被压暗导致图案糊成一团
const vignetteColor = computed(() => (theme.value === 'dark' ? '#15181f' : '#ffffff'))
const vignetteOpacity = computed(() => (theme.value === 'dark' ? 0.35 : 0.82))

function rebuild() {
  buildCells(theme.value === 'dark')
}

let raf = 0
function onResize() {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    width.value = window.innerWidth
    height.value = window.innerHeight
    rebuild()
  })
}

watch(theme, rebuild)
onMounted(() => {
  rebuild()
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <svg
    ref="svgRef"
    class="voronoi-bg"
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="vignette" cx="50%" cy="36%" r="78%">
        <stop offset="0%" :stop-color="vignetteColor" :stop-opacity="vignetteOpacity" />
        <stop offset="100%" :stop-color="vignetteColor" stop-opacity="0" />
      </radialGradient>
    </defs>
    <path
      v-for="c in cells"
      :key="c.id"
      :d="c.d"
      :fill="c.fill"
      :fill-opacity="c.op"
      :stroke="lead"
      :stroke-width="leadWidth"
      stroke-linejoin="round"
    />
    <rect x="0" y="0" width="100%" height="100%" fill="url(#vignette)" />
  </svg>
</template>

<style scoped>
.voronoi-bg {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  pointer-events: none;
  display: block;
}
</style>
