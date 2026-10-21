<template>
  <header class="nav">
    <div class="nav-inner">
      <router-link to="/" class="nav-logo">Seiga</router-link>
      <button ref="mobileToggleRef" type="button" class="nav-theme mobile-toggle" aria-controls="main-navigation" :aria-expanded="mobileOpen" @click="mobileOpen = !mobileOpen">{{ mobileOpen ? '关闭' : '菜单' }}</button>

      <nav id="main-navigation" ref="mobileNavRef" class="nav-links" :class="{ 'is-open': mobileOpen }" aria-label="主导航" @keydown.esc="closeMobile">
        <router-link
          v-for="item in internalLinks"
          :key="item.url"
          :to="item.url"
          class="nav-link"
          :class="{ 'is-active': isActive(item.url) }"
          :aria-current="isActive(item.url) ? 'page' : undefined"
        >
          {{ item.name }}
        </router-link>

        <a
          v-for="link in socialLinks"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="nav-link nav-external"
        >
          {{ link.label }}
          <svg class="nav-ext-icon" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 9L9 3M9 3H4.5M9 3v4.5" fill="none" stroke="currentColor" stroke-width="1.2"
              stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </a>
      </nav>

      <div ref="feedWrapRef" class="feed-wrap" @keydown.esc="closePopover('feed')" @focusout="closeOnBlur($event, 'feed')">
        <button
          type="button"
          class="nav-theme"
          aria-label="RSS 订阅"
          aria-controls="feed-menu"
          :aria-expanded="feedOpen"
          title="RSS 订阅"
          @click="feedOpen = !feedOpen"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M4 4.5a11.5 11.5 0 0 1 11.5 11.5M4 9a7 7 0 0 1 7 7"
              fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            <circle cx="5.2" cy="14.8" r="1.4" fill="currentColor" />
          </svg>
        </button>

        <transition name="fade">
          <div v-if="feedOpen" id="feed-menu" class="feed-pop">
            <div class="feed-pop-title">订阅本站</div>
            <button type="button" class="feed-item" @click="copyFeed">
              <svg v-if="!copied" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="5" y="5" width="8" height="9" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.2" />
                <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-5A1.5 1.5 0 0 0 3 3.5v6A1.5 1.5 0 0 0 4.5 11H5" fill="none" stroke="currentColor" stroke-width="1.2" />
              </svg>
              <svg v-else viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{{ copied ? '已复制' : '复制订阅地址' }}</span>
            </button>
            <a
              v-for="reader in readers"
              :key="reader.name"
              class="feed-item"
              :href="reader.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="feed-dot" :style="{ background: reader.color }"></span>
              <span>通过 {{ reader.name }} 订阅</span>
            </a>
            <a class="feed-item" :href="prodFeedUrl" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M6 3h5.5a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6M8.5 8H3m0 0 2-2m-2 2 2 2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>查看 feed.xml</span>
            </a>
          </div>
        </transition>
      </div>

      <div ref="shareWrapRef" class="feed-wrap" @keydown.esc="closePopover('share')" @focusout="closeOnBlur($event, 'share')">
        <button
          type="button"
          class="nav-theme"
          aria-label="分享本页"
          aria-controls="share-menu"
          :aria-expanded="shareOpen"
          title="分享本页"
          @click="shareOpen = !shareOpen"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="14.5" cy="5" r="2.4" fill="none" stroke="currentColor" stroke-width="1.4" />
            <circle cx="5.5" cy="10" r="2.4" fill="none" stroke="currentColor" stroke-width="1.4" />
            <circle cx="14.5" cy="15" r="2.4" fill="none" stroke="currentColor" stroke-width="1.4" />
            <path d="M7.7 8.8l4.6-2.6M7.7 11.2l4.6 2.6" fill="none" stroke="currentColor" stroke-width="1.4" />
          </svg>
        </button>

        <transition name="fade">
          <div v-if="shareOpen" id="share-menu" class="feed-pop share-pop">
            <div class="feed-pop-title">分享本页</div>
            <div class="share-row">
              <button type="button" class="share-btn" @click="copyPageLink">
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M6.5 9.5a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-.9.9M9.5 6.5a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l.9-.9" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                </svg>
                <span>{{ pageCopied ? '已复制' : '复制链接' }}</span>
              </button>
            </div>
            <a
              v-for="target in shareTargets"
              :key="target.name"
              class="feed-item"
              :href="target.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="feed-dot" :style="{ background: target.color }"></span>
              <span>分享到 {{ target.name }}</span>
            </a>
          </div>
        </transition>
      </div>

      <select v-model="themeMode" class="nav-theme theme-select" aria-label="外观主题" @change="setTheme(themeMode)">
        <option value="system">自动</option>
        <option value="light">浅色</option>
        <option value="dark">深色</option>
      </select>
      <span role="status" aria-live="polite" class="sr-only">{{ copied || pageCopied ? '链接已复制' : '' }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { socialLinks } from '@/content/site'
import { themeMode, setTheme } from '@/composables/useTheme'
import { staticNoteUrl } from '@/utils/noteUrls'
import { siteConfig } from '@/content/siteConfig.mjs'
import { pageTitle } from '@/utils/pageState'

const route = useRoute()
const mobileOpen = ref(false)
const mobileToggleRef = ref<HTMLButtonElement>()
const mobileNavRef = ref<HTMLElement>()
function closeMobile() { mobileOpen.value = false; mobileToggleRef.value?.focus() }
watch(mobileOpen, async open => { if (open) { await nextTick(); mobileNavRef.value?.querySelector<HTMLAnchorElement>('a')?.focus() } })

const internalLinks = [
  { name: '首页', url: '/' },
  { name: '关于', url: '/about' },
  { name: '笔记', url: '/notes' },
  { name: '工具', url: '/tools' },
  { name: '友链', url: '/friends' },
  { name: '项目', url: '/projects' },
]

// 笔记详情页也要高亮"笔记"
const isActive = (url: string) => url === '/'
  ? route.path === '/'
  : route.path === url || route.path.startsWith(`${url}/`)

// 外部阅读器订阅必须用线上地址，本地 localhost 订了也没用
const prodFeedUrl = siteConfig.siteUrl + 'feed.xml'
const readers = [
  // Feedly 官方格式：feed/ 后接未编码的完整地址
  { name: 'Feedly', color: '#2bb24c', url: `https://feedly.com/i/subscription/feed/${prodFeedUrl}` },
  { name: 'Inoreader', color: '#1a8fdd', url: `https://www.inoreader.com/feed/${encodeURIComponent(prodFeedUrl)}` },
  { name: 'Follow', color: '#ff5c00', url: `https://app.follow.is/subscribe/${encodeURIComponent(prodFeedUrl)}` },
]

// 点击复制订阅地址而非跳页：避免把读者带离站点（XML 页无返回导航）
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

async function copyFeed() {
  try {
    await navigator.clipboard.writeText(prodFeedUrl)
  } catch {
    // 剪贴板不可用（如非安全上下文）时退化为选中文本提示
    copied.value = false
    window.prompt('RSS 订阅地址：', prodFeedUrl)
    return
  }
  copied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => (copied.value = false), 1600)
}

