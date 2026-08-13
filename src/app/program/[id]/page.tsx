import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { CopyInviteCode } from './copy-invite-code'

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

  if (!user) redirect('/login')

  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .single()

  if (!program) notFound()

  const { data: membership } = await supabase
    .from('program_members')
    .select('*')
    .eq('program_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const isModerator = membership.role === 'moderator'

  const { data: transactions } = await supabase
    .from('point_transactions')
    .select('amount')
    .eq('program_id', id)
    .eq('user_id', user.id)

  const totalPoints = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0

  let tasks: any[] = []
  let unreviewedCount = 0

  if (isModerator) {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('program_id', id)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
    tasks = data || []

    const { count } = await supabase
      .from('submissions')
      .select('*, tasks!inner(program_id)', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('tasks.program_id', id)

    unreviewedCount = count || 0
  }

  return (
    <div className="min-h-screen bg-[#26264A] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-white/50 hover:text-white transition">
              ← Назад
            </Link>
            <h1 className="text-xl font-bold truncate">{program.title}</h1>
          </div>
          <div>
            {isModerator ? (
              <span className="bg-[#FF1493]/20 text-[#FF1493] px-3 py-1.5 rounded-full text-sm font-medium">
                Модератор
              </span>
            ) : (
              <span className="bg-[#FF1493] text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                {totalPoints} {totalPoints === 1 ? 'балл' : totalPoints < 5 ? 'балла' : 'баллов'}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {isModerator && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <h2 className="font-semibold mb-3">Код приглашения</h2>
              <div className="flex flex-wrap items-center gap-3">
                <code className="text-2xl font-mono tracking-widest bg-[#FF1493]/10 text-[#FF1493] px-5 py-2.5 rounded-xl border border-[#FF1493]/20">
                  {program.invite_code}
                </code>
                <CopyInviteCode code={program.invite_code} />
              </div>
              <p className="text-sm text-white/40 mt-3">Отправь этот код участникам</p>
            </div>

            {unreviewedCount > 0 && (
              <div className="bg-[#FF1493]/10 border border-[#FF1493]/25 text-[#FF1493] rounded-xl px-5 py-3 mb-6">
                Есть <strong>{unreviewedCount}</strong>{' '}
                {unreviewedCount === 1 ? 'работа' : unreviewedCount < 5 ? 'работы' : 'работ'} на проверке
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Задания</h2>
              <div className="flex gap-2">
                <Link
                  href={`/program/${id}/support`}
                  className="bg-white/10 border border-white/15 px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/15 transition"
                >
                  Поддержка
                </Link>
                <Link
                  href={`/program/${id}/results`}
                  className="bg-white/10 border border-white/15 px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/15 transition"
                >
                  Результаты
                </Link>
                <Link
                  href={`/program/${id}/tasks/new`}
                  className="bg-[#FF1493] px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#ff2d9e] transition"
                >
                  + Добавить задание
                </Link>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-white/5 border border-dashed border-white/15 rounded-2xl p-12 text-center text-white/40">
                Пока нет ни одного задания
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const isExpired = task.deadline && new Date(task.deadline) < new Date()
                  return (
                    <Link
                      key={task.id}
                      href={`/program/${id}/tasks/${task.id}`}
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
          </>
        )}

        {!isModerator && (
          <div className="grid gap-5 sm:grid-cols-3 max-w-3xl mx-auto mt-6">
            <Link
              href={`/program/${id}/todo`}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 hover:border-[#FF1493]/40 transition"
            >
              <div className="text-4xl mb-3">📝</div>
              <div className="text-xl font-bold mb-1">Невыполненные</div>
              <p className="text-sm text-white/40">Задания, которые ещё нужно сдать</p>
            </Link>

            <Link
              href={`/program/${id}/done`}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 hover:border-[#FF1493]/40 transition"
            >
              <div className="text-4xl mb-3">✅</div>
              <div className="text-xl font-bold mb-1">Выполненные</div>
              <p className="text-sm text-white/40">Сданные и проверенные работы</p>
            </Link>

            <Link
              href={`/program/${id}/support`}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 hover:border-[#FF1493]/40 transition"
            >
              <div className="text-4xl mb-3">💬</div>
              <div className="text-xl font-bold mb-1">Поддержка</div>
              <p className="text-sm text-white/40">Задать вопрос модераторам</p>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}