'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 6) {
      setError('Пароль должен быть не меньше 6 символов')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Этот email уже зарегистрирован. Попробуйте войти.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    if (data.user && !data.session) {
      setSuccess(true)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#26264A] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-white mb-3">Проверьте почту</h1>
          <p className="text-white/60 mb-6">
            Мы отправили письмо на <strong className="text-white">{email}</strong>.
            <br />
            Перейдите по ссылке, чтобы подтвердить аккаунт.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#FF1493] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#ff2d9e] transition"
          >
            Перейти ко входу
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#26264A] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF1493] opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#FF1493] opacity-10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/logo2.png"
            alt="ШУМ"
            width={160}
            height={50}
            className="h-12 w-auto mx-auto object-contain mb-4"
          />
          <p className="text-white/50 text-sm">Центр развития молодёжных медиа</p>
        </div>

        <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-6">Регистрация</h1>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                ФИО
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF1493] transition"
                placeholder="Иванов Иван Иванович"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF1493] transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF1493] transition"
                placeholder="Минимум 6 символов"
              />
            </div>

            {error && (
              <div className="text-[#FF1493] text-sm bg-[#FF1493]/10 border border-[#FF1493]/20 p-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF1493] text-white py-3.5 rounded-xl font-semibold hover:bg-[#ff2d9e] disabled:opacity-50 transition shadow-lg shadow-[#FF1493]/25"
            >
              {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-white/50">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-[#FF1493] hover:underline font-medium">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}