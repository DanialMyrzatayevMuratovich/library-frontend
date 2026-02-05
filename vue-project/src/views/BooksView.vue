<template>
  <div class="books-page">
    <h1>All Books</h1>

    <div class="search-bar">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by title or author..."
      />
    </div>

    <div v-if="booksStore.isLoading" class="loading">Loading...</div>

    <div v-else-if="booksStore.error" class="error">{{ booksStore.error }}</div>

    <div v-else-if="booksStore.books.length === 0" class="empty">
      No books available yet
    </div>

    <template v-else>
      <div v-if="filteredBooks.length === 0" class="empty">
        No books match your search
      </div>

      <div v-else class="books-grid">
        <BookCard
          v-for="book in paginatedBooks"
          :key="book._id"
          :book="book"
          :is-owned="isBookOwned(book._id)"
        />
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">&larr; Prev</button>
        <template v-for="page in visiblePages" :key="page">
          <span v-if="page === '...'" class="page-dots">...</span>
          <button
            v-else
            class="page-btn page-num"
            :class="{ active: page === currentPage }"
            @click="currentPage = page as number"
          >{{ page }}</button>
        </template>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">Next &rarr;</button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBooksStore } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'
import BookCard from '@/components/BookCard.vue'

const booksStore = useBooksStore()
const authStore = useAuthStore()
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 8

const filteredBooks = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return booksStore.books
  return booksStore.books.filter(book => {
    if (book.title.toLowerCase().includes(query)) return true
    const author = booksStore.authors.get(book.authorId)
    if (author) {
      const fullName = `${author.firstName} ${author.lastName}`.toLowerCase()
      if (fullName.includes(query)) return true
    }
    return false
  })
})

const totalPages = computed(() => Math.ceil(filteredBooks.value.length / pageSize))

const paginatedBooks = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredBooks.value.slice(start, start + pageSize)
})

const visiblePages = computed((): (number | string)[] => {
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages: (number | string)[] = [1]
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

watch(searchQuery, () => {
  currentPage.value = 1
})

const isBookOwned = (bookId: string): boolean => {
  return authStore.user?.ownedBooks?.includes(bookId) ?? false
}

onMounted(() => {
  booksStore.fetchAllBooks()
})
</script>

<style scoped>
.books-page {
  padding: 30px 0;
}

h1 {
  color: var(--color-accent);
  margin-bottom: 20px;
  font-size: 28px;
}

.search-bar {
  margin-bottom: 25px;
  max-width: 400px;
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

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 30px;
  flex-wrap: wrap;
}

.page-btn {
  padding: 8px 14px;
  font-size: 14px;
  background-color: var(--color-bg-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background-color: var(--color-bg-card);
  box-shadow: none;
}

.page-btn:disabled {
  opacity: 0.4;
}

.page-num {
  min-width: 38px;
  text-align: center;
  padding: 8px 10px;
}

.page-btn.active {
  background-color: var(--color-accent);
  color: #ffffff;
  border-color: var(--color-accent);
}

.page-dots {
  padding: 0 4px;
  color: var(--color-text-secondary);
}

.page-info {
  margin-left: 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
