<script setup>
import { usePageTitle } from '../composables/usePageTitle'

const { titleRef, collapsed } = usePageTitle('Settings')
</script>

<template>
  <main>
    <h1 ref="titleRef" :class="{ collapsed }">Settings</h1>

    <button type="button" class="profile-card">
      <span class="profile-avatar">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20a8 8 0 0 1 16 0 1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
        </svg>
      </span>
      <span class="profile-text">
        <span class="profile-name">Sign In to Budge</span>
        <span class="profile-subtitle">Sync across devices</span>
      </span>
      <svg class="chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 6l6 6-6 6"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </main>
</template>

<style scoped>
h1 {
  transition: opacity 0.1s ease-out;
}

h1.collapsed {
  opacity: 0;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.9rem 1.25rem;
  border: none;
  border-radius: 25px;
  background-color: rgb(34, 34, 34);
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.profile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 4.5rem;
  height: 4.5rem;
  overflow: hidden;
  border-radius: 50%;
  background-color: var(--surface-2);
  color: rgba(255, 255, 255, 0.4);
}

.profile-avatar svg {
  width: 2.6rem;
  height: 2.6rem;
}

.profile-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.profile-name,
.profile-subtitle {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.profile-name {
  font-size: 1.25rem;
  font-weight: 600;
}

.profile-subtitle {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.85rem;
}

.chevron {
  flex: none;
  width: 1.1rem;
  height: 1.1rem;
  margin-left: auto;
  color: rgba(255, 255, 255, 0.35);
}
</style>
