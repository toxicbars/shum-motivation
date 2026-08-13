import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { SupportChat } from '../support-chat'

export default async function SupportUserPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>
}) {
  const { id: programId, userId } = await params
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  if (!profile) notFound()

  const { data: messages } = await supabase
    .from('support_messages')
    .select('*')
    .eq('program_id', programId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-[#26264A] text-white flex flex-col">
      <header className="border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={`/program/${programId}/support`}
            className="text-white/50 hover:text-white"
          >
            ← Назад
          </Link>
          <h1 className="text-xl font-bold truncate">
            {profile.full_name || 'Участник'}
          </h1>
        </div>
      </header>

      <SupportChat
        programId={programId}
        userId={userId}
        initialMessages={messages || []}
        isModerator={true}
      />
    </div>
  )
}