import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { FavoriteEntry } from '@/types'

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref<FavoriteEntry[]>([])

  const getStorageKey = (): string | null => {
    const authStore = useAuthStore()
    if (!authStore.user) return null
    return `favorites_${authStore.user._id}`
  }

  const loadFavorites = () => {
    const key = getStorageKey()
    if (!key) {
      favorites.value = []
      return
    }
    try {
      const raw = localStorage.getItem(key)
      favorites.value = raw ? JSON.parse(raw) : []
    } catch {
      favorites.value = []
    }
  }

  const saveFavorites = () => {
    const key = getStorageKey()
    if (!key) return
    localStorage.setItem(key, JSON.stringify(favorites.value))
  }

  const isFavorite = (bookId: string): boolean => {
    return favorites.value.some(f => f.bookId === bookId)
  }

  const favoritesCount = computed(() => favorites.value.length)

  const favoriteBookIds = computed(() => favorites.value.map(f => f.bookId))

  const toggleFavorite = (bookId: string) => {
    const index = favorites.value.findIndex(f => f.bookId === bookId)
    if (index >= 0) {
      favorites.value.splice(index, 1)
    } else {
      favorites.value.push({
        bookId,
        addedAt: new Date().toISOString(),
      })
    }
    saveFavorites()
  }

  const clearFavorites = () => {
    favorites.value = []
    const key = getStorageKey()
    if (key) localStorage.removeItem(key)
  }

  return {
    favorites,
    favoritesCount,
    favoriteBookIds,
    loadFavorites,
    isFavorite,
    toggleFavorite,
    clearFavorites,
  }
})
