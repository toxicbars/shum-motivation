'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function CreateProgramPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleCreate = async (e: React.FormEvent) => {
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

    const inviteCode = generateInviteCode()

    // Создаём программу
    const { data: program, error: programError } = await supabase
      .from('programs')
      .insert({
        title,
        description,
        invite_code: inviteCode,
        created_by: user.id,
      })
      .select()
      .single()

    if (programError) {
      setError(programError.message)
      setLoading(false)
      return
    }

    // Добавляем создателя как модератора
    const { error: memberError } = await supabase
      .from('program_members')
      .insert({
        program_id: program.id,
        user_id: user.id,
        role: 'moderator',
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
          <h1 className="text-xl font-bold">Создать программу</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название программы *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: Медиа-смена август 2026"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Кратко опиши программу..."
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
              {loading ? 'Создаём...' : 'Создать программу'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}