// RSS / 分享 弹出面板：点击外部关闭
const feedOpen = ref(false)
const feedWrapRef = ref<HTMLElement>()
const shareOpen = ref(false)
const shareWrapRef = ref<HTMLElement>()
function closePopover(kind: 'feed' | 'share') {
  const wrap = kind === 'feed' ? feedWrapRef : shareWrapRef
  if (kind === 'feed') feedOpen.value = false
  else shareOpen.value = false
  wrap.value?.querySelector<HTMLButtonElement>('button')?.focus()
}
function closeOnBlur(event: FocusEvent, kind: 'feed' | 'share') {
  if ((event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) return
  if (kind === 'feed') feedOpen.value = false
  else shareOpen.value = false
}
watch(feedOpen, async open => {
  if (!open) return
  shareOpen.value = false
  await nextTick(); feedWrapRef.value?.querySelector<HTMLButtonElement>('#feed-menu button')?.focus()
})
watch(shareOpen, async open => {
  if (!open) return
  feedOpen.value = false
  await nextTick(); shareWrapRef.value?.querySelector<HTMLButtonElement>('#share-menu button')?.focus()
})
watch(() => route.fullPath, () => { mobileOpen.value = feedOpen.value = shareOpen.value = false })
function onDocClick(event: MouseEvent) {
  const target = event.target as Node
  if (feedOpen.value && !feedWrapRef.value?.contains(target)) feedOpen.value = false
  if (shareOpen.value && !shareWrapRef.value?.contains(target)) shareOpen.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

// ===== 分享本页 =====
const pageCopied = ref(false)
let pageCopyTimer: ReturnType<typeof setTimeout> | undefined

const pageUrl = () => {
  if (route.name === 'note') {
    const rawPath = route.params.path
    const notePath = Array.isArray(rawPath) ? rawPath.join('/') : rawPath
    if (notePath) return staticNoteUrl(notePath)
  }
  return window.location.href
}

const shareTargets = computed(() => {
  void route.fullPath
  const url = encodeURIComponent(pageUrl())
  const title = encodeURIComponent(pageTitle.value)
  return [
    { name: 'QQ 好友', color: '#12b7f5', url: `https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}` },
    { name: 'QQ 空间', color: '#fece00', url: `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${url}&title=${title}` },
    { name: '微博', color: '#e6162d', url: `https://service.weibo.com/share/share.php?url=${url}&title=${title}` },
    { name: 'X', color: '#1d9bf0', url: `https://twitter.com/intent/tweet?url=${url}&text=${title}` },
  ]
})

async function copyPageLink() {
  try {
    await navigator.clipboard.writeText(pageUrl())
  } catch {
    pageCopied.value = false
    window.prompt('本页链接：', pageUrl())
    return
  }
  pageCopied.value = true
  clearTimeout(pageCopyTimer)
  pageCopyTimer = setTimeout(() => (pageCopied.value = false), 1600)
}
onBeforeUnmount(() => { clearTimeout(copyTimer); clearTimeout(pageCopyTimer) })
</script>

<style scoped lang="scss">
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--c-surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--c-border);
}

