import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .single()

  if (!program) {
    notFound()
  }

  const { data: membership } = await supabase
    .from('program_members')
    .select('*')
    .eq('program_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/dashboard')
  }

  const isModerator = membership.role === 'moderator'

  // Баллы участника
  const { data: transactions } = await supabase
    .from('point_transactions')
    .select('amount')
    .eq('program_id', id)
    .eq('user_id', user.id)

  const totalPoints =
    transactions?.reduce((sum, t) => sum + t.amount, 0) || 0

  // Для модератора — список заданий
  let tasks: any[] = []
  if (isModerator) {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('program_id', id)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
    tasks = data || []
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-800">
              ← Назад
            </Link>
            <h1 className="text-xl font-bold">{program.title}</h1>
          </div>
          <div className="text-sm">
            {isModerator ? (
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                Модератор
              </span>
            ) : (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                {totalPoints} баллов
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Блок для модератора */}
        {isModerator && (
          <>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-5 mb-8">
              <h2 className="font-semibold text-purple-900 mb-2">
                Код приглашения
              </h2>
              <div className="flex items-center gap-3">
                <code className="text-2xl font-mono tracking-widest bg-white px-4 py-2 rounded-lg border">
                  {program.invite_code}
                </code>
                <span className="text-sm text-purple-700">
                  Отправь этот код участникам
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Задания</h2>
              <Link
                href={`/program/${id}/tasks/new`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                + Добавить задание
              </Link>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                Пока нет ни одного задания
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const isExpired =
                    task.deadline && new Date(task.deadline) < new Date()

                  return (
                    <Link
                      key={task.id}
                      href={`/program/${id}/tasks/${task.id}`}
                      className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium text-blue-600">
                            до {task.max_points} баллов
                          </div>
                          {task.deadline && (
                            <div
                              className={`mt-1 ${
                                isExpired ? 'text-red-500' : 'text-gray-500'
                              }`}
                            >
                              {isExpired
                                ? 'Дедлайн прошёл'
                                : `до ${new Date(task.deadline).toLocaleString('ru-RU')}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Блок для участника — две большие кнопки */}
        {!isModerator && (
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto mt-6">
            <Link
              href={`/program/${id}/todo`}
              className="bg-white border-2 border-blue-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:shadow-md transition"
            >
              <div className="text-4xl mb-3">📝</div>
              <div className="text-xl font-bold text-gray-900">
                Невыполненные задания
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Задания, которые ещё нужно сдать
              </p>
            </Link>

            <Link
              href={`/program/${id}/done`}
              className="bg-white border-2 border-green-200 rounded-2xl p-8 text-center hover:border-green-400 hover:shadow-md transition"
            >
              <div className="text-4xl mb-3">✅</div>
              <div className="text-xl font-bold text-gray-900">
                Выполненные задания
              </div>
              <p className="text-sm text-gray-500 mt-2">
                То, что уже сдано и проверено
              </p>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}