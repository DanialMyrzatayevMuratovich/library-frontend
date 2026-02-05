<template>
  <div class="favorites-page">
    <h1>My Favorites</h1>

    <div v-if="isLoading" class="loading">Loading...</div>

    <div v-else-if="favoriteBooks.length === 0" class="empty">
      You have no favorite books yet.
      <router-link to="/books">Browse catalog</router-link>
    </div>

    <div v-else class="books-grid">
      <BookCard
        v-for="book in favoriteBooks"
        :key="book._id"
        :book="book"
        :is-owned="isBookOwned(book._id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useBooksStore } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import BookCard from '@/components/BookCard.vue'
import type { Book } from '@/types'

const booksStore = useBooksStore()
const authStore = useAuthStore()
const favoritesStore = useFavoritesStore()

const favoriteBooks = ref<Book[]>([])
const isLoading = ref(true)

const isBookOwned = (bookId: string): boolean => {
  return authStore.user?.ownedBooks?.includes(bookId) ?? false
}

const loadFavoriteBooks = async () => {
  isLoading.value = true
  const ids = favoritesStore.favoriteBookIds
  if (ids.length > 0) {
    await booksStore.fetchAllBooks()
    favoriteBooks.value = booksStore.books.filter(b => ids.includes(b._id))
  } else {
    favoriteBooks.value = []
  }
  isLoading.value = false
}

onMounted(() => {
  favoritesStore.loadFavorites()
  loadFavoriteBooks()
})

watch(() => favoritesStore.favorites.length, () => {
  loadFavoriteBooks()
})
</script>

<style scoped>
.favorites-page {
  padding: 30px 0;
}

h1 {
  color: var(--color-accent);
  margin-bottom: 30px;
  font-size: 28px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.loading {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 18px;
  padding: 40px;
}

.empty {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 18px;
  padding: 40px;
}

.empty a {
  display: block;
  margin-top: 15px;
  color: var(--color-accent);
}
</style>