.nav-inner {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.nav-theme.mobile-toggle { display: none; width: auto; padding: 0 .5rem; font-size: .8rem; white-space: nowrap; }

.nav-logo {
  font-size: var(--fs-lg);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--c-text);
  flex-shrink: 0;
}

.nav-logo:hover {
  color: var(--c-accent);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.nav-links::-webkit-scrollbar {
  display: none;
}

.nav-link {
  position: relative;
  padding: 0.35rem 0.6rem;
  font-size: var(--fs-sm);
  color: var(--c-text-2);
  white-space: nowrap;
  border-radius: var(--radius-sm);
  transition: color 0.15s ease, background-color 0.15s ease;
}

.nav-link:hover {
  color: var(--c-text);
  background: var(--c-surface-strong);
}

.nav-link.is-active {
  color: var(--c-text);
}

.nav-link.is-active::after {
  content: "";
  position: absolute;
  left: 0.6rem;
  right: 0.6rem;
  bottom: -0.1rem;
  height: 2px;
  background: var(--c-accent);
  border-radius: 2px;
}

.nav-external {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.nav-ext-icon {
  width: 10px;
  height: 10px;
  opacity: 0.6;
}

.nav-theme {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  color: var(--c-text-2);
  background: transparent;
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-theme.theme-select { width: 4.6rem; padding: 0 .25rem; font: inherit; font-size: .8rem; background: var(--c-bg); }

.nav-theme:hover {
  color: var(--c-accent);
  border-color: var(--c-accent-border);
}

.nav-theme svg {
  width: 16px;
  height: 16px;
}

.feed-wrap {
  position: relative;
}

.feed-pop {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 120;
  min-width: 11rem;
  padding: 0.4rem;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md, 0 8px 24px rgba(0, 0, 0, 0.12));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.feed-pop-title {
  padding: 0.3rem 0.5rem 0.45rem;
  font-size: var(--fs-xs);
  color: var(--c-text-3);
  border-bottom: 1px solid var(--c-border);
  margin-bottom: 0.25rem;
}

.feed-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.4rem 0.5rem;
  font-size: var(--fs-sm);
  color: var(--c-text-2);
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.feed-item:hover {
  color: var(--c-text);
  background: var(--c-surface-strong);
}

.feed-item svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.feed-dot {
  width: 8px;
  height: 8px;
  margin: 0 3px;
  flex-shrink: 0;
  border-radius: 50%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.share-pop {
  min-width: 12.5rem;
  padding: 0.5rem;
}

.share-row {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
}

.share-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex: 1;
  padding: 0.4rem 0.55rem;
  font-size: var(--fs-sm);
  color: var(--c-text-2);
  background: var(--c-surface-strong);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.share-btn:hover {
  color: var(--c-accent);
  border-color: var(--c-accent-border);
}

.share-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .nav-theme.mobile-toggle { display: inline-flex; margin-right: auto; }
  .nav-links { display: none; }
  .nav-links.is-open { display: flex; position: absolute; top: 100%; left: 0; right: 0; padding: 1rem; flex-wrap: wrap; background: var(--c-bg); border-bottom: 1px solid var(--c-border); box-shadow: 0 8px 20px rgb(0 0 0 / 12%); }
  .nav-inner {
    padding: 0.6rem 1rem;
    gap: 0.75rem;
  }

  .nav-logo {
    font-size: var(--fs-base);
  }
}
</style>
