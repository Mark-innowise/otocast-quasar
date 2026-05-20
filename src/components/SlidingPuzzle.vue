<template>
  <div class="sliding-puzzle column items-center full-width">
    <div class="puzzle-shell">
      <div class="puzzle-hud">
        <q-chip
          class="glass-chip"
          icon="touch_app"
          :label="`Moves: ${puzzleStore.moveCount}`"
        />
        <q-chip
          class="glass-chip"
          :class="{ 'glass-chip--active': puzzleStore.isTimerRunning }"
          icon="timer"
          :label="puzzleStore.formattedTime"
        />
      </div>

      <div
        class="puzzle-board shadow-2 rounded-borders"
        :class="{ 'puzzle-board--solved': puzzleStore.isSolved }"
        :style="boardStyle"
        role="grid"
        :aria-label="`Sliding puzzle ${localRows} by ${localCols}`"
      >
        <div
          v-if="puzzleStore.isSolved"
          class="puzzle-complete fit"
          :style="completeImageStyle"
          role="img"
          aria-label="Completed puzzle"
        />

        <TransitionGroup
          v-else
          name="puzzle-tile"
          tag="div"
          class="puzzle-grid fit"
          :style="gridStyle"
        >
          <div
            v-for="(tile, index) in puzzleStore.tiles"
            :key="tileKey(tile)"
            class="puzzle-cell"
            :class="cellClass(tile)"
            :style="cellPlacement(index)"
            role="gridcell"
            :aria-label="tile === null ? 'Empty space' : `Tile ${tile}`"
            :tabindex="tile === null ? -1 : 0"
            v-touch-swipe.mouse="(details) => onSwipe(index, details)"
            @click="onTileClick(index)"
            @keydown.enter.space.prevent="onTileClick(index)"
          >
            <div
              v-if="tile !== null"
              class="tile-face fit"
              :style="tileBackgroundStyle(tile)"
            />
          </div>
        </TransitionGroup>
      </div>

      <div class="puzzle-controls">
        <q-btn
          class="glass-btn puzzle-control-btn"
          icon="shuffle"
          label="New Game"
          @click="startNewGame"
          no-caps
          rounded
          unelevated
        />

        <q-btn
          v-if="puzzleStore.isSolved"
          class="glass-btn glass-btn--success puzzle-control-btn"
          style="pointer-events: none;"
          icon="emoji_events"
          label="Complete!"
          no-caps
          rounded
          unelevated
        />

        <q-btn-dropdown
          v-else
          class="glass-btn puzzle-control-btn"
          content-class="glass-menu"
          :label="`Grid: ${localRows} x ${localCols}`"
          no-caps
          rounded
          unelevated
        >
          <q-list>
            <q-item clickable v-close-popup @click="changeGridSize(2)">
              <q-item-section class="text-center text-weight-medium">2 x 2 (Easy)</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="changeGridSize(3)">
              <q-item-section class="text-center text-weight-medium">3 x 3 (Normal)</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="changeGridSize(4)">
              <q-item-section class="text-center text-weight-medium">4 x 4 (Hard)</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { usePuzzleStore, formatPuzzleTime } from 'stores/puzzle-store'

const props = defineProps({
  rows: {
    type: Number,
    default: 3,
    validator: (value) => value >= 2
  },
  cols: {
    type: Number,
    default: 3,
    validator: (value) => value >= 2
  },
  imageUrl: {
    type: String,
    default: ''
  },
  shuffleMoves: {
    type: Number,
    default: 200
  }
})

const emit = defineEmits(['solved', 'new-game'])

const puzzleStore = usePuzzleStore()
const { isSolved } = storeToRefs(puzzleStore)

const localRows = ref(props.rows)
const localCols = ref(props.cols)

let hasEmittedSolved = false

const resolvedImageUrl = computed(
  () => props.imageUrl || puzzleStore.imageUrl || ''
)

const gridStyle = computed(() => ({
  '--puzzle-cols': localCols.value,
  '--puzzle-rows': localRows.value
}))

const boardStyle = computed(() => ({
  ...gridStyle.value,
  aspectRatio: `${localCols.value} / ${localRows.value}`
}))

function tileKey(tile) {
  return tile === null ? 'empty' : `tile-${tile}`
}

