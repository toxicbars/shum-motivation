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

  // Получаем профиль
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Сначала получаем членства пользователя
  const { data: memberships, error: membershipsError } = await supabase
    .from('program_members')
    .select('id, role, program_id')
    .eq('user_id', user.id)

  console.log('memberships:', memberships)
  console.log('membershipsError:', membershipsError)

  // Потом получаем программы по id
  let programs: any[] = []

  if (memberships && memberships.length > 0) {
    const programIds = memberships.map((m) => m.program_id)

    const { data: programsData, error: programsError } = await supabase
      .from('programs')
      .select('*')
      .in('id', programIds)

    console.log('programsData:', programsData)
    console.log('programsError:', programsError)

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">ШУМ — Мотивация</h1>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-gray-600 hover:text-gray-900">
              Выйти
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">
            Привет, {profile?.full_name || 'участник'}!
          </h2>
          <p className="text-gray-600">Выбери программу или создай новую</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-10">
          <Link
            href="/dashboard/create-program"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            + Создать программу
          </Link>
          <Link
            href="/dashboard/join"
            className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Присоединиться по коду
          </Link>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Мои программы</h3>

          {programs.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
              Ты пока не состоишь ни в одной программе
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {programs.map((program) => (
                <Link
                  key={program.id}
                  href={`/program/${program.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg">{program.title}</h4>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        program.role === 'moderator'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {program.role === 'moderator' ? 'Модератор' : 'Участник'}
                    </span>
                  </div>
                  {program.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
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