<template>
  <div class="login-page">
    <div class="login-card card">
      <h1>Sign In</h1>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" required placeholder="example@email.com" />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" required placeholder="••••••••" />
        </div>

        <div class="error" v-if="authStore.error">{{ authStore.error }}</div>

        <button type="submit" :disabled="authStore.isLoading">
          {{ authStore.isLoading ? 'Loading...' : 'Sign In' }}
        </button>
      </form>

      <p class="register-link">
        Don't have an account? <router-link to="/register">Sign Up</router-link>
      </p>

      <div class="divider">
        <span>or</span>
      </div>

      <button class="guest-btn" @click="handleGuestLogin">
        Continue as Guest
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')

const handleGuestLogin = () => {
  authStore.loginAsGuest()
  router.push('/books')
}

const handleLogin = async () => {
  const success = await authStore.login({
    email: email.value,
    password: password.value
  })
  
  if (success) {
    router.push('/books')
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-card {
  max-width: 450px;
  width: 100%;
}

h1 {
  color: var(--color-accent);
  margin-bottom: 30px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

button[type="submit"] {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  margin-top: 10px;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  color: var(--color-text-secondary);
}

.divider {
  text-align: center;
  margin: 20px 0;
  position: relative;
  color: var(--color-text-secondary);
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background-color: var(--color-border);
}

.divider::before { left: 0; }
.divider::after { right: 0; }

.guest-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.guest-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>