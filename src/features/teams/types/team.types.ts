import { z } from 'zod'
import type { Skill } from '@/features/skills/types/skill.types'
import type { User } from '@/features/users/types/user.types'
export type TeamMemberRole = 'member' | 'lead'
export interface Team {
  id: string
  name: string
  description: string | null
  created_at: string | null
  updated_at: string | null
  members: TeamMember[]
  skills: Skill[]
}
export interface TeamListItem {
  id: string
  name: string
  memberCount: number
}
export interface TeamCreate {
  name: string
  description?: string
}
export interface TeamUpdate {
  name?: string
  description?: string | null
}
export interface TeamMember extends User {
  role: TeamMemberRole
  joined_at: string | null
}
export interface TeamPermissions {
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canManageMembers: boolean
  canAssignLead: boolean
  canAssignSkills: boolean
}
export const teamCreateSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/),
  description: z.string().max(500).nullable(),
})
export const teamUpdateSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  description: z.string().max(500).nullable().optional(),
})
