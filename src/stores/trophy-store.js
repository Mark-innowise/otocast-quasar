import { defineStore, acceptHMRUpdate } from 'pinia'
import { loadJson, saveJson } from '../utils/persistence'

const TROPHY_STORAGE_KEY = 'trophy-case'
// "Sculpture Walk" scavenger hunt: 13 real sculptures + the walk logo (#14)
// + a placeholder (#15). Each token is unlocked once the player completes the
// mini-game for that sculpture. Swap `icon`/`color` for real token artwork
// when the designer delivers assets.
const TROPHY_TOKENS = [
  { id: 'moose-on-the-loose', label: 'Moose on the Loose', icon: 'forest', color: '#b5762f', unlocked: true },
  { id: 'red', label: 'Red', icon: 'directions_run', color: '#d64545', unlocked: true },
  { id: 'sisu', label: 'Sisu', icon: 'park', color: '#4a9d6b', unlocked: true },
  { id: 'cube-farmer', label: 'Cube Farmer', icon: 'agriculture', color: '#9c6b3f', unlocked: true },
  { id: 'extra-space', label: 'Extra Space', icon: 'cloud', color: '#3f8fd6', unlocked: true },
  { id: 'sculpture-walk', label: 'Sculpture Walk', icon: 'account_balance', color: '#e0e0e0', unlocked: false },
  { id: 'undeciduous', label: 'Undeciduous', icon: 'nature', color: '#5aa469', unlocked: false },
  { id: 'aloft', label: 'Aloft', icon: 'dark_mode', color: '#2c2c34', unlocked: false },
  { id: 'the-proposal', label: 'The Proposal', icon: 'pets', color: '#c98a3f', unlocked: false },
  { id: 'pollinator', label: 'Pollinator', icon: 'emoji_nature', color: '#e6c93f', unlocked: false },
  { id: 'morons-monument', label: "Moron's Monument", icon: 'emoji_objects', color: '#8a8f99', unlocked: false },
  { id: 'running-girl', label: 'Running Girl', icon: 'directions_walk', color: '#b0b6bf', unlocked: false },
  { id: 'parent-and-child', label: 'Parent and Child', icon: 'family_restroom', color: '#7d838c', unlocked: false },
  { id: 'monkeying-around', label: 'Monkeying Around', icon: 'cruelty_free', color: '#c0392b', unlocked: false },
  { id: 'in-the-mist', label: 'In the Mist', icon: 'filter_drama', color: '#9aa0a8', unlocked: false }
]

function createDefaultTokens() {
  return TROPHY_TOKENS.map((token) => ({ ...token }))
}

function loadTrophyState() {
  const saved = loadJson(TROPHY_STORAGE_KEY, null)
  const tokens = createDefaultTokens()

  if (!saved) {
    return { username: 'Username', tokens }
  }

  const unlockedIds = new Set(saved.unlockedIds ?? [])
  return {
    username: saved.username ?? 'Username',
    tokens: tokens.map((token) => ({
      ...token,
      unlocked: unlockedIds.has(token.id)
    }))
  }
}

function persistTrophyState(state) {
  saveJson(TROPHY_STORAGE_KEY, {
    username: state.username,
    unlockedIds: state.tokens.filter((token) => token.unlocked).map((token) => token.id)
  })
}

// Darken a hex color a touch for the medallion's inner gradient.
function shade(hex) {
  const c = hex.replace('#', '')
  const num = parseInt(c.length === 3 ? c.replace(/(.)/g, '$1$1') : c, 16)
  const r = Math.max(0, ((num >> 16) & 255) - 60)
  const g = Math.max(0, ((num >> 8) & 255) - 60)
  const b = Math.max(0, (num & 255) - 60)
  return `rgb(${r}, ${g}, ${b})`
}

// Shared medallion gradient so the trophy case and the fly-in animation match.
export function tokenGradient(token) {
  return `radial-gradient(circle at 30% 25%, ${token.color}, ${shade(token.color)})`
}

export const useTrophyStore = defineStore('trophy', {
  state: () => loadTrophyState(),

  getters: {
    total: (state) => state.tokens.length,
    unlockedCount: (state) => state.tokens.filter((t) => t.unlocked).length,
    progressLabel() {
      return `${this.unlockedCount}/${this.total}`
    },
    progressRatio() {
      return this.total === 0 ? 0 : this.unlockedCount / this.total
    },
    progressPercent() {
      return Math.round(this.progressRatio * 100)
    }
  },

  actions: {
    unlockToken(id) {
      const token = this.tokens.find((t) => t.id === id)
      if (!token || token.unlocked) return
      token.unlocked = true
      persistTrophyState(this.$state)
    },

    toggleToken(id) {
      const token = this.tokens.find((t) => t.id === id)
      if (!token) return
      token.unlocked = !token.unlocked
      persistTrophyState(this.$state)
    }
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTrophyStore, import.meta.hot))
}
