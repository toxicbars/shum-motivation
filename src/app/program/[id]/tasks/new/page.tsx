'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function NewTaskPage() {
  const params = useParams()
  const programId = params.id as string

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [maxPoints, setMaxPoints] = useState(10)
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

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

    const { error: insertError } = await supabase.from('tasks').insert({
      program_id: programId,
      title,
      description: description || null,
      max_points: maxPoints,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      created_by: user.id,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/program/${programId}`)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={`/program/${programId}`}
            className="text-gray-500 hover:text-gray-800"
          >
            ← Назад
          </Link>
          <h1 className="text-xl font-bold">Новое задание</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название задания *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: Снять видео-интервью"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Подробно опиши, что нужно сделать..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Максимум баллов *
                </label>
                <input
                  type="number"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(Number(e.target.value))}
                  required
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дедлайн
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
              {loading ? 'Создаём...' : 'Создать задание'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}