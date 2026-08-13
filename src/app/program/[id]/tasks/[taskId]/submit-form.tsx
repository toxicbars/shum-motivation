'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3 МБ

export function SubmitForm({
  taskId,
  programId,
  isRedo = false,
}: {
  taskId: string
  programId: string
  isRedo?: boolean
}) {
  const [content, setContent] = useState('')
  const [links, setLinks] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Нужно войти')
      setLoading(false)
      return
    }

    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(`Файл "${file.name}" имеет недопустимый формат`)
          setLoading(false)
          return
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`Файл "${file.name}" больше 3 МБ`)
          setLoading(false)
          return
        }
      }
    }

    const linksArray = links
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    const { data: submission, error: insertError } = await supabase
      .from('submissions')
      .insert({
        task_id: taskId,
        user_id: user.id,
        content: content || null,
        links: linksArray,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError || !submission) {
      setError(insertError?.message || 'Ошибка при создании сдачи')
      setLoading(false)
      return
    }

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const filePath = `${user.id}/${submission.id}/${Date.now()}_${file.name}`

        const { error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }

        await supabase.from('submission_files').insert({
          submission_id: submission.id,
          file_name: file.name,
          file_path: filePath,
          mime_type: file.type,
          size: file.size,
        })
      }
    }

    setSuccess(true)
    setContent('')
    setLinks('')
    setFiles(null)
    setLoading(false)
    router.refresh()
  }

  if (success) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl">
        {isRedo
          ? 'Переработанная работа отправлена на проверку!'
          : 'Работа успешно отправлена на проверку!'}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isRedo && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-3 rounded-xl text-sm">
          Это ваша повторная попытка. После проверки пересдать больше будет нельзя.
        </div>
      )}

      <div>
        <label className="block text-sm text-white/70 mb-1.5">Текстовый ответ</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF1493]"
          placeholder="Опиши, что ты сделал..."
        />
      </div>

      <div>
        <label className="block text-sm text-white/70 mb-1.5">
          Ссылки (каждая с новой строки)
        </label>
        <textarea
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF1493]"
          placeholder="https://disk.yandex.ru/...&#10;https://youtu.be/..."
        />
        <p className="text-xs text-white/30 mt-1">
          Видео лучше загружать на YouTube / Яндекс.Диск и вставлять ссылку
        </p>
      </div>

      <div>
        <label className="block text-sm text-white/70 mb-1.5">
          Файлы (фото, документы)
        </label>
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.ppt,.pptx"
          onChange={(e) => setFiles(e.target.files)}
          className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#FF1493]/20 file:text-[#FF1493] hover:file:bg-[#FF1493]/30"
        />
        <p className="text-xs text-white/30 mt-1">
          Максимум 3 МБ на файл. Можно несколько файлов.
        </p>
      </div>

      {error && (
        <div className="text-[#FF1493] text-sm bg-[#FF1493]/10 p-3 rounded-xl">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#FF1493] text-white py-3 rounded-xl font-semibold hover:bg-[#ff2d9e] disabled:opacity-50 transition"
      >
        {loading ? 'Отправляем...' : isRedo ? 'Пересдать задание' : 'Сдать задание'}
      </button>
    </form>
  )
}