import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DonePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: programId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('program_members')
    .select('role')
    .eq('program_id', programId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role === 'moderator') {
    redirect(`/program/${programId}`)
  }

  // Получаем все сдачи пользователя
  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id,
      status,
      submitted_at,
      task_id,
      tasks (
        id,
        title,
        max_points
      ),
      reviews (
        points,
        comment
      )
    `)
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false })

  // Группируем по заданиям (берём последнюю сдачу по каждому заданию)
  const taskMap = new Map()

  submissions?.forEach((sub: any) => {
    if (!sub.tasks) return
    const taskId = sub.task_id

    if (!taskMap.has(taskId)) {
      taskMap.set(taskId, {
        task: sub.tasks,
        submissions: [],
      })
    }
    taskMap.get(taskId).submissions.push(sub)
  })

  const items = Array.from(taskMap.values()).map((item: any) => {
    const subs = item.submissions
    const lastSub = subs[0] // самая новая
    const review = lastSub.reviews?.[0]
    const isReviewed = lastSub.status === 'reviewed' && review
    const attempts = subs.length

    // Можно пересдать: ровно 1 попытка + проверена + баллов меньше половины
    const canRedo =
      attempts === 1 &&
      isReviewed &&
      review.points < item.task.max_points / 2

    return {
      task: item.task,
      lastSub,
      review,
      isReviewed,
      attempts,
      canRedo,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={`/program/${programId}`}
            className="text-gray-500 hover:text-gray-800"
          >
            ← Назад
          </Link>
          <h1 className="text-xl font-bold">Выполненные задания</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
            Ты ещё ничего не сдавал
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.task.id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{item.task.title}</h3>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      item.canRedo
                        ? 'bg-yellow-100 text-yellow-700'
                        : item.isReviewed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {item.canRedo
                      ? 'Можно пересдать'
                      : item.isReviewed
                      ? 'Проверено'
                      : 'На проверке'}
                  </span>
                </div>

                <div className="text-sm text-gray-500 mb-3">
                  Попыток: {item.attempts} · Сдано:{' '}
                  {new Date(item.lastSub.submitted_at).toLocaleString('ru-RU')}
                </div>

                {item.isReviewed && item.review && (
                  <div className="bg-green-50 rounded-lg p-4 mb-3">
                    <div className="font-medium text-green-800">
                      {item.review.points} баллов
                    </div>
                    {item.review.comment && (
                      <p className="text-sm text-green-700 mt-1">
                        {item.review.comment}
                      </p>
                    )}
                  </div>
                )}

                {!item.isReviewed && (
                  <div className="text-sm text-blue-700 bg-blue-50 rounded-lg p-3 mb-3">
                    Модератор ещё не проверил эту работу
                  </div>
                )}

                {item.canRedo && (
                  <Link
                    href={`/program/${programId}/tasks/${item.task.id}`}
                    className="block w-full text-center bg-yellow-500 text-white py-2.5 rounded-lg font-medium hover:bg-yellow-600 transition"
                  >
                    Пересдать задание
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}