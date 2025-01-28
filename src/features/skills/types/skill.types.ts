import { z } from 'zod';

export interface Skill {
  id: string;
  name: string;
  category: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
}

export type EntityType = 'team' | 'agent';

export interface SkillValidationRules {
  maxLength: number;
  allowedCharacters: RegExp;
  transformations: {
    lowercase: boolean;
    spaceToUnderscore: boolean;
  };
}

export const DEFAULT_SKILL_VALIDATION: SkillValidationRules = {
  maxLength: 50,
  allowedCharacters: /^[a-z0-9_]+$/,
  transformations: {
    lowercase: true,
    spaceToUnderscore: true,
  },
};

export interface SkillCreate {
  name: string;
  category?: string | null;
}

export interface SkillUpdate {
  name?: string | undefined;
  category?: string | null | undefined;
  id?: string | undefined;
  created_at?: string | null | undefined;
  updated_at?: string | null | undefined;
  created_by?: string | null | undefined;
}

export interface EntitySkill {
  entity_id: string;
  entity_type: EntityType;
  skill_id: string;
  deleted_at?: Date;
  skills: Skill;
}

export interface SkillFilter {
  field: keyof Skill;
  value: string | number | boolean;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike';
}

// Zod schemas for validation
export const skillCreateSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50).nullable().optional()
});

export const skillUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(50).nullable().optional()
}); 