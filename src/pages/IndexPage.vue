<template>
  <q-page class="q-pa-md column items-center">
    <div class="glass-title q-mb-sm">Sliding Puzzle</div>

    <p class="glass-subtitle text-center q-mb-md" style="max-width: 35rem">
      Tap a tile next to the gap, or swipe it toward the empty space. Complete the picture as
      fast as you can.
    </p>

    <SlidingPuzzle
      ref="puzzleRef"
      :rows="gridRows"
      :cols="gridCols"
      :image-url="puzzleImageUrl"
      :shuffle-moves="250"
      class="full-width"
      style="max-width: min(100%, 35rem)"
      @solved="onPuzzleSolved"
      @new-game="pickRandomImage"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import SlidingPuzzle from 'components/SlidingPuzzle.vue'
import { usePuzzleStore } from 'stores/puzzle-store'

import puzzleImage from 'assets/mock.svg'
import puzzleImage1 from 'assets/mock1.jpg'
import puzzleImage2 from 'assets/mock2.jpg'
import puzzleImage3 from 'assets/mock3.jpg'
import puzzleImage4 from 'assets/mock4.jpg'

const $q = useQuasar()
const puzzleStore = usePuzzleStore()

const gridRows = 3
const gridCols = 3
const puzzleRef = ref(null)

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

function onPuzzleSolved(payload) {
  $q.notify({
    type: 'positive',
    message: 'Puzzle solved!',
    caption: `${payload.moveCount} moves · ${payload.formattedTime}`,
    icon: 'celebration',
    position: 'top',
    timeout: 3500
  })

  $q.dialog({
    title: 'Victory!',
    message: `Puzzle solved in <strong>${payload.moveCount}</strong> moves and <strong>${payload.formattedTime}</strong>.`,
    html: true,
    class: 'glass-dialog',
    ok: {
      label: 'Play Again',
      class: 'glass-btn',
      unelevated: true
    },
    cancel: {
      label: 'Close',
      class: 'glass-btn glass-btn--cancel',
      flat: true
    },
    persistent: false
  }).onOk(() => {
    puzzleRef.value?.startNewGame()
  })
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&display=swap');

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
  background: rgba(76, 175, 80, 0.2) !important;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(76, 175, 80, 0.5);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3),
              0 0 20px rgba(76, 175, 80, 0.15);
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
