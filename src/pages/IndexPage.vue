<template>
  <q-page class="q-pa-md column items-center">
    <!-- Profile chip: entry to the trophy case AND the target the collected
         badge flies into after a puzzle is solved. -->
    <button
      ref="profileRef"
      class="profile-chip"
      :class="{ 'profile-chip--bump': profileBump }"
      type="button"
      @click="goToTrophy"
    >
      <q-icon name="account_circle" size="28px" class="profile-chip__avatar" />
      <div class="profile-chip__meta">
        <span class="profile-chip__name">{{ trophyStore.username }}</span>
        <span class="profile-chip__count">{{ trophyStore.progressLabel }}</span>
      </div>
    </button>

    <div class="glass-title q-mb-sm">Sliding Puzzle</div>

    <p class="glass-subtitle text-center q-mb-md" style="max-width: 35rem">
      Tap a tile next to the gap, or swipe it toward the empty space. Complete the picture as
      fast as you can.
    </p>

    <SlidingPuzzle
      ref="puzzleRef"
      :rows="puzzleStore.preferredGridSize"
      :cols="puzzleStore.preferredGridSize"
      :image-url="puzzleImageUrl"
      :shuffle-moves="250"
      class="full-width"
      style="max-width: min(100%, 35rem)"
      @solved="onPuzzleSolved"
      @new-game="pickRandomImage"
    />

    <!-- Dim backdrop to spotlight the centered token before it flies away -->
    <div v-if="flyToken" class="collect-backdrop" />

    <!-- Collected token: appears centered, then flies to the profile chip -->
    <div
      v-if="flyToken"
      ref="flyRef"
      class="fly-badge"
      :style="flyStyle"
    >
      <span
        class="fly-badge__halo"
        :style="{ background: `radial-gradient(circle, ${flyToken.color}, transparent 68%)` }"
      />
      <div class="fly-badge__medallion" :style="{ background: tokenGradient(flyToken) }">
        <q-icon :name="flyToken.icon" class="fly-badge__icon" />
        <span class="fly-badge__gloss" />
        <span class="fly-badge__shine" />
      </div>

      <div class="fly-badge__text">
        <div class="fly-badge__caption">Token collected!</div>
        <div class="fly-badge__label">{{ flyToken.label }}</div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import SlidingPuzzle from 'components/SlidingPuzzle.vue'
import { usePuzzleStore } from 'stores/puzzle-store'
import { useTrophyStore, tokenGradient } from 'stores/trophy-store'

import puzzleImage from 'assets/mock.svg'
import puzzleImage1 from 'assets/mock1.jpg'
import puzzleImage2 from 'assets/mock2.jpg'
import puzzleImage3 from 'assets/mock3.jpg'
import puzzleImage4 from 'assets/mock4.jpg'

const $q = useQuasar()
const router = useRouter()
const puzzleStore = usePuzzleStore()
const trophyStore = useTrophyStore()

const puzzleRef = ref(null)

// --- Trophy collect animation state ---
const profileRef = ref(null)
const profileBump = ref(false)
const flyRef = ref(null)
const flyToken = ref(null)
const flyStyle = ref({})

function goToTrophy() {
  router.push('/trophy')
}

function nextLockedToken() {
  return trophyStore.tokens.find((t) => !t.unlocked) || null
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function quadPoint(p0, p1, p2, t) {
  const mt = 1 - t
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
  }
}

