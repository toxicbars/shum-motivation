'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function SubmitForm({
  taskId,
  programId,
}: {
  taskId: string
  programId: string
}) {
  const [content, setContent] = useState('')
  const [links, setLinks] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Нужно войти')
      setLoading(false)
      return
    }

    const linksArray = links
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const { error: insertError } = await supabase.from('submissions').insert({
      task_id: taskId,
      user_id: user.id,
      content: content || null,
      links: linksArray,
      status: 'pending',
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setContent('')
    setLinks('')
    setLoading(false)
    router.refresh()
  }

  if (success) {
    return (
      <div className="bg-green-50 text-green-800 p-4 rounded-lg">
        Работа успешно отправлена на проверку!
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Текстовый ответ
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Опиши, что ты сделал..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ссылки (каждая с новой строки)
        </label>
        <textarea
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://disk.yandex.ru/...&#10;https://youtu.be/..."
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
        {loading ? 'Отправляем...' : 'Сдать задание'}
      </button>
    </form>
  )
}