import { Skill, SkillCreate, SkillUpdate } from '@/features/skills/types/skill.types';
import { SkillService } from '@/features/skills/services/SkillService';
import { ValidationError, ErrorCode } from '@/features/error-handling/types';

const skillService = new SkillService();

export const createSkill = async (skill: SkillCreate): Promise<Skill> => {
  console.log('=== API createSkill Start ===');
  console.log('📥 Input skill:', skill);
  
  const { value, error: validationError } = await skillService.validateSkill(skill);
  console.log('✨ Validation result:', { value, error: validationError });
  
  if (validationError || !value.name) {
    console.error('❌ Validation failed:', validationError?.message || 'Name is required');
    throw new ValidationError(
      ErrorCode.INVALID_FORMAT,
      validationError?.message || 'Name is required',
      'skill',
      skill
    );
  }
  
  console.log('🎯 Calling service createSkill with:', value);
  const result = await skillService.createSkill(value as SkillCreate);
  console.log('✅ Skill created:', result);
  return result;
};

export const createSkills = async (skills: SkillCreate[]): Promise<Skill[]> => {
  console.log('=== API createSkills Start ===');
  console.log('📥 Input skills:', skills);
  
  const { values, errors } = await skillService.validateSkills(skills);
  console.log('✨ Validation results:', { values, errors });
  
  if (errors.length > 0) {
    console.error('❌ Validation failed:', errors);
    throw new ValidationError(
      ErrorCode.INVALID_FORMAT,
      'Invalid skills format',
      'skills',
      skills,
      errors
    );
  }
  
  console.log('🎯 Calling service createSkills with:', values);
  const result = await skillService.createSkills(values);
  console.log('✅ Skills created:', result);
  return result;
};

export const updateSkill = async (id: string, skill: SkillUpdate): Promise<Skill> => {
  const { value, error: validationError } = await skillService.validateSkill(skill);
  if (validationError || !value.name) {
    throw new ValidationError(
      ErrorCode.INVALID_FORMAT,
      validationError?.message || 'Name is required',
      'skill',
      skill
    );
  }
  return await skillService.updateSkill(id, value as SkillUpdate);
};

export const deleteSkill = async (id: string): Promise<void> => {
  await skillService.deleteSkill(id);
};

export const getSkills = async (): Promise<Skill[]> => {
  return await skillService.getSkills();
};

export const assignSkillToEntity = async (
  entityId: string, 
  entityType: 'team' | 'agent', 
  skillId: string
): Promise<void> => {
  // Validate entity type
  if (!['team', 'agent'].includes(entityType)) {
    throw new ValidationError(
      ErrorCode.INVALID_VALUE,
      'Invalid entity type',
      'entityType',
      entityType
    );
  }
  await skillService.assignSkillToEntity(entityId, entityType, skillId);
};

export const removeSkillFromEntity = async (
  entityId: string, 
  entityType: 'team' | 'agent', 
  skillId: string
): Promise<void> => {
  if (!['team', 'agent'].includes(entityType)) {
    throw new ValidationError(
      ErrorCode.INVALID_VALUE,
      'Invalid entity type',
      'entityType',
      entityType
    );
  }
  await skillService.removeSkillFromEntity(entityId, entityType, skillId);
};

export const getEntitySkills = async (
  entityId: string, 
  entityType: 'team' | 'agent'
): Promise<Skill[]> => {
  if (!['team', 'agent'].includes(entityType)) {
    throw new ValidationError(
      ErrorCode.INVALID_VALUE,
      'Invalid entity type',
      'entityType',
      entityType
    );
  }
  return await skillService.getEntitySkills(entityId, entityType);
}; 