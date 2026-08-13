'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Message = {
  id: string
  content: string
  is_moderator: boolean
  created_at: string
  sender_id: string
}

export function SupportChat({
  programId,
  userId,
  initialMessages,
  isModerator,
}: {
  programId: string
  userId: string
  initialMessages: Message[]
  isModerator: boolean
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || loading) return

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        program_id: programId,
        user_id: userId,
        sender_id: user.id,
        is_moderator: isModerator,
        content: text.trim(),
      })
      .select()
      .single()

    if (!error && data) {
      setMessages((prev) => [...prev, data])
      setText('')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-white/40 py-12">
            {isModerator
              ? 'Напишите первое сообщение участнику'
              : 'Задайте вопрос модераторам — они ответят здесь'}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.is_moderator ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.is_moderator
                    ? 'bg-white/10 text-white'
                    : 'bg-[#FF1493] text-white'
                }`}
              >
                <div className="text-xs opacity-60 mb-1">
                  {msg.is_moderator ? 'Модератор' : 'Вы'}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className="text-xs opacity-40 mt-1 text-right">
                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/10 bg-[#26264A]">
        <form
          onSubmit={handleSend}
          className="max-w-2xl mx-auto px-4 py-4 flex gap-3"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Написать сообщение..."
            className="flex-1 px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF1493]"
          />
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="bg-[#FF1493] text-white px-5 py-3 rounded-xl font-medium hover:bg-[#ff2d9e] disabled:opacity-50 transition"
          >
            Отправить
          </button>
        </form>
      </div>
    </>
  )
}