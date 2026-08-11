'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function JoinProgramPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Нужно войти в аккаунт')
      setLoading(false)
      return
    }

    // Ищем программу по коду
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('invite_code', code.trim().toUpperCase())
      .eq('is_active', true)
      .single()

    if (programError || !program) {
      setError('Программа с таким кодом не найдена')
      setLoading(false)
      return
    }

    // Проверяем, не состоит ли уже пользователь в программе
    const { data: existing } = await supabase
      .from('program_members')
      .select('id')
      .eq('program_id', program.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      router.push(`/program/${program.id}`)
      return
    }

    // Добавляем как участника
    const { error: memberError } = await supabase
      .from('program_members')
      .insert({
        program_id: program.id,
        user_id: user.id,
        role: 'participant',
      })

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    router.push(`/program/${program.id}`)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-800">
            ← Назад
          </Link>
          <h1 className="text-xl font-bold">Присоединиться к программе</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <p className="text-gray-600 mb-6">
            Введите код приглашения, который вам дали организаторы.
          </p>

          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Код приглашения
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-widest text-center text-lg"
                placeholder="ABC123"
                maxLength={10}
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
              {loading ? 'Присоединяемся...' : 'Присоединиться'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}