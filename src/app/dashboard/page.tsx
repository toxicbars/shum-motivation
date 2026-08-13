import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: memberships } = await supabase
    .from('program_members')
    .select('id, role, program_id')
    .eq('user_id', user.id)

  let programs: any[] = []

  if (memberships && memberships.length > 0) {
    const programIds = memberships.map((m) => m.program_id)

    const { data: programsData } = await supabase
      .from('programs')
      .select('*')
      .in('id', programIds)

    if (programsData) {
      programs = programsData.map((program) => {
        const membership = memberships.find((m) => m.program_id === program.id)
        return {
          ...program,
          role: membership?.role || 'participant',
        }
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#26264A] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-5 flex justify-between items-center">
          <div>
            <div className="text-2xl font-black tracking-tight">ШУМ</div>
            <div className="text-xs text-white/40 -mt-0.5">проект от росмолодёжь</div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-white/50 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/10">
              Выйти
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">
            Привет, {profile?.full_name?.split(' ')[0] || 'участник'}!
          </h1>
          <p className="text-white/50">
            Центр развития молодёжных медиа
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-12">
          <Link
            href="/dashboard/create-program"
            className="bg-[#FF1493] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#ff2d9e] transition"
          >
            + Создать программу
          </Link>
          <Link
            href="/dashboard/join"
            className="bg-white/10 border border-white/15 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/15 transition"
          >
            Присоединиться по коду
          </Link>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4 text-white/80">Мои программы</h2>

          {programs.length === 0 ? (
            <div className="bg-white/5 border border-dashed border-white/15 rounded-2xl p-12 text-center">
              <p className="text-white/40">Ты пока не состоишь ни в одной программе</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {programs.map((program) => (
                <Link
                  key={program.id}
                  href={`/program/${program.id}`}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#FF1493]/40 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{program.title}</h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        program.role === 'moderator'
                          ? 'bg-[#FF1493]/20 text-[#FF1493]'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {program.role === 'moderator' ? 'Модератор' : 'Участник'}
                    </span>
                  </div>
                  {program.description && (
                    <p className="text-sm text-white/40 line-clamp-2">
                      {program.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}