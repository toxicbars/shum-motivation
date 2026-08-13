'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

type Member = {
  user_id: string
  role: string
  profiles: { full_name: string } | null
}

export default function MembersPage() {
  const params = useParams()
  const programId = params.id as string
  const router = useRouter()
  const supabase = createClient()

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const loadMembers = async () => {
    const { data } = await supabase
      .from('program_members')
      .select(`
        user_id,
        role,
        profiles (full_name)
      `)
      .eq('program_id', programId)
      .order('role', { ascending: false })

    setMembers((data as any) || [])
    setLoading(false)
  }

  useEffect(() => {
    loadMembers()
  }, [programId])

  const makeModerator = async (userId: string) => {
    setUpdating(userId)

    const { error } = await supabase
      .from('program_members')
      .update({ role: 'moderator' })
      .eq('program_id', programId)
      .eq('user_id', userId)

    if (!error) {
      await loadMembers()
    }

    setUpdating(null)
  }

  const makeParticipant = async (userId: string) => {
    setUpdating(userId)

    const { error } = await supabase
      .from('program_members')
      .update({ role: 'participant' })
      .eq('program_id', programId)
      .eq('user_id', userId)

    if (!error) {
      await loadMembers()
    }

    setUpdating(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#26264A] flex items-center justify-center text-white">
        Загрузка...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#26264A] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/program/${programId}`} className="text-white/50 hover:text-white">
            ← Назад
          </Link>
          <h1 className="text-xl font-bold">Участники</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {members.length === 0 ? (
            <div className="p-12 text-center text-white/40">Пока нет участников</div>
          ) : (
            <div className="divide-y divide-white/5">
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div>
                    <div className="font-medium">
                      {member.profiles?.full_name || 'Без имени'}
                    </div>
                    <div className="text-sm text-white/40 mt-0.5">
                      {member.role === 'moderator' ? 'Модератор' : 'Участник'}
                    </div>
                  </div>

                  <div>
                    {member.role === 'participant' ? (
                      <button
                        onClick={() => makeModerator(member.user_id)}
                        disabled={updating === member.user_id}
                        className="text-sm bg-[#FF1493]/20 text-[#FF1493] px-3 py-1.5 rounded-lg hover:bg-[#FF1493]/30 disabled:opacity-50 transition"
                      >
                        {updating === member.user_id ? '...' : 'Сделать модератором'}
                      </button>
                    ) : (
                      <button
                        onClick={() => makeParticipant(member.user_id)}
                        disabled={updating === member.user_id}
                        className="text-sm bg-white/10 text-white/60 px-3 py-1.5 rounded-lg hover:bg-white/15 disabled:opacity-50 transition"
                      >
                        {updating === member.user_id ? '...' : 'Сделать участником'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}