function cellPlacement(index) {
  const row = Math.floor(index / localCols.value) + 1
  const col = (index % localCols.value) + 1
  return {
    gridRow: `${row}`,
    gridColumn: `${col}`
  }
}

function cellClass(tile) {
  return {
    'puzzle-cell--empty': tile === null,
    'puzzle-cell--filled': tile !== null,
    'cursor-pointer': tile !== null
  }
}

function tileBackgroundStyle(tileValue) {
  const originalIndex = tileValue - 1
  const row = Math.floor(originalIndex / localCols.value)
  const col = originalIndex % localCols.value

  const posX = localCols.value > 1 ? (col / (localCols.value - 1)) * 100 : 0
  const posY = localRows.value > 1 ? (row / (localRows.value - 1)) * 100 : 0

  return {
    backgroundImage: resolvedImageUrl.value
      ? `url("${resolvedImageUrl.value}")`
      : 'none',
    backgroundSize: `${localCols.value * 100}% ${localRows.value * 100}%`,
    backgroundPosition: `${posX}% ${posY}%`,
    backgroundRepeat: 'no-repeat'
  }
}

const completeImageStyle = computed(() => ({
  backgroundImage: resolvedImageUrl.value
    ? `url("${resolvedImageUrl.value}")`
    : 'none',
  backgroundSize: 'contain',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundColor: '#ffffff'
}))

function onTileClick(index) {
  puzzleStore.applyMove(index)
}

function onSwipe(index, { direction }) {
  puzzleStore.tryDirectionalMove(index, direction)
}

function reshuffleBoard() {
  hasEmittedSolved = false
  puzzleStore.initGame(localRows.value, localCols.value, props.shuffleMoves)
}

function startNewGame() {
  emit('new-game')
  nextTick(() => {
    if (props.imageUrl) {
      puzzleStore.setImageUrl(props.imageUrl)
    }
    reshuffleBoard()
  })
}

function changeGridSize(size) {
  localRows.value = size
  localCols.value = size
  reshuffleBoard()
}

function emitSolvedIfNeeded() {
  if (!puzzleStore.isSolved || hasEmittedSolved) return

  hasEmittedSolved = true
  emit('solved', {
    tiles: [...puzzleStore.tiles],
    moveCount: puzzleStore.moveCount,
    elapsedMs: puzzleStore.elapsedMs,
    formattedTime: formatPuzzleTime(puzzleStore.elapsedMs),
    rows: localRows.value,
    cols: localCols.value
  })
}

watch(isSolved, (solved) => {
  if (solved) emitSolvedIfNeeded()
})

watch(
  () => [props.rows, props.cols],
  ([newR, newC]) => {
    localRows.value = newR
    localCols.value = newC
    reshuffleBoard()
  }
)

watch(
  () => props.imageUrl,
  (url) => {
    if (url) puzzleStore.setImageUrl(url)
  },
  { immediate: true }
)

onMounted(() => {
  if (props.imageUrl) {
    puzzleStore.setImageUrl(props.imageUrl)
  }
  reshuffleBoard()
})

onUnmounted(() => {
  puzzleStore.stopTimer()
})

defineExpose({
  startNewGame,
  reshuffleBoard
})
</script>

