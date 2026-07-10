<template>
  <q-page class="trophy-page q-pa-md">
    <!-- Header: back button, title, profile, progress -->
    <header class="trophy-header">
      <div class="trophy-header__top">
        <q-btn
          round
          flat
          class="trophy-back glass-round-btn"
          icon="arrow_back"
          aria-label="Back"
          @click="goBack"
        />
        <h1 class="trophy-title">Trophy Case</h1>

        <div class="profile-chip profile-chip--static profile-chip--in-grid" aria-label="Profile">
          <q-icon name="account_circle" size="28px" class="profile-chip__avatar" />
          <div class="profile-chip__meta">
            <span class="profile-chip__name">{{ trophyStore.username }}</span>
          </div>
        </div>
      </div>

      <div class="trophy-progress">
        <div class="trophy-progress__meta">
          <span class="trophy-progress__count">{{ trophyStore.progressLabel }} collected</span>
          <span class="trophy-progress__percent">{{ trophyStore.progressPercent }}%</span>
        </div>
        <div class="trophy-progress__bar">
          <div
            class="trophy-progress__fill"
            :style="{ width: trophyStore.progressPercent + '%' }"
          />
        </div>
      </div>
    </header>

    <div class="trophy-section-label">Challenge Tokens</div>

    <!-- Adaptive grid of tokens -->
    <div class="trophy-grid">
      <button
        v-for="token in trophyStore.tokens"
        :key="token.id"
        class="trophy-card"
        :class="{ 'trophy-card--locked': !token.unlocked }"
        type="button"
        @click="onTokenClick(token)"
      >
        <div class="trophy-badge" :style="badgeStyle(token)">
          <q-icon :name="token.icon" class="trophy-badge__icon" />
          <q-icon
            v-if="!token.unlocked"
            name="lock"
            class="trophy-badge__lock"
          />
        </div>
        <div class="trophy-card__label">{{ token.label }}</div>
      </button>
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useTrophyStore, tokenGradient } from 'stores/trophy-store'

const router = useRouter()
const trophyStore = useTrophyStore()

function badgeStyle(token) {
  // Unlocked tokens get their color; locked ones stay neutral and get
  // desaturated by the .trophy-card--locked CSS rule.
  return { background: tokenGradient(token) }
}

function onTokenClick(token) {
  // Placeholder interaction. Later this can open token details or start
  // the mini-game for that sculpture. For now it just toggles the state so
  // the two visual states are easy to demo.
  trophyStore.toggleToken(token.id)
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<style scoped>
.trophy-page {
  max-width: 900px;
  margin: 0 auto;
  color: rgba(255, 255, 255, 0.95);
}

/* ---------- Header ---------- */
.trophy-header {
  margin-bottom: 16px;
}

.trophy-header__top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}

.trophy-page :deep(.profile-chip--in-grid) {
  position: static;
  top: auto;
  right: auto;
  flex-shrink: 0;
  margin-left: auto;
}

.trophy-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin: 0;
  text-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  flex: 1 1 auto;
}

.glass-round-btn {
  color: rgba(255, 255, 255, 0.9) !important;
  background: rgba(255, 255, 255, 0.12) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.trophy-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: 'Outfit', sans-serif;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.trophy-progress__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
  font-weight: 500;
}

.trophy-progress__count {
  color: rgba(255, 255, 255, 0.85);
}

.trophy-progress__bar {
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.trophy-progress__fill {
  height: 100%;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  transition: width 0.4s ease;
}

.trophy-progress__percent {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}

/* ---------- Section ---------- */
.trophy-section-label {
  font-family: 'Outfit', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.75);
  margin: 20px 4px 16px;
}

/* ---------- Grid ---------- */
.trophy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
}

.trophy-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 18px 10px 14px;
  border-radius: 16px;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;

  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.trophy-card:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.14);
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.25);
}

.trophy-badge {
  position: relative;
  width: 82px;
  height: 82px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset 0 2px 6px rgba(255, 255, 255, 0.35),
    inset 0 -4px 8px rgba(0, 0, 0, 0.35),
    0 4px 10px rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.18);
}

.trophy-badge__icon {
  font-size: 40px;
  color: rgba(255, 255, 255, 0.95);
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.4));
}

.trophy-badge__lock {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 22px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.55);
  border-radius: 50%;
  padding: 2px;
}

.trophy-card__label {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.2;
}

/* ---------- Locked state ---------- */
/* Requested behaviour: uncollected badges are shown desaturated + dimmed.
   No separate grayscale images needed — the filter handles it. */
.trophy-card--locked .trophy-badge {
  filter: grayscale(100%);
  opacity: 0.5;
}

.trophy-card--locked .trophy-card__label {
  color: rgba(255, 255, 255, 0.45);
}

@media (max-width: 520px) {
  .trophy-header__top {
    flex-wrap: wrap;
  }

  .trophy-title {
    flex: 1 1 auto;
    min-width: 0;
  }

  .trophy-page :deep(.profile-chip--in-grid) {
    margin-left: 0;
  }

  .trophy-progress {
    flex: 1 1 100%;
  }

  .trophy-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  }
}
</style>
