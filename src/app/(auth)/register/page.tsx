'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

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

    // Если подтверждение почты включено
    if (data.user && !data.session) {
      setSuccess(true)
      setLoading(false)
      return
    }

    // Если подтверждение отключено — сразу входим
    router.push('/dashboard')
    router.refresh()
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold mb-3">Проверьте почту</h1>
          <p className="text-gray-600 mb-6">
            Мы отправили письмо на <strong>{email}</strong>.
            <br />
            Перейдите по ссылке в письме, чтобы подтвердить аккаунт.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Не пришло письмо? Проверьте папку «Спам».
          </p>
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Перейти ко входу
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Регистрация</h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Создайте аккаунт, чтобы участвовать в программах
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ФИО
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Иванов Иван Иванович"
            />
          </div>

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
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Минимум 6 символов"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}