<style scoped>
.sliding-puzzle {
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.puzzle-shell {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
  overflow: hidden;
  box-sizing: border-box;
  container-type: inline-size;
  container-name: puzzle;
}

.puzzle-hud {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.puzzle-hud .glass-chip {
  width: 100%;
  max-width: 100%;
  justify-content: center;
  min-width: 0;
}

.puzzle-board {
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  touch-action: manipulation;
  border-radius: 12px;
  box-sizing: border-box;

  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 4px 30px rgba(0, 0, 0, 0.1),
    inset 0 0 15px rgba(255, 255, 255, 0.05);
}

.puzzle-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  align-items: stretch;
}

.puzzle-control-btn {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.glass-chip,
.glass-btn {
  font-family: 'Outfit', sans-serif !important;
  font-weight: 500 !important;
  color: rgba(255, 255, 255, 0.95) !important;
  box-sizing: border-box;

  background: rgba(255, 255, 255, 0.15) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.glass-chip {
  margin: 0 !important; 
  padding: 12px 32px !important;
  font-size: 1.9rem !important;
  border-radius: 16px !important;
  min-height: 56px;
}

.glass-btn,
.puzzle-control-btn :deep(.q-btn) {
  padding: 16px 16px !important;
  font-size: 2.1rem !important;
  border-radius: 24px !important;
  min-height: 64px;
}

.puzzle-control-btn :deep(.q-btn) {
  width: 100%;
  max-width: 100%;
}

:deep(.glass-chip .q-chip__icon),
:deep(.glass-chip .q-icon),
:deep(.glass-btn .q-icon),
:deep(.puzzle-control-btn .q-icon),
:deep(.puzzle-control-btn .q-btn-dropdown__arrow) {
  margin: 0 !important;
  font-size: 2rem !important;
  color: rgba(255, 255, 255, 0.8) !important;
}

.puzzle-control-btn :deep(.q-btn__content) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 16px !important; 
  font-size: 2.1rem !important;
  line-height: 1.2;
  flex-wrap: nowrap;
  max-width: 100%;
}

:deep(.glass-chip .q-chip__content) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 12px !important; 
  font-size: 1.9rem !important;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.puzzle-control-btn :deep(.q-btn-dropdown__arrow) {
  font-size: 2rem !important;
}

.glass-btn {
  transition: all 0.25s ease;
}

.glass-btn:hover,
.puzzle-control-btn :deep(.q-btn:hover) {
  background: rgba(255, 255, 255, 0.25) !important;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2) !important;
}

.glass-btn:active,
.puzzle-control-btn :deep(.q-btn:active) {
  transform: translateY(0);
}

:deep(.glass-chip .q-chip__icon),
:deep(.glass-chip .q-icon),
:deep(.glass-btn .q-icon),
:deep(.puzzle-control-btn .q-icon) {
  margin-right: 16px;
  font-size: 2rem !important;
  color: rgba(255, 255, 255, 0.8) !important;
}

:deep(.glass-chip .q-chip__content) {
  font-size: 1.9rem !important;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  justify-content: center !important; 
}

.glass-chip--active {
  border-color: rgba(255, 165, 0, 0.5) !important;
  background: rgba(255, 165, 0, 0.15) !important;
}

.glass-btn--success,
.glass-btn--success :deep(.q-btn) {
  border-color: rgba(76, 175, 80, 0.5) !important;
  background: rgba(76, 175, 80, 0.2) !important;
}

.puzzle-board--solved {
  padding: 0;
  border: none;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.puzzle-grid {
  display: grid;
  grid-template-columns: repeat(var(--puzzle-cols), 1fr);
  grid-template-rows: repeat(var(--puzzle-rows), 1fr);
  gap: 6px;
  padding: 6px;
  box-sizing: border-box;
}

.puzzle-board--solved .puzzle-complete {
  border-radius: inherit;
}

.puzzle-cell {
  position: relative;
  min-width: 0;
  min-height: 0;
  border-radius: 8px;
  overflow: hidden;
  box-sizing: border-box;
}

.puzzle-cell--empty {
  visibility: hidden;
  pointer-events: none;
}

.puzzle-cell--filled {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
  transition:
    box-shadow 0.25s ease,
    transform 0.25s ease,
    background-color 0.25s ease;
}

.puzzle-cell--filled:hover {
  background: rgba(255, 255, 255, 0.25);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.2);
  transform: scale(1.03) translateY(-2px);
  z-index: 1;
}

.puzzle-cell--filled:active {
  transform: scale(0.98);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tile-face {
  opacity: 0.92;
  background-color: #ffffff;
}

.puzzle-tile-move {
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.puzzle-tile-enter-active,
.puzzle-tile-leave-active {
  transition: opacity 0.3s ease;
}

.puzzle-tile-enter-from,
.puzzle-tile-leave-to {
  opacity: 0;
}

@container puzzle (max-width: 520px) {
  .puzzle-hud {
    grid-template-columns: 1fr;
  }

  .puzzle-controls {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .puzzle-hud {
    grid-template-columns: 1fr;
  }

  .puzzle-controls {
    grid-template-columns: 1fr;
  }
}
</style>
