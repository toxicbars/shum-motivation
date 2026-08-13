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

  const { data: membership } = await supabase
    .from('program_members')
    .select('role')
    .eq('program_id', programId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'moderator') {
    redirect(`/program/${programId}`)
  }

  const { data: program } = await supabase
    .from('programs')
    .select('title')
    .eq('id', programId)
    .single()

  if (!program) notFound()

  const { data: members } = await supabase
    .from('program_members')
    .select(`
      user_id,
      role,
      profiles (full_name)
    `)
    .eq('program_id', programId)
    .eq('role', 'participant')

  const { data: transactions } = await supabase
    .from('point_transactions')
    .select('user_id, amount')
    .eq('program_id', programId)

  const pointsMap: Record<string, number> = {}
  transactions?.forEach((t) => {
    pointsMap[t.user_id] = (pointsMap[t.user_id] || 0) + t.amount
  })

  const ranking = (members || [])
    .map((m: any) => ({
      userId: m.user_id,
      name: m.profiles?.full_name || 'Без имени',
      points: pointsMap[m.user_id] || 0,
    }))
    .sort((a, b) => b.points - a.points)

  return (
    <div className="min-h-screen bg-[#26264A] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/program/${programId}`} className="text-white/50 hover:text-white">
            ← Назад
          </Link>
          <h1 className="text-xl font-bold">Результаты — {program.title}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white/50">Место</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-white/50">Участник</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-white/50">Баллы</th>
              </tr>
            </thead>
            <tbody>
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-white/40">
                    Пока нет участников
                  </td>
                </tr>
              ) : (
                ranking.map((person, index) => (
                  <tr key={person.userId} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                    <td className="px-6 py-4 text-white/50 font-medium w-20">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {person.name}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-[#FF1493]">
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