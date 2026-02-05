<template>
  <div class="book-detail-page">
    <router-link to="/books" class="back-link">&larr; Back to books</router-link>

    <div v-if="isLoading" class="loading">Loading...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="book" class="book-detail card">
      <div class="book-header">
        <div class="book-icon">📖</div>
        <div class="book-info">
          <h1>{{ book.title }}</h1>
          <p class="author" v-if="author">{{ author.firstName }} {{ author.lastName }}</p>
          <p class="year" v-if="book.yearPublished">Published: {{ book.yearPublished }}</p>
          <p class="price-label">Free</p>
          <button
            v-if="authStore.isAuthenticated"
            class="favorite-toggle"
            :class="{ 'is-favorited': favoritesStore.isFavorite(book._id) }"
            @click="favoritesStore.toggleFavorite(book._id)"
          >
            {{ favoritesStore.isFavorite(book._id) ? '\u2665 Remove from Favorites' : '\u2661 Add to Favorites' }}
          </button>
        </div>
      </div>

      <div class="book-actions" v-if="authStore.isAuthenticated">
        <div v-if="buySuccess" class="success">Purchased! You can now download this book.</div>
        <template v-else-if="!isOwned">
          <div v-if="confirmBuy" class="confirm-box">
            <p>Are you sure you want to buy this book?</p>
            <div class="confirm-buttons">
              <button @click="executeBuy" :disabled="buyLoading">
                {{ buyLoading ? 'Buying...' : 'Confirm' }}
              </button>
              <button @click="confirmBuy = false" class="cancel-btn">Cancel</button>
            </div>
          </div>
          <button v-else @click="confirmBuy = true">Buy Book</button>
        </template>
        <button v-else @click="handleDownload" class="download-btn">
          Download EPUB
        </button>
      </div>
      <div class="book-actions" v-else>
        <router-link to="/login">Sign in to buy this book</router-link>
      </div>
    </div>

    <!-- Reviews Section -->
    <div v-if="book" class="reviews-section">
      <h2>Reviews <span v-if="reviewsStore.reviews.length > 0" class="review-count">({{ reviewsStore.reviews.length }})</span></h2>

      <div v-if="avgRating !== null" class="average-rating">
        <span class="stars">{{ renderStars(avgRating) }}</span>
        <span class="avg-number">{{ avgRating }} / 5</span>
      </div>

      <!-- Review Form -->
      <div v-if="authStore.isAuthenticated && !authStore.isGuest && !alreadyReviewed" class="review-form card">
        <h3>Leave a Review</h3>
        <div class="star-selector">
          <span
            v-for="star in 5"
            :key="star"
            class="star-pick"
            :class="{ active: star <= newRating }"
            @click="newRating = star"
          >&#9733;</span>
        </div>
        <div class="form-group">
          <textarea
            v-model="newReviewText"
            placeholder="Write your review..."
            rows="3"
          ></textarea>
        </div>
        <button @click="submitReview" :disabled="newRating === 0 || !newReviewText.trim()">
          Submit Review
        </button>
      </div>

      <div v-else-if="alreadyReviewed" class="already-reviewed">
        You have already reviewed this book.
      </div>

      <!-- Reviews List -->
      <div v-if="reviewsStore.reviews.length > 0" class="reviews-list">
        <div v-for="review in reviewsStore.reviews" :key="review.id" class="review-item card">
          <div class="review-header">
            <span class="reviewer-name">{{ review.userName }}</span>
            <span class="review-stars">{{ renderStars(review.rating) }}</span>
            <span class="review-date">{{ formatDate(review.createdAt) }}</span>
          </div>
          <p class="review-text">{{ review.text }}</p>
        </div>
      </div>

      <div v-else class="no-reviews">
        No reviews yet. Be the first to review this book!
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { bookAPI } from '@/api'
import { useBooksStore } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import { useReviewsStore } from '@/stores/reviews'
import type { Book, Author } from '@/types'

const route = useRoute()
const booksStore = useBooksStore()
const authStore = useAuthStore()
const favoritesStore = useFavoritesStore()
const reviewsStore = useReviewsStore()

const book = ref<Book | null>(null)
const author = ref<Author | null>(null)
const isLoading = ref(true)
const error = ref('')
const buyLoading = ref(false)
const confirmBuy = ref(false)
const buySuccess = ref(false)

const newRating = ref(0)
const newReviewText = ref('')

const alreadyReviewed = computed(() => {
  if (!book.value || !authStore.user) return false
  return reviewsStore.hasUserReviewed(book.value._id, authStore.user._id)
})

const avgRating = computed(() => reviewsStore.averageRating)

const renderStars = (rating: number): string => {
  const full = Math.floor(rating)
  const empty = 5 - full
  return '\u2605'.repeat(full) + '\u2606'.repeat(empty)
}

const formatDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const submitReview = () => {
  if (!book.value || !authStore.user) return
  reviewsStore.addReview({
    bookId: book.value._id,
    userId: authStore.user._id,
    userName: `${authStore.user.information.firstName} ${authStore.user.information.lastName}`,
    rating: newRating.value,
    text: newReviewText.value.trim(),
  })
  newRating.value = 0
  newReviewText.value = ''
}

const isOwned = computed(() => {
  if (!book.value) return false
  return authStore.user?.ownedBooks?.includes(book.value._id) ?? false
})

onMounted(async () => {
  try {
    const id = route.params.id as string
    book.value = await bookAPI.getById(id)
    if (book.value.authorId) {
      author.value = await booksStore.getAuthorById(book.value.authorId)
    }
    favoritesStore.loadFavorites()
    reviewsStore.loadReviews(book.value._id)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Book not found'
  } finally {
    isLoading.value = false
  }
})

const executeBuy = async () => {
  if (!book.value) return
  buyLoading.value = true
  const success = await booksStore.buyBook(book.value._id)
  if (success) {
    await authStore.loadUser()
    buySuccess.value = true
    confirmBuy.value = false
  }
  buyLoading.value = false
}

const handleDownload = async () => {
  if (!book.value) return
  await booksStore.downloadBook(book.value._id, book.value.title)
}
</script>

<style scoped>
.book-detail-page {
  padding: 30px 0;
}

.back-link {
  display: inline-block;
  margin-bottom: 20px;
  font-size: 16px;
}

.book-detail {
  max-width: 600px;
}

.book-header {
  display: flex;
  gap: 25px;
  align-items: flex-start;
}

.book-icon {
  font-size: 80px;
  flex-shrink: 0;
}

.book-info {
  flex: 1;
}

h1 {
  color: var(--color-accent);
  font-size: 28px;
  margin-bottom: 10px;
}

.author {
  color: var(--color-text-secondary);
  font-style: italic;
  font-size: 18px;
  margin-bottom: 8px;
}

.year {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.price-label {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 12px;
  background-color: var(--color-success);
  color: #ffffff;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
}

.favorite-toggle {
  margin-top: 12px;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.favorite-toggle:hover {
  border-color: #e53e3e;
  color: #e53e3e;
}

.favorite-toggle.is-favorited {
  border-color: #e53e3e;
  color: #e53e3e;
}

.book-actions {
  margin-top: 30px;
}

.book-actions button {
  padding: 14px 30px;
  font-size: 16px;
}

.confirm-box {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 15px;
}

.confirm-box p {
  margin-bottom: 12px;
  color: var(--color-text-secondary);
}

.confirm-buttons {
  display: flex;
  gap: 10px;
}

.cancel-btn {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.cancel-btn:hover {
  border-color: var(--color-text-secondary);
}

.download-btn {
  background-color: #00cc6e;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.loading {
  color: var(--color-text-secondary);
}

.reviews-section {
  margin-top: 40px;
  max-width: 600px;
}

.reviews-section h2 {
  color: var(--color-accent);
  font-size: 22px;
  margin-bottom: 15px;
}

.review-count {
  font-size: 16px;
  color: var(--color-text-secondary);
  font-weight: normal;
}

.average-rating {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.average-rating .stars {
  color: var(--color-accent);
  font-size: 20px;
}

.avg-number {
  color: var(--color-text-secondary);
  font-size: 16px;
}

.review-form {
  margin-bottom: 25px;
}

.review-form:hover {
  transform: none;
  box-shadow: none;
}

.review-form h3 {
  margin-bottom: 12px;
  color: var(--color-text-primary);
  font-size: 18px;
}

.star-selector {
  margin-bottom: 12px;
}

.star-pick {
  font-size: 28px;
  color: var(--color-border);
  cursor: pointer;
  transition: color 0.2s;
}

.star-pick:hover,
.star-pick.active {
  color: var(--color-accent);
}

.review-form textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.review-form textarea:focus {
  outline: none;
  border-color: var(--color-accent);
}

.review-form button {
  padding: 10px 20px;
  font-size: 14px;
}

.already-reviewed {
  color: var(--color-text-secondary);
  font-style: italic;
  margin-bottom: 20px;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-item {
  padding: 16px;
}

.review-item:hover {
  transform: none;
  box-shadow: none;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.reviewer-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.review-stars {
  color: var(--color-accent);
  font-size: 14px;
}

.review-date {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-left: auto;
}

.review-text {
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.no-reviews {
  color: var(--color-text-secondary);
  font-style: italic;
  padding: 20px 0;
}

@media (max-width: 768px) {
  .book-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .book-icon {
    font-size: 60px;
  }

  h1 {
    font-size: 22px;
  }
}
</style>
