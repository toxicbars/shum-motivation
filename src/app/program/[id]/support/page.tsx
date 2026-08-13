import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SupportChat } from './support-chat'

export default async function SupportPage({
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

  if (!membership) redirect('/dashboard')

  const isModerator = membership.role === 'moderator'

  // ===== МОДЕРАТОР: список обращений =====
  if (isModerator) {
    // Получаем все сообщения программы
    const { data: messages } = await supabase
      .from('support_messages')
      .select(`
        id,
        user_id,
        content,
        is_moderator,
        created_at,
        profiles!support_messages_user_id_fkey (full_name)
      `)
      .eq('program_id', programId)
      .order('created_at', { ascending: false })

    // Группируем по участникам
    const conversationsMap = new Map()

    messages?.forEach((msg: any) => {
      if (!conversationsMap.has(msg.user_id)) {
        conversationsMap.set(msg.user_id, {
          userId: msg.user_id,
          name: msg.profiles?.full_name || 'Без имени',
          lastMessage: msg.content,
          lastAt: msg.created_at,
          isFromModerator: msg.is_moderator,
        })
      }
    })

    const conversations = Array.from(conversationsMap.values())

    return (
      <div className="min-h-screen bg-[#26264A] text-white">
        <header className="border-b border-white/10">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link href={`/program/${programId}`} className="text-white/50 hover:text-white">
              ← Назад
            </Link>
            <h1 className="text-xl font-bold">Обращения в поддержку</h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          {conversations.length === 0 ? (
            <div className="bg-white/5 border border-dashed border-white/15 rounded-2xl p-12 text-center text-white/40">
              Пока нет ни одного обращения
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <Link
                  key={conv.userId}
                  href={`/program/${programId}/support/${conv.userId}`}
                  className="block bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-[#FF1493]/30 transition"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-semibold">{conv.name}</div>
                    <div className="text-xs text-white/40">
                      {new Date(conv.lastAt).toLocaleString('ru-RU')}
                    </div>
                  </div>
                  <p className="text-sm text-white/50 line-clamp-1">
                    {conv.isFromModerator ? 'Вы: ' : ''}
                    {conv.lastMessage}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  // ===== УЧАСТНИК: свой чат =====
  const { data: messages } = await supabase
    .from('support_messages')
    .select('*')
    .eq('program_id', programId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-[#26264A] text-white flex flex-col">
      <header className="border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/program/${programId}`} className="text-white/50 hover:text-white">
            ← Назад
          </Link>
          <h1 className="text-xl font-bold">Поддержка</h1>
        </div>
      </header>

      <SupportChat
        programId={programId}
        userId={user.id}
        initialMessages={messages || []}
        isModerator={false}
      />
    </div>
  )
}