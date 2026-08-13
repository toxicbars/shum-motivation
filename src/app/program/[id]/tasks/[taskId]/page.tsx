import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { SubmitForm } from './submit-form'

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>
}) {
  const { id: programId, taskId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single()
  if (!task) notFound()

  const { data: membership } = await supabase
    .from('program_members')
    .select('*')
    .eq('program_id', programId)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/dashboard')

  const isModerator = membership.role === 'moderator'
  const isExpired = task.deadline && new Date(task.deadline) < new Date()

  const { data: mySubmissions } = await supabase
    .from('submissions')
    .select(`*, reviews (*), submission_files (*)`)
    .eq('task_id', taskId)
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: true })

  const submissionsCount = mySubmissions?.length || 0
  const lastSubmission = mySubmissions?.[mySubmissions.length - 1]
  const lastReview = lastSubmission?.reviews?.[0]

  const canRedo =
    !isModerator &&
    submissionsCount === 1 &&
    lastSubmission?.status === 'reviewed' &&
    lastReview &&
    lastReview.points < task.max_points / 2

  const canSubmitFirstTime = !isModerator && submissionsCount === 0 && !isExpired

  let allSubmissions: any[] = []
  if (isModerator) {
    const { data } = await supabase
      .from('submissions')
      .select(`*, profiles (full_name), reviews (*), submission_files (*)`)
      .eq('task_id', taskId)
      .order('submitted_at', { ascending: false })
    allSubmissions = data || []
  }

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from('submissions').getPublicUrl(filePath)
    return data.publicUrl
  }

  return (
    <div className="min-h-screen bg-[#26264A] text-white">
      <header className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/program/${programId}`} className="text-white/50 hover:text-white">← Назад</Link>
          <h1 className="text-xl font-bold truncate">{task.title}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{task.title}</h2>
              <p className="text-[#FF1493] font-medium mt-1">до {task.max_points} баллов</p>
            </div>
            {task.deadline && (
              <div className={`text-sm px-3 py-1 rounded-full ${isExpired ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/60'}`}>
                {isExpired ? 'Дедлайн прошёл' : `до ${new Date(task.deadline).toLocaleString('ru-RU')}`}
              </div>
            )}
          </div>
          {task.description && (
            <div className="text-white/70 whitespace-pre-wrap">{task.description}</div>
          )}
        </div>

        {!isModerator && (canSubmitFirstTime || canRedo) && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">{canRedo ? 'Пересдать задание' : 'Сдать задание'}</h3>
            <SubmitForm taskId={taskId} programId={programId} isRedo={canRedo} />
          </div>
        )}

        {!isModerator && submissionsCount >= 2 && (
          <div className="bg-white/5 text-white/50 p-4 rounded-xl text-sm">
            Вы уже использовали повторную попытку. Больше пересдать нельзя.
          </div>
        )}

        {!isModerator && mySubmissions && mySubmissions.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Мои сдачи</h3>
            <div className="space-y-4">
              {mySubmissions.map((sub: any, index: number) => (
                <div key={sub.id} className="border border-white/10 rounded-xl p-4 bg-white/5">
                  <div className="flex justify-between text-sm text-white/40 mb-2">
                    <span>{index === 0 ? 'Первая попытка' : 'Повторная попытка'} · {new Date(sub.submitted_at).toLocaleString('ru-RU')}</span>
                    <span className={sub.status === 'reviewed' ? 'text-green-400' : 'text-yellow-400'}>
                      {sub.status === 'reviewed' ? 'Проверено' : 'На проверке'}
                    </span>
                  </div>
                  {sub.content && <p className="text-white/80 whitespace-pre-wrap mb-2">{sub.content}</p>}
                  {sub.reviews?.[0] && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-sm font-medium text-green-400">Оценка: {sub.reviews[0].points} баллов</div>
                      {sub.reviews[0].comment && <p className="text-sm text-white/50 mt-1">{sub.reviews[0].comment}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isModerator && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Сдачи участников ({allSubmissions.length})</h3>
            {allSubmissions.length === 0 ? (
              <p className="text-white/40 text-sm">Пока никто не сдал</p>
            ) : (
              <div className="space-y-4">
                {allSubmissions.map((sub: any) => (
                  <div key={sub.id} className="border border-white/10 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold">{sub.profiles?.full_name || 'Без имени'}</div>
                        <div className="text-xs text-white/40">{new Date(sub.submitted_at).toLocaleString('ru-RU')}</div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full ${sub.status === 'reviewed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {sub.status === 'reviewed' ? 'Проверено' : 'На проверке'}
                      </span>
                    </div>
                    {sub.content && <p className="text-white/70 text-sm mb-3 whitespace-pre-wrap">{sub.content}</p>}
                    {sub.submission_files?.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {sub.submission_files.map((file: any) => {
                          const url = getFileUrl(file.file_path)
                          const isImage = file.mime_type?.startsWith('image/')
                          return isImage ? (
                            <a key={file.id} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt={file.file_name} className="h-20 w-20 object-cover rounded-lg border border-white/10" />
                            </a>
                          ) : (
                            <a key={file.id} href={url} target="_blank" rel="noopener noreferrer" className="text-[#FF1493] text-sm hover:underline">
                              📄 {file.file_name}
                            </a>
                          )
                        })}
                      </div>
                    )}
                    {sub.status === 'reviewed' && sub.reviews?.[0] ? (
                      <div className="bg-green-500/10 text-green-400 p-3 rounded-xl text-sm">
                        Поставлено: <strong>{sub.reviews[0].points}</strong> баллов
                        {sub.reviews[0].comment && <div className="mt-1 text-green-400/80">{sub.reviews[0].comment}</div>}
                      </div>
                    ) : (
                      <Link
                        href={`/program/${programId}/tasks/${taskId}/review/${sub.id}`}
                        className="inline-block mt-1 bg-[#FF1493] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[#ff2d9e]"
                      >
                        Проверить
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}