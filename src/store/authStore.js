import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      usuario: null,

      setAuth: (token, usuario) => set({ token, usuario }),
      logout: () => {
        set({ token: null, usuario: null })
        window.location.href = '/dashboard/login'
      },
    }),
    { name: 'auth-storage' }
  )
)
