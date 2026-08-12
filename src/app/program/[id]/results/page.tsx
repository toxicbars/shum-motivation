import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ResultsPage({
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

  // Проверяем, что пользователь — модератор
  const { data: membership } = await supabase
    .from('program_members')
    .select('role')
    .eq('program_id', programId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'moderator') {
    redirect(`/program/${programId}`)
  }

  // Получаем программу
  const { data: program } = await supabase
    .from('programs')
    .select('title')
    .eq('id', programId)
    .single()

  if (!program) notFound()

  // Получаем всех участников программы
  const { data: members } = await supabase
    .from('program_members')
    .select(`
      user_id,
      role,
      profiles (
        full_name
      )
    `)
    .eq('program_id', programId)
    .eq('role', 'participant')

  // Получаем все транзакции баллов
  const { data: transactions } = await supabase
    .from('point_transactions')
    .select('user_id, amount')
    .eq('program_id', programId)

  // Считаем баллы по каждому участнику
  const pointsMap: Record<string, number> = {}
  transactions?.forEach((t) => {
    pointsMap[t.user_id] = (pointsMap[t.user_id] || 0) + t.amount
  })

  // Собираем рейтинг
  const ranking = (members || [])
    .map((m: any) => ({
      userId: m.user_id,
      name: m.profiles?.full_name || 'Без имени',
      points: pointsMap[m.user_id] || 0,
    }))
    .sort((a, b) => b.points - a.points)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={`/program/${programId}`}
            className="text-gray-500 hover:text-gray-800"
          >
            ← Назад
          </Link>
          <h1 className="text-xl font-bold">Результаты — {program.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                  Место
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">
                  Участник
                </th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">
                  Баллы
                </th>
              </tr>
            </thead>
            <tbody>
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                    Пока нет участников
                  </td>
                </tr>
              ) : (
                ranking.map((person, index) => (
                  <tr
                    key={person.userId}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-gray-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {person.name}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-blue-600">
                      {person.points}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}