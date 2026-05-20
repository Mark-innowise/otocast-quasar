import { defineStore, acceptHMRUpdate } from 'pinia'

export function formatPuzzleTime(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const usePuzzleStore = defineStore('puzzle', {
  state: () => ({
    imageUrl: '',
    rows: 3,
    cols: 3,
    tiles: [],
    isSolved: false,
    moveCount: 0,
    elapsedMs: 0,
    isTimerRunning: false,
    timerTick: 0,
    _timerIntervalId: null,
    _timerStartedAt: null
  }),

  getters: {
    tileCount: (state) => state.rows * state.cols,

    isReady: (state) => state.tiles.length === state.rows * state.cols,

    liveElapsedMs(state) {
      void state.timerTick
      if (!state.isTimerRunning || state._timerStartedAt == null) {
        return state.elapsedMs
      }
      return state.elapsedMs + (Date.now() - state._timerStartedAt)
    },

    formattedTime() {
      return formatPuzzleTime(this.liveElapsedMs)
    }
  },

  actions: {
    setImageUrl(url) {
      this.imageUrl = url
    },

    setDimensions(rows, cols) {
      this.rows = rows
      this.cols = cols
    },

    createSolvedTiles() {
      const total = this.rows * this.cols
      const solved = []
      for (let i = 1; i < total; i++) {
        solved.push(i)
      }
      solved.push(null)
      return solved
    },

    getAdjacentIndices(index) {
      const row = Math.floor(index / this.cols)
      const col = index % this.cols
      const neighbors = []

      if (row > 0) neighbors.push(index - this.cols)
      if (row < this.rows - 1) neighbors.push(index + this.cols)
      if (col > 0) neighbors.push(index - 1)
      if (col < this.cols - 1) neighbors.push(index + 1)

      return neighbors
    },

    checkSolved() {
      const solved = this.createSolvedTiles()
      return this.tiles.every((tile, index) => tile === solved[index])
    },

    swapTiles(indexA, indexB) {
      const next = [...this.tiles]
      ;[next[indexA], next[indexB]] = [next[indexB], next[indexA]]
      this.tiles = next
    },

    startTimer() {
      if (this.isTimerRunning || this.isSolved) return

      this.isTimerRunning = true
      this._timerStartedAt = Date.now()

      this._timerIntervalId = setInterval(() => {
        this.timerTick += 1
      }, 100)
    },

    stopTimer() {
      if (this._timerIntervalId != null) {
        clearInterval(this._timerIntervalId)
        this._timerIntervalId = null
      }

      if (this.isTimerRunning && this._timerStartedAt != null) {
        this.elapsedMs += Date.now() - this._timerStartedAt
      }

      this.isTimerRunning = false
      this._timerStartedAt = null
      this.timerTick += 1
    },

    resetTimer() {
      this.stopTimer()
      this.elapsedMs = 0
      this.timerTick = 0
    },

    applyMove(tileIndex) {
      if (this.isSolved || this.tiles[tileIndex] === null) {
        return false
      }

      const emptyIndex = this.tiles.indexOf(null)
      const neighbors = this.getAdjacentIndices(emptyIndex)

      if (!neighbors.includes(tileIndex)) {
        return false
      }

      if (this.moveCount === 0) {
        this.startTimer()
      }

      this.swapTiles(tileIndex, emptyIndex)
      this.moveCount += 1

      if (this.checkSolved()) {
        this.markSolved()
      }

      return true
    },

    tryDirectionalMove(tileIndex, direction) {
      if (this.isSolved || this.tiles[tileIndex] === null) {
        return false
      }

      const emptyIndex = this.tiles.indexOf(null)
      const tileRow = Math.floor(tileIndex / this.cols)
      const tileCol = tileIndex % this.cols
      const emptyRow = Math.floor(emptyIndex / this.cols)
      const emptyCol = emptyIndex % this.cols

      const deltaByDirection = {
        up: { row: -1, col: 0 },
        down: { row: 1, col: 0 },
        left: { row: 0, col: -1 },
        right: { row: 0, col: 1 }
      }

      const delta = deltaByDirection[direction]
      if (!delta) return false

      const emptyIsTarget =
        emptyRow === tileRow + delta.row && emptyCol === tileCol + delta.col

      if (!emptyIsTarget) return false

      return this.applyMove(tileIndex)
    },

    shuffleTiles(shuffleMoves = 200) {
      const next = this.createSolvedTiles()
      let emptyIndex = next.indexOf(null)
      const moves = Math.max(shuffleMoves, this.tileCount * 20)

      for (let i = 0; i < moves; i++) {
        const neighbors = this.getAdjacentIndices(emptyIndex)
        const pick = neighbors[Math.floor(Math.random() * neighbors.length)]
        ;[next[emptyIndex], next[pick]] = [next[pick], next[emptyIndex]]
        emptyIndex = pick
      }

      return next
    },

    markSolved() {
      this.isSolved = true
      this.stopTimer()
    },

    initGame(rows, cols, shuffleMoves = 200) {
      this.setDimensions(rows, cols)
      this.tiles = this.shuffleTiles(shuffleMoves)
      this.isSolved = false
      this.moveCount = 0
      this.resetTimer()
    },

    resetGameState() {
      this.stopTimer()
      this.tiles = []
      this.isSolved = false
      this.moveCount = 0
      this.elapsedMs = 0
      this.timerTick = 0
    }
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePuzzleStore, import.meta.hot))
}
