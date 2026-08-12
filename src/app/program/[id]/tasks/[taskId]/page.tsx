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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (!task) {
    notFound()
  }

  const { data: membership } = await supabase
    .from('program_members')
    .select('*')
    .eq('program_id', programId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/dashboard')
  }

  const isModerator = membership.role === 'moderator'
  const isExpired = task.deadline && new Date(task.deadline) < new Date()

  // Все сдачи текущего пользователя по этому заданию
  const { data: mySubmissions } = await supabase
    .from('submissions')
    .select(`
      *,
      reviews (*),
      submission_files (*)
    `)
    .eq('task_id', taskId)
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: true })

  const submissionsCount = mySubmissions?.length || 0
  const lastSubmission = mySubmissions?.[mySubmissions.length - 1]
  const lastReview = lastSubmission?.reviews?.[0]

  // Можно ли пересдать?
  // Условия: ровно 1 сдача, она проверена, баллов меньше половины максимума
  const canRedo =
    !isModerator &&
    submissionsCount === 1 &&
    lastSubmission?.status === 'reviewed' &&
    lastReview &&
    lastReview.points < task.max_points / 2

  // Можно ли сдавать в первый раз?
  const canSubmitFirstTime =
    !isModerator &&
    submissionsCount === 0 &&
    !isExpired

  // Все сдачи (для модератора)
  let allSubmissions: any[] = []
  if (isModerator) {
    const { data } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles (full_name),
        reviews (*),
        submission_files (*)
      `)
      .eq('task_id', taskId)
      .order('submitted_at', { ascending: false })

    allSubmissions = data || []
  }

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from('submissions').getPublicUrl(filePath)
    return data.publicUrl
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={`/program/${programId}`}
            className="text-gray-500 hover:text-gray-800"
          >
            ← Назад
          </Link>
          <h1 className="text-xl font-bold truncate">{task.title}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Информация о задании */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{task.title}</h2>
              <p className="text-blue-600 font-medium mt-1">
                до {task.max_points} баллов
              </p>
            </div>
            {task.deadline && (
              <div
                className={`text-sm px-3 py-1 rounded-full ${
                  isExpired
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {isExpired
                  ? 'Дедлайн прошёл'
                  : `до ${new Date(task.deadline).toLocaleString('ru-RU')}`}
              </div>
            )}
          </div>

          {task.description && (
            <div className="text-gray-700 whitespace-pre-wrap">
              {task.description}
            </div>
          )}
        </div>

        {/* Форма сдачи / пересдачи */}
        {!isModerator && (canSubmitFirstTime || canRedo) && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">
              {canRedo ? 'Пересдать задание' : 'Сдать задание'}
            </h3>
            <SubmitForm
              taskId={taskId}
              programId={programId}
              isRedo={canRedo}
            />
          </div>
        )}

        {/* Сообщение, если пересдача больше недоступна */}
        {!isModerator && submissionsCount >= 2 && (
          <div className="bg-gray-100 text-gray-600 p-4 rounded-lg text-sm">
            Вы уже использовали повторную попытку. Больше пересдать это задание нельзя.
          </div>
        )}

        {/* Мои сдачи (участник) */}
        {!isModerator && mySubmissions && mySubmissions.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">Мои сдачи</h3>
            <div className="space-y-4">
              {mySubmissions.map((sub: any, index: number) => (
                <div key={sub.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>
                      {index === 0 ? 'Первая попытка' : 'Повторная попытка'} ·{' '}
                      {new Date(sub.submitted_at).toLocaleString('ru-RU')}
                    </span>
                    <span
                      className={
                        sub.status === 'reviewed'
                          ? 'text-green-600 font-medium'
                          : 'text-yellow-600'
                      }
                    >
                      {sub.status === 'reviewed' ? 'Проверено' : 'На проверке'}
                    </span>
                  </div>

                  {sub.content && (
                    <p className="text-gray-800 whitespace-pre-wrap mb-2">
                      {sub.content}
                    </p>
                  )}

                  {sub.submission_files && sub.submission_files.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {sub.submission_files.map((file: any) => (
                        <a
                          key={file.id}
                          href={getFileUrl(file.file_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm hover:underline block"
                        >
                          {file.mime_type?.startsWith('image/') ? '🖼️' : '📄'} {file.file_name}
                        </a>
                      ))}
                    </div>
                  )}

                  {sub.reviews && sub.reviews.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm font-medium text-green-700">
                        Оценка: {sub.reviews[0].points} баллов
                      </div>
                      {sub.reviews[0].comment && (
                        <p className="text-sm text-gray-600 mt-1">
                          {sub.reviews[0].comment}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Все сдачи (модератор) */}
        {isModerator && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold mb-4">
              Сдачи участников ({allSubmissions.length})
            </h3>

            {allSubmissions.length === 0 ? (
              <p className="text-gray-500 text-sm">Пока никто не сдал</p>
            ) : (
              <div className="space-y-4">
                {allSubmissions.map((sub: any) => (
                  <div key={sub.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-base">
                          {sub.profiles?.full_name || 'Без имени'}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(sub.submitted_at).toLocaleString('ru-RU')}
                        </div>
                      </div>

                      <div>
                        {sub.status === 'reviewed' ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Проверено
                          </span>
                        ) : (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                            На проверке
                          </span>
                        )}
                      </div>
                    </div>

                    {sub.content && (
                      <p className="text-gray-800 whitespace-pre-wrap mb-3 text-sm">
                        {sub.content}
                      </p>
                    )}

                    {sub.links && sub.links.length > 0 && (
                      <div className="mb-3">
                        {sub.links.map((link: string, i: number) => (
                          <a
                            key={i}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm hover:underline block truncate"
                          >
                            {link}
                          </a>
                        ))}
                      </div>
                    )}

                    {sub.submission_files && sub.submission_files.length > 0 && (
                      <div className="mb-3 space-y-1">
                        {sub.submission_files.map((file: any) => (
                          <a
                            key={file.id}
                            href={getFileUrl(file.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                          >
                            <span>
                              {file.mime_type?.startsWith('image/') ? '🖼️' : '📄'}
                            </span>
                            <span className="truncate">{file.file_name}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {sub.status === 'reviewed' && sub.reviews?.[0] ? (
                      <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm">
                        Поставлено: <strong>{sub.reviews[0].points}</strong> баллов
                        {sub.reviews[0].comment && (
                          <div className="mt-1">{sub.reviews[0].comment}</div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={`/program/${programId}/tasks/${taskId}/review/${sub.id}`}
                        className="inline-block mt-1 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700"
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