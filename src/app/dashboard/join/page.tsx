'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function JoinProgramPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Нужно войти в аккаунт')
      setLoading(false)
      return
    }

    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('*')
      .eq('invite_code', code.trim().toUpperCase())
      .eq('is_active', true)
      .single()

    if (programError || !program) {
      setError('Программа с таким кодом не найдена')
      setLoading(false)
      return
    }

    const { data: existing } = await supabase
      .from('program_members')
      .select('id')
      .eq('program_id', program.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      router.push(`/program/${program.id}`)
      return
    }

    const { error: memberError } = await supabase
      .from('program_members')
      .insert({
        program_id: program.id,
        user_id: user.id,
        role: 'participant',
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
          <h1 className="text-xl font-bold">Присоединиться к программе</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <p className="text-white/50 mb-6">
            Введите код приглашения, который вам дали организаторы.
          </p>

          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Код приглашения</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white text-center text-lg tracking-widest focus:outline-none focus:border-[#FF1493]"
                placeholder="ABC123"
                maxLength={10}
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
              {loading ? 'Присоединяемся...' : 'Присоединиться'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}