// Confetti-like burst of glowing shards at a screen position.
function spawnBurst(x, y, color, count = 18) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span')
    p.className = 'collect-particle'
    const size = 5 + Math.random() * 9
    const angle = Math.random() * Math.PI * 2
    const dist = 70 + Math.random() * 110
    const tx = Math.cos(angle) * dist
    const ty = Math.sin(angle) * dist + 55 // a touch of gravity
    p.style.left = `${x}px`
    p.style.top = `${y}px`
    p.style.width = `${size}px`
    p.style.height = `${size}px`
    p.style.background = i % 3 === 0 ? '#ffffff' : color
    p.style.boxShadow = `0 0 8px ${color}`
    document.body.appendChild(p)
    const anim = p.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.15) rotate(${Math.random() * 540 - 270}deg)`,
          opacity: 0
        }
      ],
      {
        duration: 650 + Math.random() * 450,
        easing: 'cubic-bezier(0.15, 0.6, 0.3, 1)',
        fill: 'forwards'
      }
    )
    anim.finished.finally(() => p.remove())
  }
}

// Expanding shockwave ring.
function spawnRing(x, y, color) {
  const ring = document.createElement('span')
  ring.className = 'collect-ring'
  ring.style.left = `${x}px`
  ring.style.top = `${y}px`
  ring.style.borderColor = color
  ring.style.boxShadow = `0 0 20px ${color}`
  document.body.appendChild(ring)
  const anim = ring.animate(
    [
      { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 0.9, borderWidth: '5px' },
      { transform: 'translate(-50%, -50%) scale(2.6)', opacity: 0, borderWidth: '1px' }
    ],
    { duration: 750, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)', fill: 'forwards' }
  )
  anim.finished.finally(() => ring.remove())
}

// How long the token stays centered on screen before flying to the profile.
const CENTER_HOLD_MS = 1150
const FLIGHT_MS = 1000

// Full reward sequence: the sculpture token appears centered on screen with a
// burst, holds for a beat, then glides on a smooth arc into the profile chip in
// the top-right corner, which reacts. Then the token is marked collected.
async function playCollectAnimation(token) {
  await nextTick()

  const endEl = profileRef.value
  if (!endEl) {
    trophyStore.unlockToken(token.id)
    return
  }

  // Start: dead center of the viewport. End: the profile chip, top-right.
  const start = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  const e = endEl.getBoundingClientRect()
  const end = { x: e.left + e.width / 2, y: e.top + e.height / 2 }

  // Respect reduced-motion: skip the spectacle, keep the reward.
  if (prefersReducedMotion()) {
    trophyStore.unlockToken(token.id)
    profileBump.value = true
    setTimeout(() => (profileBump.value = false), 500)
    return
  }

  flyStyle.value = { left: `${start.x}px`, top: `${start.y}px` }
  flyToken.value = token
  await nextTick()

  const el = flyRef.value
  if (!el || typeof el.animate !== 'function') {
    trophyStore.unlockToken(token.id)
    flyToken.value = null
    return
  }

  // Entrance payoff while the medallion pops in centered (CSS drives the pop).
  spawnRing(start.x, start.y, token.color)
  spawnBurst(start.x, start.y, token.color, 22)

  // Curved flight: quadratic bezier with a control point lifted above the line
  // so it sweeps up and over toward the corner rather than moving in a line.
  const dist = Math.hypot(end.x - start.x, end.y - start.y)
  const control = {
    x: (start.x + end.x) / 2 + dist * 0.18,
    y: Math.min(start.y, end.y) - (140 + dist * 0.22)
  }

  const frames = []
  const steps = 18
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const pt = quadPoint(start, control, end, t)
    const dx = pt.x - start.x
    const dy = pt.y - start.y
    // A little anticipation "dip" (scale up) before it shrinks into the chip.
    let scale = 1
    if (t < 0.12) scale = 1 + t * 1.0 // 1 -> ~1.12 charge-up
    else if (t < 0.8) scale = 1.12 - ((t - 0.12) / 0.68) * 0.12 // ease back to 1
    else scale = 1 - ((t - 0.8) / 0.2) * 0.86 // shrink into the chip
    const rot = -22 * t
    const opacity = t < 0.9 ? 1 : 1 - ((t - 0.9) / 0.1) * 0.7
    frames.push({
      transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale}) rotate(${rot}deg)`,
      opacity
    })
  }

  const anim = el.animate(frames, {
    duration: FLIGHT_MS,
    delay: CENTER_HOLD_MS, // hold centered before launching
    easing: 'cubic-bezier(0.5, 0, 0.2, 1)',
    fill: 'both'
  })

  // Sparkle trail dropped along the flight path.
  const trailTimers = []
  for (let k = 1; k <= 6; k++) {
    trailTimers.push(
      setTimeout(() => {
        const t = 0.15 + k * 0.13
        const pt = quadPoint(start, control, end, t)
        spawnBurst(pt.x, pt.y, token.color, 3)
      }, CENTER_HOLD_MS + k * 130)
    )
  }

  await anim.finished.catch(() => {})
  trailTimers.forEach(clearTimeout)

  trophyStore.unlockToken(token.id)
  flyToken.value = null

  // Arrival: shockwave + sparks + chip bump.
  spawnRing(end.x, end.y, '#7b61ff')
  spawnBurst(end.x, end.y, '#7b61ff', 14)
  profileBump.value = true
  setTimeout(() => (profileBump.value = false), 650)
}

