import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Review } from '@/types'

export const useReviewsStore = defineStore('reviews', () => {
  const reviews = ref<Review[]>([])
  const currentBookId = ref<string | null>(null)

  const getStorageKey = (bookId: string): string => {
    return `reviews_${bookId}`
  }

  const loadReviews = (bookId: string) => {
    currentBookId.value = bookId
    try {
      const raw = localStorage.getItem(getStorageKey(bookId))
      reviews.value = raw ? JSON.parse(raw) : []
    } catch {
      reviews.value = []
    }
  }

  const saveReviews = (bookId: string) => {
    localStorage.setItem(getStorageKey(bookId), JSON.stringify(reviews.value))
  }

  const addReview = (review: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...review,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    reviews.value.unshift(newReview)
    saveReviews(review.bookId)
  }

  const hasUserReviewed = (bookId: string, userId: string): boolean => {
    return reviews.value.some(r => r.bookId === bookId && r.userId === userId)
  }

  const averageRating = computed((): number | null => {
    if (reviews.value.length === 0) return null
    const sum = reviews.value.reduce((acc, r) => acc + r.rating, 0)
    return Math.round((sum / reviews.value.length) * 10) / 10
  })

  return {
    reviews,
    currentBookId,
    loadReviews,
    addReview,
    hasUserReviewed,
    averageRating,
  }
})
