export type Profile = {
  id: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export type Program = {
  id: string
  title: string
  description: string | null
  invite_code: string
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ProgramMember = {
  id: string
  program_id: string
  user_id: string
  role: 'participant' | 'moderator'
  joined_at: string
}

export type Task = {
  id: string
  program_id: string
  title: string
  description: string | null
  max_points: number
  deadline: string | null
  is_published: boolean
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Submission = {
  id: string
  task_id: string
  user_id: string
  content: string | null
  links: string[]
  status: 'pending' | 'reviewed'
  submitted_at: string
}

export type SubmissionFile = {
  id: string
  submission_id: string
  file_name: string
  file_path: string
  mime_type: string | null
  size: number | null
  created_at: string
}

export type Review = {
  id: string
  submission_id: string
  reviewer_id: string
  points: number
  comment: string | null
  created_at: string
}

export type PointTransaction = {
  id: string
  program_id: string
  user_id: string
  amount: number
  reason: string | null
  related_submission_id: string | null
  created_by: string | null
  created_at: string
}