const imagesPool = [
  puzzleImage,
  puzzleImage1,
  puzzleImage2,
  puzzleImage3,
  puzzleImage4
]

const puzzleImageUrl = ref('')

function pickRandomImage() {
  if (imagesPool.length === 1) {
    puzzleImageUrl.value = imagesPool[0]
    puzzleStore.setImageUrl(puzzleImageUrl.value)
    return
  }

  let nextUrl = puzzleImageUrl.value
  while (nextUrl === puzzleImageUrl.value) {
    const randomIndex = Math.floor(Math.random() * imagesPool.length)
    nextUrl = imagesPool[randomIndex]
  }

  puzzleImageUrl.value = nextUrl
  puzzleStore.setImageUrl(puzzleImageUrl.value)
}

onMounted(() => {
  pickRandomImage()
})

async function onPuzzleSolved(payload) {
  const token = nextLockedToken()
  if (token) {
    await playCollectAnimation(token)
  }

  const collectedLine = token
    ? `<br /><span style="opacity:0.85">“${token.label}” added to your Trophy Case.</span>`
    : ''

  $q.dialog({
    title: 'Victory!',
    message: `Puzzle solved in <strong>${payload.moveCount}</strong> moves and <strong>${payload.formattedTime}</strong>.${collectedLine}`,
    html: true,
    class: 'glass-dialog',
    ok: {
      label: 'Play Again',
      class: 'glass-btn',
      unelevated: true
    },
    cancel: {
      label: 'Trophy Case',
      class: 'glass-btn glass-btn--cancel',
      flat: true
    },
    persistent: false
  })
    .onOk(() => {
      puzzleRef.value?.startNewGame()
    })
    .onCancel(() => {
      goToTrophy()
    })
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&display=swap');

/* ---------- Profile chip (trophy entry + collect target) ---------- */
.profile-chip {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px 8px 10px;
  border-radius: 999px;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  color: rgba(255, 255, 255, 0.95);

  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, background 0.2s ease;
}

.profile-chip:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.profile-chip__avatar {
  color: rgba(255, 255, 255, 0.85);
}

.profile-chip__meta {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  text-align: left;
}

.profile-chip__name {
  font-size: 0.85rem;
  font-weight: 600;
}

.profile-chip__count {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.75);
}

.profile-chip--bump {
  animation: profile-bump 0.65s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes profile-bump {
  0% { transform: scale(1); }
  35% { transform: scale(1.22) rotate(-3deg); box-shadow: 0 0 26px rgba(122, 97, 255, 0.75); }
  60% { transform: scale(0.94) rotate(2deg); }
  100% { transform: scale(1) rotate(0deg); }
}

/* ---------- Flying badge ---------- */
.fly-badge {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  transform: translate(-50%, -50%);
  will-change: transform, opacity;
}

.fly-badge__halo {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 240px;
  height: 240px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  filter: blur(8px);
  opacity: 0.75;
  animation: halo-pulse 1.1s ease-in-out infinite;
}

.fly-badge__medallion {
  position: relative;
  width: 124px;
  height: 124px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    inset 0 3px 8px rgba(255, 255, 255, 0.45),
    inset 0 -5px 10px rgba(0, 0, 0, 0.4),
    0 8px 26px rgba(0, 0, 0, 0.45);
  animation: medallion-pop 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.fly-badge__icon {
  position: relative;
  z-index: 2;
  font-size: 62px;
  color: rgba(255, 255, 255, 0.98);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45));
}

