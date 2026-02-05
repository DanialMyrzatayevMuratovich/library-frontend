<template>
  <nav class="navbar">
    <div class="container">
      <div class="nav-content">
        <router-link to="/books" class="logo">
          <img src="/foto.png" alt="Library" class="logo-img" />
        </router-link>
        
        <div class="nav-links">
          <router-link to="/books">All Books</router-link>

          <template v-if="authStore.isAuthenticated">
            <router-link to="/my-books">
              My Books
              <span v-if="booksCount > 0" class="badge">{{ booksCount }}</span>
            </router-link>
            <router-link to="/favorites">
              Favorites
              <span v-if="favoritesCount > 0" class="badge favorites-badge">{{ favoritesCount }}</span>
            </router-link>
            <router-link v-if="authStore.isAdmin" to="/admin">Admin</router-link>

            <div class="user-section" ref="userSectionRef">
              <button class="user-toggle" @click="showDropdown = !showDropdown">
                {{ authStore.user?.information.firstName }} ▾
              </button>
              <div v-if="showDropdown" class="user-dropdown">
                <div class="dropdown-header">
                  <span class="user-name">{{ authStore.user?.information.firstName }} {{ authStore.user?.information.lastName }}</span>
                  <span class="user-email">{{ authStore.user?.credentials.email }}</span>
                  <span class="user-role">{{ authStore.isAdmin ? 'Admin' : 'User' }}</span>
                </div>
                <div class="dropdown-stats">
                  <span>{{ authStore.user?.ownedBooks?.length ?? 0 }} books owned</span>
                </div>
                <router-link to="/profile" class="dropdown-link">Profile</router-link>
                <button @click="handleLogout" class="logout-btn">Logout</button>
              </div>
            </div>
          </template>

          <template v-else-if="authStore.isGuest">
            <div class="user-section">
              <span class="guest-label">Guest</span>
              <router-link to="/login" class="sign-in-link">Sign In</router-link>
            </div>
          </template>

          <template v-else>
            <router-link to="/login">Sign In</router-link>
            <router-link to="/register">Sign Up</router-link>
          </template>

          <button class="theme-toggle" @click="themeStore.toggleTheme()" :title="themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'">
            {{ themeStore.isDark ? '☀️' : '🌙' }}
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useFavoritesStore } from '@/stores/favorites'
import { useThemeStore } from '@/stores/theme'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const favoritesStore = useFavoritesStore()
const themeStore = useThemeStore()
const router = useRouter()
const route = useRoute()
const showDropdown = ref(false)
const userSectionRef = ref<HTMLElement | null>(null)

const booksCount = computed(() => authStore.user?.ownedBooks?.length ?? 0)
const favoritesCount = computed(() => favoritesStore.favoritesCount)

// Load favorites when user data is available
watch(() => authStore.user, (user) => {
  if (user) {
    favoritesStore.loadFavorites()
  }
}, { immediate: true })

const onClickOutside = (e: MouseEvent) => {
  if (userSectionRef.value && !userSectionRef.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

watch(() => route.path, () => { showDropdown.value = false })

const handleLogout = () => {
  showDropdown.value = false
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  background-color: var(--color-navy);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 60px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: bold;
  color: var(--color-gold) !important;
  letter-spacing: 0.5px;
  text-decoration: none;
  opacity: 1 !important;
}

.logo:hover {
  color: var(--color-gold-light) !important;
}

.logo-img {
  height: 65px;
  width: auto;
  border-radius: 12px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-links a {
  font-weight: 500;
  font-size: 14px;
  color: var(--color-text-on-dark);
  opacity: 0.8;
  transition: opacity 0.2s, color 0.2s;
  padding: 8px 14px;
  border-radius: 6px;
  text-decoration: none;
}

.nav-links a:hover {
  opacity: 1;
  color: var(--color-gold-light);
}

.nav-links a.router-link-active {
  color: var(--color-gold);
  opacity: 1;
  background-color: rgba(200, 169, 81, 0.12);
}

.badge {
  display: inline-block;
  background-color: var(--color-gold);
  color: var(--color-navy-dark);
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 4px;
  vertical-align: middle;
}

.user-section {
  position: relative;
  padding-left: 16px;
  margin-left: 8px;
  border-left: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-toggle {
  padding: 7px 14px;
  font-size: 14px;
  background-color: rgba(200, 169, 81, 0.1);
  border: 1px solid rgba(200, 169, 81, 0.3);
  color: var(--color-gold-light);
  border-radius: 6px;
}

.user-toggle:hover {
  background-color: rgba(200, 169, 81, 0.2);
  border-color: var(--color-gold);
  color: var(--color-gold);
  box-shadow: none;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 15px;
  min-width: 220px;
  z-index: 200;
  box-shadow: var(--shadow-lg);
}

.dropdown-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

.user-name {
  font-weight: 600;
  color: var(--color-text-primary);
}

.user-email {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.user-role {
  font-size: 12px;
  color: var(--color-accent);
  font-weight: 500;
}

.dropdown-stats {
  padding: 10px 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
}

.logout-btn {
  width: 100%;
  margin-top: 10px;
  padding: 8px 16px;
  font-size: 14px;
}

.favorites-badge {
  background-color: #e53e3e;
  color: #ffffff;
}

.guest-label {
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  font-size: 14px;
}

.sign-in-link {
  font-size: 14px;
  padding: 6px 12px;
  border: 1px solid var(--color-gold);
  border-radius: 6px;
  color: var(--color-gold) !important;
  opacity: 1 !important;
}

.sign-in-link:hover {
  background-color: rgba(200, 169, 81, 0.15);
}

.theme-toggle {
  background: transparent;
  border: none;
  font-size: 18px;
  padding: 6px;
  cursor: pointer;
  line-height: 1;
  border-radius: 6px;
  transition: background-color 0.2s;
  margin-left: 4px;
}

.theme-toggle:hover {
  background-color: rgba(255, 255, 255, 0.1);
  box-shadow: none;
  transform: none;
}

.dropdown-link {
  display: block;
  padding: 8px 0;
  font-size: 14px;
  color: var(--color-text-primary) !important;
  opacity: 1 !important;
  border-bottom: 1px solid var(--color-border);
}

.dropdown-link:hover {
  color: var(--color-accent) !important;
}

@media (max-width: 768px) {
  .nav-content {
    flex-direction: column;
    gap: 12px;
    padding: 12px 0;
  }

  .nav-links {
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .user-section {
    padding-left: 0;
    border-left: none;
    margin-left: 0;
  }

  .logo {
    font-size: 20px;
  }
}
</style>