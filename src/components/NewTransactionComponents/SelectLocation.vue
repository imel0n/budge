<script setup>
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue'
import { getCurrentPosition, reverseGeocode, searchLocations } from '../../lib/geocode'

const { form, locations, pop } = inject('newTransaction')

const query = ref('')

function match(list) {
  const q = query.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (l) => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q),
  )
}

const saved = computed(() => match(locations.saved))
const recents = computed(() => match(locations.recents))

function select(location) {
  form.selectedLocation = location.name
  pop()
}

// Bias search results toward the user's position once they've resolved it.
const userCoords = ref(null)

const locating = ref(false)
const locateError = ref('')

async function useCurrentLocation() {
  if (locating.value) return
  locating.value = true
  locateError.value = ''
  try {
    const coords = await getCurrentPosition()
    userCoords.value = { lat: coords.latitude, lon: coords.longitude }
    const place = await reverseGeocode(coords.latitude, coords.longitude)
    if (place) select(place)
    else locateError.value = 'Could not resolve your location'
  } catch (e) {
    locateError.value = e.code === 1 ? 'Location permission denied' : 'Could not get your location'
  } finally {
    locating.value = false
  }
}

const results = ref([])
const searching = ref(false)
const searchError = ref('')
let debounceTimer
let controller

async function runSearch(term) {
  controller = new AbortController()
  searchError.value = ''
  try {
    results.value = await searchLocations(term, {
      lat: userCoords.value?.lat,
      lon: userCoords.value?.lon,
      signal: controller.signal,
    })
  } catch (e) {
    if (e.name === 'AbortError') return
    searchError.value = 'Search failed'
    results.value = []
  } finally {
    searching.value = false
  }
}

watch(query, (q) => {
  clearTimeout(debounceTimer)
  controller?.abort()
  const term = q.trim()
  if (term.length < 3) {
    results.value = []
    searching.value = false
    searchError.value = ''
    return
  }
  searching.value = true
  debounceTimer = setTimeout(() => runSearch(term), 300)
})

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
  controller?.abort()
})
</script>

<template>
  <div>
    <div class="search-bar">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
        <path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <input v-model="query" class="search-input" type="text" placeholder="Enter Location" />
    </div>

    <div class="section-label">Current Location</div>
    <div class="list keep-separator">
      <button class="row" :disabled="locating" @click="useCurrentLocation">
        <span class="row-name">Current Location</span>
        <span class="row-address">
          {{ locating ? 'Locating…' : locateError || 'Use my current location' }}
        </span>
      </button>
    </div>

    <template v-if="saved.length">
      <div class="section-label">Saved</div>
      <div class="list keep-separator">
        <button
          v-for="location in saved"
          :key="location.name"
          class="row"
          :class="{ selected: form.selectedLocation === location.name }"
          @click="select(location)"
        >
          <span class="row-name">{{ location.name }}</span>
          <span class="row-address">{{ location.address }}</span>
        </button>
      </div>
    </template>

    <template v-if="recents.length">
      <div class="section-label">Recents</div>
      <div class="list">
        <button
          v-for="location in recents"
          :key="location.name"
          class="row"
          :class="{ selected: form.selectedLocation === location.name }"
          @click="select(location)"
        >
          <span class="row-name">{{ location.name }}</span>
          <span class="row-address">{{ location.address }}</span>
        </button>
      </div>
    </template>

    <template v-if="query.trim().length >= 3">
      <div class="section-label">Results</div>
      <div v-if="searching" class="hint">Searching…</div>
      <div v-else-if="searchError" class="hint">{{ searchError }}</div>
      <div v-else-if="!results.length" class="hint">No matches found</div>
      <div v-else class="list">
        <button
          v-for="location in results"
          :key="location.key"
          class="row"
          :class="{ selected: form.selectedLocation === location.name }"
          @click="select(location)"
        >
          <span class="row-name">{{ location.name }}</span>
          <span class="row-address">{{ location.address }}</span>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--surface-1);
  border-radius: 999px;
  padding: 0.6rem 1rem;
  margin-top: 0.5rem;
}

.search-icon {
  flex: none;
  width: 1.25rem;
  height: 1.25rem;
  color: rgba(255, 255, 255, 0.4);
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: #ffffff;
  caret-color: #ffffff;
  font-family: inherit;
  font-size: 1.1rem;
  outline: none;
  padding: 0;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.section-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1.5rem 0 0.5rem;
}

.list {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 0.5rem 0;
  cursor: pointer;
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.12);
}

.row:last-child {
  border-bottom: none;
}

.list.keep-separator .row:last-child {
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.12);
}

.row-name {
  color: #ffffff;
  font-size: 1.15rem;
}

.row-address {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.95rem;
}

.row.selected .row-name {
  color: var(--accent, #3b82f6);
}

.row:disabled {
  cursor: default;
}

.hint {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.95rem;
  padding: 0.5rem 0;
}
</style>
