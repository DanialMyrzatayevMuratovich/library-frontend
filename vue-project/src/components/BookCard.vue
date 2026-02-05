<template>
  <div class="book-card card">
    <button
      v-if="authStore.isAuthenticated"
      class="favorite-btn"
      :class="{ 'is-favorited': favoritesStore.isFavorite(book._id) }"
      @click.stop="favoritesStore.toggleFavorite(book._id)"
      :title="favoritesStore.isFavorite(book._id) ? 'Remove from favorites' : 'Add to favorites'"
    >
      {{ favoritesStore.isFavorite(book._id) ? '\u2665' : '\u2661' }}
    </button>
    <div class="book-icon">📖</div>
    <router-link :to="`/book/${book._id}`" class="book-title">
      <h3>{{ book.title }}</h3>
    </router-link>
    <p class="author" v-if="author">{{ author.firstName }} {{ author.lastName }}</p>
    <p class="year">{{ book.yearPublished }}</p>
    <p class="price-tag">Free</p>

    <div class="actions" v-if="authStore.isAuthenticated">
      <div v-if="buySuccess" class="success">Purchased!</div>
      <button v-else-if="!isOwned" @click="handleBuy" :disabled="isLoading">
        {{ isLoading ? 'Buying...' : 'Buy' }}
      </button>
      <button v-else @click="handleDownload" class="download-btn">
        Download EPUB
      </button>
    </div>
    <div class="actions" v-else>
      <router-link to="/login" class="login-link">Sign in to buy</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBooksStore } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import type { Book, Author } from '@/types'

const props = defineProps<{
  book: Book
  isOwned?: boolean
}>()

const booksStore = useBooksStore()
const authStore = useAuthStore()
const favoritesStore = useFavoritesStore()
const author = ref<Author | null>(null)
const isLoading = ref(false)
const buySuccess = ref(false)

onMounted(async () => {
  author.value = await booksStore.getAuthorById(props.book.authorId)
})

const handleBuy = async () => {
  isLoading.value = true
  const success = await booksStore.buyBook(props.book._id)
  if (success) {
    await authStore.loadUser()
    buySuccess.value = true
  }
  isLoading.value = false
}

const handleDownload = async () => {
  await booksStore.downloadBook(props.book._id, props.book.title)
}
</script>

<style scoped>
.book-card {
  text-align: center;
  transition: all 0.3s;
  position: relative;
}

.favorite-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  font-size: 24px;
  color: var(--color-text-secondary);
  padding: 4px;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s, transform 0.2s;
}

.favorite-btn:hover {
  transform: scale(1.2);
  background: transparent;
  box-shadow: none;
}

.favorite-btn.is-favorited {
  color: #e53e3e;
}

.book-icon {
  font-size: 60px;
  margin-bottom: 15px;
}

.book-title {
  text-decoration: none;
}

h3 {
  color: var(--color-accent);
  margin-bottom: 10px;
  font-size: 20px;
}

.book-title:hover h3 {
  text-decoration: underline;
}

.author {
  color: var(--color-text-secondary);
  font-style: italic;
  margin-bottom: 5px;
}

.year {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-bottom: 20px;
}

.price-tag {
  display: inline-block;
  padding: 2px 10px;
  background-color: var(--color-success);
  color: #ffffff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 10px;
}

.actions {
  margin-top: 20px;
}

button {
  width: 100%;
}

.download-btn {
  background-color: #00cc6e;
}

.login-link {
  font-size: 14px;
}
</style>
