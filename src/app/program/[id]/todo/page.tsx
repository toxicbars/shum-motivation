import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TodoPage({
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

  // Все задания программы
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('program_id', programId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  // Какие задания пользователь уже сдавал (хотя бы раз)
  const { data: mySubmissions } = await supabase
    .from('submissions')
    .select('task_id')
    .eq('user_id', user.id)

  const submittedIds = new Set(mySubmissions?.map((s) => s.task_id) || [])

  // Только те, которые ещё ни разу не сдавал
  const todoTasks = (allTasks || []).filter(
    (task) => !submittedIds.has(task.id)
  )

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
          <h1 className="text-xl font-bold">Невыполненные задания</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {todoTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
            Все задания уже сданы!
          </div>
        ) : (
          <div className="space-y-3">
            {todoTasks.map((task) => {
              const isExpired =
                task.deadline && new Date(task.deadline) < new Date()

              return (
                <Link
                  key={task.id}
                  href={`/program/${programId}/tasks/${task.id}`}
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
      </main>
    </div>
  )
}