'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function CreateProgramPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Нужно войти в аккаунт')
      setLoading(false)
      return
    }

    const inviteCode = generateInviteCode()

    const { data: program, error: programError } = await supabase
      .from('programs')
      .insert({
        title,
        description,
        invite_code: inviteCode,
        created_by: user.id,
      })
      .select()
      .single()

    if (programError) {
      setError(programError.message)
      setLoading(false)
      return
    }

    const { error: memberError } = await supabase
      .from('program_members')
      .insert({
        program_id: program.id,
        user_id: user.id,
        role: 'moderator',
      })

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    router.push(`/program/${program.id}`)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#26264A] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-white/50 hover:text-white">← Назад</Link>
          <h1 className="text-xl font-bold">Создать программу</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Название программы *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#FF1493]"
                placeholder="Например: Медиа-смена август 2026"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1.5">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white focus:outline-none focus:border-[#FF1493]"
                placeholder="Кратко опиши программу..."
              />
            </div>

            {error && (
              <div className="text-[#FF1493] text-sm bg-[#FF1493]/10 p-3 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF1493] text-white py-3.5 rounded-xl font-semibold hover:bg-[#ff2d9e] disabled:opacity-50 transition"
            >
              {loading ? 'Создаём...' : 'Создать программу'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}