<template>
  <div class="admin-page">
    <h1>Admin Panel</h1>

    <div v-if="!authStore.isAdmin" class="error">
      Access denied. Administrators only.
    </div>

    <template v-else>
      <section class="admin-section card">
        <h2>Authors</h2>
        <div v-if="authorsLoading" class="loading-text">Loading authors...</div>
        <div v-else-if="knownAuthors.length > 0" class="authors-list">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in knownAuthors" :key="a._id">
                <td>{{ a.firstName }} {{ a.lastName }}</td>
                <td class="id-cell">{{ a._id }}</td>
                <td class="action-cell">
                  <button class="use-btn" @click="bookAuthorId = a._id">Use</button>
                  <button class="copy-btn" @click="copyToClipboard(a._id)">
                    {{ copiedId === a._id ? 'Copied!' : 'Copy ID' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-text">No authors found. Add one below.</div>

        <h3>Add Author</h3>
        <form @submit.prevent="handleAddAuthor">
          <div class="form-group">
            <label>First Name</label>
            <input v-model="authorFirstName" type="text" required placeholder="Author first name" />
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input v-model="authorLastName" type="text" required placeholder="Author last name" />
          </div>
          <div v-if="authorError" class="error">{{ authorError }}</div>
          <div v-if="authorSuccess" class="success">{{ authorSuccess }}</div>
          <button type="submit" :disabled="authorLoading">
            {{ authorLoading ? 'Adding...' : 'Add Author' }}
          </button>
        </form>
      </section>

      <section class="admin-section card" style="max-width: 800px;">
        <h2>All Books</h2>
        <div v-if="booksLoading" class="loading-text">Loading books...</div>
        <div v-else-if="allBooks.length === 0" class="empty-text">No books in the catalog.</div>
        <div v-else class="books-list">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Year</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in allBooks" :key="b._id">
                <td>{{ b.title }}</td>
                <td>{{ getAuthorName(b.authorId) }}</td>
                <td>{{ b.yearPublished }}</td>
                <td class="action-cell">
                  <button
                    class="delete-btn"
                    @click="handleDeleteBook(b._id, b.title)"
                    :disabled="deletingBookId === b._id"
                  >
                    {{ deletingBookId === b._id ? 'Deleting...' : 'Delete' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="deleteError" class="error">{{ deleteError }}</div>
        <div v-if="deleteSuccess" class="success">{{ deleteSuccess }}</div>
      </section>

      <section class="admin-section card">
        <h2>Add Book</h2>
        <form @submit.prevent="handleAddBook">
          <div class="form-group">
            <label>Title</label>
            <input v-model="bookTitle" type="text" required placeholder="Book title" />
          </div>
          <div class="form-group">
            <label>Author ID</label>
            <div class="author-id-input">
              <input v-model="bookAuthorId" type="text" required placeholder="Select from authors above or paste ID" />
            </div>
          </div>
          <div class="form-group">
            <label>Year Published</label>
            <input v-model.number="bookYear" type="number" required placeholder="2024" />
          </div>
          <div class="form-group">
            <label>EPUB File</label>
            <input type="file" accept=".epub" @change="handleFileChange" required />
          </div>
          <div v-if="bookError" class="error">{{ bookError }}</div>
          <div v-if="bookSuccess" class="success">{{ bookSuccess }}</div>
          <button type="submit" :disabled="bookLoading">
            {{ bookLoading ? 'Adding...' : 'Add Book' }}
          </button>
        </form>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { bookAPI, authorAPI } from '@/api'
import type { Author, Book } from '@/types'

const authStore = useAuthStore()

const knownAuthors = ref<Author[]>([])
const authorsLoading = ref(false)
const copiedId = ref('')

const allBooks = ref<Book[]>([])
const booksLoading = ref(false)
const deletingBookId = ref('')
const deleteError = ref('')
const deleteSuccess = ref('')

const getAuthorName = (authorId: string): string => {
  const author = knownAuthors.value.find(a => a._id === authorId)
  return author ? `${author.firstName} ${author.lastName}` : 'Unknown'
}

const handleDeleteBook = async (bookId: string, bookTitle: string) => {
  if (!confirm(`Are you sure you want to delete "${bookTitle}"?`)) return

  deletingBookId.value = bookId
  deleteError.value = ''
  deleteSuccess.value = ''

  try {
    await bookAPI.delete(bookId)
    allBooks.value = allBooks.value.filter(b => b._id !== bookId)
    deleteSuccess.value = `Book "${bookTitle}" deleted successfully`
  } catch (err: any) {
    deleteError.value = err.response?.data?.message || 'Failed to delete book. Backend endpoint may not exist yet.'
  } finally {
    deletingBookId.value = ''
  }
}

onMounted(async () => {
  authorsLoading.value = true
  booksLoading.value = true
  try {
    const books = await bookAPI.getAll()
    allBooks.value = books
    const uniqueIds = [...new Set(books.map(b => b.authorId))]
    const authors = await Promise.all(
      uniqueIds.map(id => authorAPI.getById(id).catch(() => null))
    )
    knownAuthors.value = authors.filter((a): a is Author => a !== null)
  } catch {
    // silently fail — authors list is supplementary
  } finally {
    authorsLoading.value = false
    booksLoading.value = false
  }
})

const copyToClipboard = async (id: string) => {
  await navigator.clipboard.writeText(id)
  copiedId.value = id
  setTimeout(() => { copiedId.value = '' }, 1500)
}

const authorFirstName = ref('')
const authorLastName = ref('')
const authorLoading = ref(false)
const authorError = ref('')
const authorSuccess = ref('')

const handleAddAuthor = async () => {
  try {
    authorLoading.value = true
    authorError.value = ''
    authorSuccess.value = ''

    const author = await authorAPI.register({
      firstName: authorFirstName.value,
      lastName: authorLastName.value,
    })

    knownAuthors.value.push(author)
    authorSuccess.value = `Author "${author.firstName} ${author.lastName}" added (ID: ${author._id})`
    authorFirstName.value = ''
    authorLastName.value = ''
  } catch (err: any) {
    authorError.value = err.response?.data?.message || 'Failed to add author'
  } finally {
    authorLoading.value = false
  }
}

const bookTitle = ref('')
const bookAuthorId = ref('')
const bookYear = ref<number | null>(null)
const bookFile = ref<File | null>(null)
const bookLoading = ref(false)
const bookError = ref('')
const bookSuccess = ref('')

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  bookFile.value = target.files?.[0] ?? null
}

const handleAddBook = async () => {
  if (!bookFile.value) {
    bookError.value = 'Please select an EPUB file'
    return
  }

  try {
    bookLoading.value = true
    bookError.value = ''
    bookSuccess.value = ''

    const formData = new FormData()
    formData.append('title', bookTitle.value)
    formData.append('authorId', bookAuthorId.value)
    formData.append('yearPublished', String(bookYear.value))
    formData.append('epub', bookFile.value)

    const book = await bookAPI.register(formData)

    allBooks.value.push(book)
    bookSuccess.value = `Book "${book.title}" added (ID: ${book._id})`
    bookTitle.value = ''
    bookAuthorId.value = ''
    bookYear.value = null
    bookFile.value = null
  } catch (err: any) {
    bookError.value = err.response?.data?.message || 'Failed to add book'
  } finally {
    bookLoading.value = false
  }
}
</script>

<style scoped>
.admin-page {
  padding: 30px 0;
}

h1 {
  color: var(--color-accent);
  margin-bottom: 30px;
  font-size: 28px;
}

h2 {
  color: var(--color-accent);
  margin-bottom: 20px;
  font-size: 22px;
}

h3 {
  color: var(--color-text-primary);
  margin: 24px 0 15px;
  font-size: 18px;
  border-top: 2px solid var(--color-border);
  padding-top: 20px;
}

.admin-section {
  margin-bottom: 30px;
  max-width: 600px;
}

.admin-section:hover {
  transform: none;
  box-shadow: none;
}

.authors-list {
  margin-bottom: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th {
  text-align: left;
  padding: 10px 12px;
  color: var(--color-text-secondary);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--color-border);
}

td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

tr:last-child td {
  border-bottom: none;
}

.id-cell {
  font-family: monospace;
  font-size: 13px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-cell {
  white-space: nowrap;
  text-align: right;
}

.action-cell button {
  display: inline-block;
  margin-left: 6px;
  vertical-align: middle;
}

.use-btn {
  padding: 4px 10px;
  font-size: 12px;
  background-color: transparent;
  border: 1px solid var(--color-accent);
  color: var(--color-accent);
}

.copy-btn {
  padding: 4px 10px;
  font-size: 12px;
}

.books-list {
  margin-bottom: 10px;
  overflow-x: auto;
}

.delete-btn {
  padding: 4px 10px;
  font-size: 12px;
  background-color: var(--color-error);
  color: #ffffff;
}

.delete-btn:hover {
  background-color: #c53030;
}

.loading-text,
.empty-text {
  color: var(--color-text-secondary);
  padding: 10px 0;
  font-size: 14px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 6px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

input[type="file"] {
  padding: 8px;
}

button[type="submit"] {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  margin-top: 10px;
}
</style>
