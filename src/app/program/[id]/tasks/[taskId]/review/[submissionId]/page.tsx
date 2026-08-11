'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function ReviewPage() {
  const params = useParams()
  const programId = params.id as string
  const taskId = params.taskId as string
  const submissionId = params.submissionId as string

  const [submission, setSubmission] = useState<any>(null)
  const [points, setPoints] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [maxPoints, setMaxPoints] = useState(10)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: sub } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles (full_name),
          tasks (title, max_points)
        `)
        .eq('id', submissionId)
        .single()

      if (sub) {
        setSubmission(sub)
        setMaxPoints(sub.tasks?.max_points || 10)
        setPoints(sub.tasks?.max_points || 10)
      }
    }
    load()
  }, [submissionId])

  const handleReview = async (e: React.FormEvent) => {
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

    // 1. Создаём review
    const { error: reviewError } = await supabase.from('reviews').insert({
      submission_id: submissionId,
      reviewer_id: user.id,
      points,
      comment: comment || null,
    })

    if (reviewError) {
      setError(reviewError.message)
      setLoading(false)
      return
    }

    // 2. Обновляем статус сдачи
    await supabase
      .from('submissions')
      .update({ status: 'reviewed' })
      .eq('id', submissionId)

    // 3. Начисляем баллы
    const { error: pointsError } = await supabase
      .from('point_transactions')
      .insert({
        program_id: programId,
        user_id: submission.user_id,
        amount: points,
        reason: `Задание: ${submission.tasks?.title || 'без названия'}`,
        related_submission_id: submissionId,
        created_by: user.id,
      })

    if (pointsError) {
      setError(pointsError.message)
      setLoading(false)
      return
    }

    router.push(`/program/${programId}/tasks/${taskId}`)
    router.refresh()
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Загрузка...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={`/program/${programId}/tasks/${taskId}`}
            className="text-gray-500 hover:text-gray-800"
          >
            ← Назад
          </Link>
          <h1 className="text-xl font-bold">Проверка работы</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Информация о сдаче */}
        <div className="bg-white rounded-xl border p-6">
          <div className="text-sm text-gray-500 mb-1">Участник</div>
          <div className="font-semibold text-lg mb-4">
            {submission.profiles?.full_name || 'Без имени'}
          </div>

          {submission.content && (
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-1">Ответ</div>
              <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {submission.content}
              </div>
            </div>
          )}

          {submission.links && submission.links.length > 0 && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Ссылки</div>
              <ul className="space-y-1">
                {submission.links.map((link: string, i: number) => (
                  <li key={i}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Форма оценки */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Оценка</h2>

          <form onSubmit={handleReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Баллы (максимум {maxPoints})
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                min={0}
                max={maxPoints}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Комментарий
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Напиши обратную связь участнику..."
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
              className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              {loading ? 'Сохраняем...' : 'Поставить оценку'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}