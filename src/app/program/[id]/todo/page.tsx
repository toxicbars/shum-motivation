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

  const { data: allTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('program_id', programId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  const { data: mySubmissions } = await supabase
    .from('submissions')
    .select('task_id')
    .eq('user_id', user.id)

  const submittedIds = new Set(mySubmissions?.map((s) => s.task_id) || [])
  const todoTasks = (allTasks || []).filter((task) => !submittedIds.has(task.id))

  return (
    <div className="min-h-screen bg-[#26264A] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/program/${programId}`} className="text-white/50 hover:text-white">
            ← Назад
          </Link>
          <h1 className="text-xl font-bold">Невыполненные задания</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {todoTasks.length === 0 ? (
          <div className="bg-white/5 border border-dashed border-white/15 rounded-2xl p-12 text-center text-white/40">
            Все задания уже сданы!
          </div>
        ) : (
          <div className="space-y-3">
            {todoTasks.map((task) => {
              const isExpired = task.deadline && new Date(task.deadline) < new Date()
              return (
                <Link
                  key={task.id}
                  href={`/program/${programId}/tasks/${task.id}`}
                  className="block bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-[#FF1493]/30 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-white/40 mt-1 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium text-[#FF1493]">до {task.max_points} баллов</div>
                      {task.deadline && (
                        <div className={`mt-1 ${isExpired ? 'text-red-400' : 'text-white/40'}`}>
                          {isExpired ? 'Дедлайн прошёл' : `до ${new Date(task.deadline).toLocaleString('ru-RU')}`}
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