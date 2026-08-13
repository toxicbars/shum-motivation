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
  const [files, setFiles] = useState<any[]>([])
  const [points, setPoints] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [maxPoints, setMaxPoints] = useState(10)
  const [isRedo, setIsRedo] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: sub } = await supabase
        .from('submissions')
        .select(`*, profiles (full_name), tasks (title, max_points)`)
        .eq('id', submissionId)
        .single()

      if (sub) {
        setSubmission(sub)
        setMaxPoints(sub.tasks?.max_points || 10)
        setPoints(sub.tasks?.max_points || 10)

        const { count } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('task_id', taskId)
          .eq('user_id', sub.user_id)

        setIsRedo((count || 0) > 1)
      }

      const { data: filesData } = await supabase
        .from('submission_files')
        .select('*')
        .eq('submission_id', submissionId)

      setFiles(filesData || [])
    }
    load()
  }, [submissionId, taskId])

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from('submissions').getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !submission) {
      setError('Ошибка авторизации')
      setLoading(false)
      return
    }

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

    await supabase.from('submissions').update({ status: 'reviewed' }).eq('id', submissionId)

    if (isRedo) {
      const { data: oldSubs } = await supabase
        .from('submissions')
        .select('id')
        .eq('task_id', taskId)
        .eq('user_id', submission.user_id)

      if (oldSubs && oldSubs.length > 0) {
        const oldIds = oldSubs.map((s) => s.id)
        await supabase
          .from('point_transactions')
          .delete()
          .eq('program_id', programId)
          .eq('user_id', submission.user_id)
          .in('related_submission_id', oldIds)
      }
    }

    const { error: pointsError } = await supabase.from('point_transactions').insert({
      program_id: programId,
      user_id: submission.user_id,
      amount: points,
      reason: `Задание: ${submission.tasks?.title || 'без названия'}${isRedo ? ' (пересдача)' : ''}`,
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
      <div className="min-h-screen bg-[#26264A] flex items-center justify-center text-white">
        Загрузка...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#26264A] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/program/${programId}/tasks/${taskId}`} className="text-white/50 hover:text-white">
            ← Назад
          </Link>
          <h1 className="text-xl font-bold">{isRedo ? 'Повторная проверка' : 'Проверка работы'}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {isRedo && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded-xl text-sm">
            Это повторная сдача. Новая оценка заменит предыдущую.
          </div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="text-sm text-white/40 mb-1">Участник</div>
          <div className="font-semibold text-lg mb-4">{submission.profiles?.full_name || 'Без имени'}</div>

          {submission.content && (
            <div className="mb-4">
              <div className="text-sm text-white/40 mb-1">Ответ</div>
              <div className="whitespace-pre-wrap bg-white/5 p-4 rounded-xl">{submission.content}</div>
            </div>
          )}

          {submission.links?.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-white/40 mb-1">Ссылки</div>
              <ul className="space-y-1">
                {submission.links.map((link: string, i: number) => (
                  <li key={i}>
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-[#FF1493] hover:underline break-all">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {files.length > 0 && (
            <div>
              <div className="text-sm text-white/40 mb-2">Прикреплённые файлы</div>
              <div className="space-y-2">
                {files.map((file) => (
                  <a
                    key={file.id}
                    href={getFileUrl(file.file_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition"
                  >
                    <span className="text-2xl">{file.mime_type?.startsWith('image/') ? '🖼️' : '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{file.file_name}</div>
                      <div className="text-xs text-white/40">
                        {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} МБ` : ''}
                      </div>
                    </div>
                    <span className="text-[#FF1493] text-sm">Открыть</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Оценка</h2>
          <form onSubmit={handleReview} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Баллы (максимум {maxPoints})</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                min={0}
                max={maxPoints}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#FF1493]"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Комментарий</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#FF1493]"
                placeholder="Напиши обратную связь участнику..."
              />
            </div>
            {error && (
              <div className="text-[#FF1493] text-sm bg-[#FF1493]/10 p-3 rounded-xl">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF1493] text-white py-3.5 rounded-xl font-semibold hover:bg-[#ff2d9e] disabled:opacity-50 transition"
            >
              {loading ? 'Сохраняем...' : isRedo ? 'Поставить новую оценку' : 'Поставить оценку'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}