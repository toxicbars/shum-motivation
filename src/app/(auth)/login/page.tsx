'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Неверный email или пароль. Если вы ещё не регистрировались — сначала создайте аккаунт.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Почта ещё не подтверждена. Проверьте письмо и перейдите по ссылке.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Сначала введите email, на который зарегистрирован аккаунт')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Мы отправили письмо для сброса пароля. Проверьте почту.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Вход</h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Войдите в свой аккаунт
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {message && (
            <div className="text-green-700 text-sm bg-green-50 p-3 rounded-lg">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-blue-600 hover:underline"
          >
            Забыли пароль?
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Ещё нет аккаунта?{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}