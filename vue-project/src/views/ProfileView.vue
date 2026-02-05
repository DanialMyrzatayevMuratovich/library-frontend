<template>
  <div class="profile-page">
    <h1>Profile</h1>

    <div v-if="!authStore.user" class="loading">Loading...</div>

    <template v-else>
      <div class="profile-card card">
        <div class="profile-header">
          <div class="avatar">{{ initials }}</div>
          <div class="profile-info">
            <h2>{{ authStore.user.information.firstName }} {{ authStore.user.information.lastName }}</h2>
            <p class="email">{{ authStore.user.credentials.email }}</p>
            <span class="role-badge" :class="{ admin: authStore.isAdmin }">
              {{ authStore.isAdmin ? 'Admin' : 'User' }}
            </span>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-number">{{ ownedCount }}</div>
          <div class="stat-label">Books Owned</div>
        </div>
        <div class="stat-card card">
          <div class="stat-number">{{ favoritesCount }}</div>
          <div class="stat-label">Favorites</div>
        </div>
        <div class="stat-card card">
          <div class="stat-number">{{ reviewsCount }}</div>
          <div class="stat-label">Reviews Written</div>
        </div>
      </div>

      <div v-if="recentBooks.length > 0" class="recent-section">
        <div class="section-header">
          <h3>My Books</h3>
          <router-link to="/my-books" class="see-all">See all &rarr;</router-link>
        </div>
        <div class="recent-books">
          <div v-for="book in recentBooks" :key="book._id" class="recent-book card">
            <router-link :to="`/book/${book._id}`">
              <span class="book-emoji">📖</span>
              <span class="book-title">{{ book.title }}</span>
            </router-link>
          </div>
        </div>
      </div>

      <div class="profile-actions">
        <button @click="handleLogout" class="logout-btn">Logout</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import { useBooksStore } from '@/stores/books'
import type { Book } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const favoritesStore = useFavoritesStore()
const booksStore = useBooksStore()

const recentBooks = ref<Book[]>([])

const initials = computed(() => {
  if (!authStore.user) return '?'
  const f = authStore.user.information.firstName[0] || ''
  const l = authStore.user.information.lastName[0] || ''
  return (f + l).toUpperCase()
})

const ownedCount = computed(() => authStore.user?.ownedBooks?.length ?? 0)
const favoritesCount = computed(() => favoritesStore.favoritesCount)

const reviewsCount = computed(() => {
  if (!authStore.user) return 0
  const userId = authStore.user._id
  let count = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('reviews_')) {
      try {
        const reviews = JSON.parse(localStorage.getItem(key) || '[]')
        count += reviews.filter((r: any) => r.userId === userId).length
      } catch {
        // skip corrupted entries
      }
    }
  }
  return count
})

onMounted(async () => {
  const ids = authStore.user?.ownedBooks?.slice(0, 5) ?? []
  if (ids.length > 0) {
    recentBooks.value = await booksStore.fetchBooksByIds(ids)
  }
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.profile-page {
  padding: 30px 0;
  max-width: 700px;
}

h1 {
  color: var(--color-accent);
  font-size: 28px;
  margin-bottom: 25px;
}

.profile-card {
  margin-bottom: 25px;
}

.profile-card:hover {
  transform: none;
  box-shadow: none;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background-color: var(--color-navy);
  color: var(--color-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  flex-shrink: 0;
}

.profile-info h2 {
  color: var(--color-text-primary);
  font-size: 22px;
  margin-bottom: 4px;
}

.email {
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-bottom: 8px;
}

.role-badge {
  display: inline-block;
  padding: 2px 10px;
  background-color: var(--color-navy);
  color: var(--color-gold-light);
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
}

.role-badge.admin {
  background-color: var(--color-accent);
  color: #ffffff;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
  padding: 20px 16px;
}

.stat-card:hover {
  transform: none;
  box-shadow: none;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-accent);
  line-height: 1;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  color: var(--color-text-primary);
  font-size: 18px;
}

.see-all {
  font-size: 14px;
  color: var(--color-accent);
}

.recent-books {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 30px;
}

.recent-book {
  padding: 14px 18px;
}

.recent-book:hover {
  transform: none;
}

.recent-book a {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--color-text-primary);
}

.recent-book a:hover {
  color: var(--color-accent);
}

.book-emoji {
  font-size: 20px;
}

.book-title {
  font-weight: 500;
}

.profile-actions {
  margin-top: 10px;
}

.logout-btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  background-color: var(--color-error);
}

.logout-btn:hover {
  background-color: #c53030;
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--color-text-secondary);
  font-size: 18px;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
