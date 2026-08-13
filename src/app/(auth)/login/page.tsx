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
        setError('Почта ещё не подтверждена. Проверьте письмо.')
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
      setError('Сначала введите email')
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
    <div className="min-h-screen bg-[#26264A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl font-black text-white mb-1">ШУМ</div>
          <p className="text-white/50 text-sm">проект от росмолодёжь</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-6">Вход</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#FF1493]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#FF1493]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-[#FF1493] text-sm bg-[#FF1493]/10 p-3 rounded-xl">
                {error}
              </div>
            )}

            {message && (
              <div className="text-green-400 text-sm bg-green-400/10 p-3 rounded-xl">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF1493] text-white py-3.5 rounded-xl font-semibold disabled:opacity-50"
            >
              {loading ? 'Входим...' : 'Войти'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-white/50 hover:text-[#FF1493]"
            >
              Забыли пароль?
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-white/50">
          Ещё нет аккаунта?{' '}
          <Link href="/register" className="text-[#FF1493] font-medium underline">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  )
}