/* Caption + token name shown under the centered medallion, then faded out. */
.fly-badge__text {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 18px;
  width: max-content;
  max-width: 80vw;
  text-align: center;
  font-family: 'Outfit', sans-serif;
  animation: label-inout 1.15s ease forwards;
}

.fly-badge__caption {
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

.fly-badge__label {
  margin-top: 4px;
  font-size: 1.9rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 3px 14px rgba(0, 0, 0, 0.7);
}

@keyframes label-inout {
  0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
  20% { opacity: 1; transform: translateX(-50%) translateY(0); }
  80% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-6px); }
}

/* Static glossy highlight on the medallion. */
.fly-badge__gloss {
  position: absolute;
  top: -30%;
  left: -10%;
  width: 120%;
  height: 70%;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.55),
    rgba(255, 255, 255, 0) 80%
  );
  border-radius: 50%;
  z-index: 1;
  pointer-events: none;
}

/* Light sweep that races across the medallion. */
.fly-badge__shine {
  position: absolute;
  top: 0;
  left: -60%;
  width: 45%;
  height: 100%;
  background: linear-gradient(
    100deg,
    transparent,
    rgba(255, 255, 255, 0.85),
    transparent
  );
  transform: skewX(-18deg);
  z-index: 3;
  animation: shine-sweep 0.9s ease-in-out 0.25s 2;
}

@keyframes medallion-pop {
  0% { transform: scale(0) rotate(-120deg); }
  55% { transform: scale(1.28) rotate(10deg); }
  75% { transform: scale(0.9) rotate(-4deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes halo-pulse {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.18); }
}

@keyframes shine-sweep {
  0% { left: -60%; }
  100% { left: 130%; }
}

/* ---------- Spotlight backdrop ---------- */
.collect-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9995;
  pointer-events: none;
  background: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 0.35),
    rgba(0, 0, 0, 0.72)
  );
  animation: backdrop-fade 2.15s ease forwards;
}

@keyframes backdrop-fade {
  0% { opacity: 0; }
  15% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; }
}

/* ---------- Particles + shockwave (appended to <body>) ---------- */
.collect-particle {
  position: fixed;
  z-index: 9998;
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  will-change: transform, opacity;
}

.collect-ring {
  position: fixed;
  z-index: 9997;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border-style: solid;
  pointer-events: none;
  transform: translate(-50%, -50%);
  will-change: transform, opacity;
}

.glass-title {
  font-family: 'Outfit', sans-serif;
  font-size: 2.2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  letter-spacing: 0.5px;
}

.glass-subtitle {
  font-family: 'Outfit', sans-serif;
  font-size: 1.8rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  line-height: 1.5;
}

.q-dialog__inner--minimized > .glass-dialog {
  background: rgba(255, 255, 255, 0.12) !important;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35),
              0 0 20px rgba(255, 255, 255, 0.06);
  color: white;
  font-family: 'Outfit', sans-serif;
}

.glass-dialog .q-card__title {
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.glass-dialog .q-card__section {
  font-size: 1.1rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
}

.glass-dialog .q-card__actions {
  justify-content: center !important;
  padding-bottom: 24px;
  width: 100%;
}

.glass-btn {
  font-family: 'Outfit', sans-serif !important;
  font-weight: 500 !important;
  color: white !important;
  background: rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  border-radius: 12px;
  padding: 8px 24px;
  transition: all 0.2s ease;
}

.glass-btn:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  transform: translateY(-2px);
}

.glass-btn--cancel {
  background: transparent !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.7) !important;
}
</style>
