export type UserRole = 'leader' | 'member'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  jobTitle?: string
  bio?: string
  teamId: string
  teamName?: string
  inviteCode?: string
}