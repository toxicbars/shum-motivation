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

  // Только проверенные сдачи
  const { data: submissions } = await supabase
    .from('submissions')
    .select(`
      id,
      submitted_at,
      tasks (
        title
      ),
      reviews (
        points,
        comment
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'reviewed')
    .order('submitted_at', { ascending: false })

  const list = submissions || []

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
        {list.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
            Пока нет проверенных заданий
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((sub: any) => {
              const review = sub.reviews?.[0]

              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">
                      {sub.tasks?.title || 'Задание'}
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700">
                      Проверено
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 mb-3">
                    Сдано: {new Date(sub.submitted_at).toLocaleString('ru-RU')}
                  </div>

                  {review && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="font-medium text-green-800">
                        {review.points} баллов
                      </div>
                      {review.comment && (
                        <p className="text-sm text-green-700 mt-1">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}