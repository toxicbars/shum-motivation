import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

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
    <div className="min-h-screen bg-[#26264A] text-white relative overflow-hidden">
      {/* Декоративные элементы */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF1493] opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FF1493] opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/logo2.png"
              alt="ШУМ"
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </div>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-white/70 hover:text-white transition px-4 py-2 rounded-lg hover:bg-white/10">
              Выйти
            </button>
          </form>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Приветствие */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3">
            Привет, {profile?.full_name?.split(' ')[0] || 'участник'}!
          </h1>
          <p className="text-white/60 text-lg">
            Центр развития молодёжных медиа
          </p>
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-wrap gap-4 mb-14">
          <Link
            href="/dashboard/create-program"
            className="bg-[#FF1493] text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-[#ff2d9e] transition shadow-lg shadow-[#FF1493]/30 flex items-center gap-2"
          >
            <span className="text-xl">+</span> Создать программу
          </Link>
          <Link
            href="/dashboard/join"
            className="bg-white/10 border border-white/20 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-white/15 transition flex items-center gap-2"
          >
            Присоединиться по коду
          </Link>
        </div>

        {/* Список программ */}
        <div>
          <h2 className="text-xl font-semibold mb-5 text-white/90">Мои программы</h2>

          {programs.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-14 text-center">
              <div className="text-5xl mb-4 opacity-80">🚀</div>
              <p className="text-white/50 mb-1">Ты пока не состоишь ни в одной программе</p>
              <p className="text-sm text-white/30">Создай новую или присоединись по коду</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {programs.map((program) => (
                <Link
                  key={program.id}
                  href={`/program/${program.id}`}
                  className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-[#FF1493]/40 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg group-hover:text-[#FF1493] transition">
                      {program.title}
                    </h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        program.role === 'moderator'
                          ? 'bg-[#FF1493]/20 text-[#FF1493]'
                          : 'bg-white/10 text-white/70'
                      }`}
                    >
                      {program.role === 'moderator' ? 'Модератор' : 'Участник'}
                    </span>
                  </div>
                  {program.description && (
                    <p className="text-sm text-white/50 line-clamp-2">
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