'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type AuthContextType = {
  isLoggedIn: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('token')) setIsLoggedIn(true)
  }, [])

  const login = (token: unknown) => {
    localStorage.setItem('token', token as string)
    setIsLoggedIn(true)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
