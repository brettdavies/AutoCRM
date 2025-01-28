import { supabase } from '@/core/supabase';
import { Skill, SkillCreate, SkillUpdate, SkillFilter, EntityType } from '../types/skill.types';
import { handleDatabaseError } from '@/features/error-handling/utils/handlers';
import { skillCreateSchema, skillUpdateSchema } from '../types/skill.types';
import logger from '@/shared/utils/logger.utils';

export class SkillService {
  // Validation Methods
  validateSkill(skill: SkillCreate | SkillUpdate): { value: SkillCreate | SkillUpdate, error: Error | null } {
    console.log('=== Service validateSkill Start ===');
    console.log('📥 Input skill:', JSON.stringify(skill, null, 2));

    // For create operations, we know we have a name
    if ('name' in skill && typeof skill.name === 'string') {
      console.log('🔍 Processing as CREATE operation');
      const result = skillCreateSchema.safeParse({
        name: skill.name,
        category: skill.category ?? null
      });
      
      console.log('✨ CREATE validation result:', JSON.stringify(result, null, 2));
      if (result.success) {
        console.log('✅ CREATE validation successful');
        return { value: result.data as SkillCreate, error: null };
      }
      
      const createValue: SkillCreate = { name: skill.name, category: null };
      console.log('⚠️ CREATE validation failed, using fallback:', JSON.stringify(createValue, null, 2));
      return { 
        value: createValue,
        error: new Error(result.error.message)
      };
    }

    // For update operations
    console.log('🔍 Processing as UPDATE operation');
    const result = skillUpdateSchema.safeParse(skill);
    console.log('✨ UPDATE validation result:', JSON.stringify(result, null, 2));
    const updateValue: SkillUpdate = result.success ? result.data : { name: undefined, category: undefined };
    console.log('📤 Final update value:', JSON.stringify(updateValue, null, 2));
    return {
      value: updateValue,
      error: !result.success ? new Error(result.error.message) : null
    };
  }

  validateSkills(skills: SkillCreate[]) {
    const results = skills.map(skill => this.validateSkill(skill));
    const errors = results
      .map((result, index) => result.error ? { index, error: result.error } : null)
      .filter((error): error is { index: number; error: Error } => error !== null);
    
    const values = results
      .map(result => result.value)
      .filter((value): value is SkillCreate => value !== null);

    return { values, errors };
  }

  // Core CRUD Operations
  async createSkill(skill: SkillCreate): Promise<Skill> {
    console.log('=== Service createSkill Start ===');
    console.log('📥 Input skill:', JSON.stringify(skill, null, 2));
    
    try {
      console.log('🎯 Executing Supabase insert...');
      const { data, error } = await supabase
        .from('skills')
        .insert(skill)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
      }
      
      console.log('✅ Skill created successfully:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('❌ Error in createSkill:', error);
      throw handleDatabaseError(error, 'insert', 'skills');
    }
  }

  async createSkills(skills: SkillCreate[]): Promise<Skill[]> {
    try {
      const { data, error } = await supabase
        .from('skills')
        .insert(skills)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleDatabaseError(error, 'insert', 'skills');
    }
  }

  async updateSkill(id: string, skill: SkillUpdate): Promise<Skill> {
    try {
      console.log('=== Skill Update Start ===');
      console.log('Input skill:', JSON.stringify(skill, null, 2));
      
      // Filter out undefined values
      const cleanSkill = Object.fromEntries(
        Object.entries(skill).filter(([_, v]) => v !== undefined)
      );
      console.log('Cleaned skill (undefined values removed):', JSON.stringify(cleanSkill, null, 2));
      
      console.log('Executing Supabase update...');
      const { data, error } = await supabase
        .from('skills')
        .update(cleanSkill)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      console.log('Update successful. Updated skill:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('Error in updateSkill:', error);
      throw handleDatabaseError(error, 'update', 'skills');
    }
  }

  async deleteSkill(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      throw handleDatabaseError(error, 'delete', 'skills');
    }
  }

  // Query Methods
  async getSkills(): Promise<Skill[]> {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleDatabaseError(error, 'select', 'skills');
    }
  }

  async searchSkills(query: string, filters: SkillFilter[] = []): Promise<Skill[]> {
    try {
      let queryBuilder = supabase
        .from('skills')
        .select();

      if (query) {
        queryBuilder = queryBuilder.ilike('name', `%${query}%`);
      }

      // Apply filters if any
      filters.forEach(filter => {
        if (filter.field && filter.value) {
          const value = typeof filter.value === 'string' ? filter.value : filter.value.toString();
          queryBuilder = queryBuilder.eq(filter.field, value);
        }
      });

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleDatabaseError(error, 'select', 'skills');
    }
  }

  // Entity Assignment Methods
  async assignSkillToEntity(entityId: string, entityType: EntityType, skillId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('entity_skills')
        .insert({
          entity_id: entityId,
          entity_type: entityType,
          skill_id: skillId
        });

      if (error) throw error;
    } catch (error) {
      throw handleDatabaseError(error, 'insert', 'entity_skills');
    }
  }

  async removeSkillFromEntity(entityId: string, entityType: EntityType, skillId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('entity_skills')
        .delete()
        .match({
          entity_id: entityId,
          entity_type: entityType,
          skill_id: skillId
        });

      if (error) throw error;
    } catch (error) {
      throw handleDatabaseError(error, 'delete', 'entity_skills');
    }
  }

  async getEntitySkills(entityId: string, entityType: EntityType): Promise<Skill[]> {
    logger.debug('[SkillService] Fetching entity skills:', {
      entityId,
      entityType
    });

    try {
      const { data, error } = await supabase
        .from('entity_skills')
        .select(`
          skill_id,
          skills (
            id,
            name,
            category,
            created_at,
            updated_at,
            created_by
          )
        `)
        .match({
          entity_id: entityId,
          entity_type: entityType
        })
        .is('deleted_at', null);  // Only fetch active skills

      if (error) {
        logger.error('[SkillService] Error fetching entity skills:', error);
        throw error;
      }

      const skills = data.map(item => item.skills);
      logger.debug('[SkillService] Fetched skills:', skills);
      return skills;
    } catch (error) {
      logger.error('[SkillService] Error in getEntitySkills:', error);
      throw handleDatabaseError(error, 'select', 'entity_skills');
    }
  }

  // Enhanced Assignment Methods
  async addSkillsToEntity(entityId: string, entityType: EntityType, skillNames: string[]): Promise<void> {
    logger.debug('[SkillService] Starting skill addition:', {
      entityId,
      entityType,
      skillNames
    });

    try {
      // First, get or create all skills in one operation
      const skills = await this.getOrCreateSkills(skillNames);
      const skillIds = skills.map(s => s.id);
      
      logger.debug('[SkillService] Skills retrieved/created:', {
        skills,
        skillIds
      });

      // Get existing active skills to avoid duplicates
      const { data: existingSkills, error: fetchError } = await supabase
        .from('entity_skills')
        .select('skill_id')
        .match({
          entity_id: entityId,
          entity_type: entityType
        })
        .is('deleted_at', null);

      if (fetchError) {
        logger.error('[SkillService] Error fetching existing skills:', fetchError);
        throw fetchError;
      }

      const existingSkillIds = existingSkills.map(s => s.skill_id);
      
      // Only add skills that don't already exist
      const skillsToAdd = skillIds.filter(id => !existingSkillIds.includes(id));

      logger.debug('[SkillService] Skills to add:', {
        existing: existingSkillIds,
        toAdd: skillsToAdd
      });

      // Insert new skills
      if (skillsToAdd.length > 0) {
        logger.debug('[SkillService] Inserting new skills:', skillsToAdd);
        const { error: insertError } = await supabase
          .from('entity_skills')
          .insert(
            skillsToAdd.map(skillId => ({
              entity_id: entityId,
              entity_type: entityType,
              skill_id: skillId,
              deleted_at: null
            }))
          );

        if (insertError) {
          logger.error('[SkillService] Error inserting new skills:', insertError);
          throw insertError;
        }
      }

      logger.debug('[SkillService] Skill addition completed successfully');
    } catch (error) {
      logger.error('[SkillService] Error in addSkillsToEntity:', error);
      throw handleDatabaseError(error, 'insert', 'entity_skills');
    }
  }

  async removeSkillsFromEntity(entityId: string, entityType: EntityType, skillNames: string[]): Promise<void> {
    logger.debug('[SkillService] Starting skill removal:', {
      entityId,
      entityType,
      skillNames
    });

    try {
      // Get the IDs of the skills to remove
      const { data: skills, error: skillError } = await supabase
        .from('skills')
        .select('id')
        .in('name', skillNames);

      if (skillError) {
        logger.error('[SkillService] Error fetching skills to remove:', skillError);
        throw skillError;
      }

      const skillIds = skills.map(s => s.id);
      
      logger.debug('[SkillService] Skills to remove:', {
        skillNames,
        skillIds
      });

      // Soft delete the skills
      if (skillIds.length > 0) {
        logger.debug('[SkillService] Soft deleting skills:', skillIds);
        const { error: deleteError } = await supabase
          .from('entity_skills')
          .update({ deleted_at: new Date().toISOString() })
          .match({
            entity_id: entityId,
            entity_type: entityType
          })
          .in('skill_id', skillIds)
          .is('deleted_at', null);  // Only update active skills

        if (deleteError) {
          logger.error('[SkillService] Error soft deleting skills:', deleteError);
          throw deleteError;
        }
      }

      logger.debug('[SkillService] Skill removal completed successfully');
    } catch (error) {
      logger.error('[SkillService] Error in removeSkillsFromEntity:', error);
      throw handleDatabaseError(error, 'update', 'entity_skills');
    }
  }

  // Deprecated - Use addSkillsToEntity or removeSkillsFromEntity instead
  async assignSkills(entityId: string, entityType: EntityType, skillNames: string[]): Promise<void> {
    logger.warn('[SkillService] assignSkills is deprecated. Use addSkillsToEntity or removeSkillsFromEntity instead.');
    return this.addSkillsToEntity(entityId, entityType, skillNames);
  }

  async bulkAssignSkills(entityType: EntityType, operations: Array<{ entityId: string; skillIds: string[] }>): Promise<void> {
    try {
      const records = operations.flatMap(({ entityId, skillIds }) =>
        skillIds.map(skillId => ({
          entity_id: entityId,
          entity_type: entityType,
          skill_id: skillId
        }))
      );

      const { error } = await supabase
        .from('entity_skills')
        .upsert(records);

      if (error) throw error;
    } catch (error) {
      throw handleDatabaseError(error, 'upsert', 'entity_skills');
    }
  }

  // Enhanced Search Methods
  async getFilteredSkills(filters: SkillFilter[]): Promise<Skill[]> {
    try {
      let queryBuilder = supabase
        .from('skills')
        .select();

      // Apply filters
      filters.forEach(filter => {
        if (filter.field && filter.value) {
          const value = typeof filter.value === 'string' ? filter.value : filter.value.toString();
          queryBuilder = queryBuilder.eq(filter.field, value);
        }
      });

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleDatabaseError(error, 'select', 'skills');
    }
  }

  // Real-time Updates
  subscribeToSkillUpdates(entityId: string, entityType: EntityType, callback: () => void) {
    const subscription = supabase
      .channel('entity_skills_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entity_skills',
          filter: `entity_id=eq.${entityId} AND entity_type=eq.${entityType}`
        },
        callback
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  async getOrCreateSkill(name: string): Promise<Skill> {
    logger.debug('[SkillService] Getting or creating skill:', { name });
    
    try {
      // Use upsert to either create or get the skill
      const { data, error } = await supabase
        .from('skills')
        .upsert(
          { name },
          { 
            onConflict: 'name',  // If name exists, return existing record
            ignoreDuplicates: true  // Don't error on duplicates
          }
        )
        .select()
        .single();

      if (error) {
        logger.error('[SkillService] Error in getOrCreateSkill:', error);
        throw error;
      }

      logger.debug('[SkillService] Skill retrieved/created:', data);
      return data;
    } catch (error) {
      logger.error('[SkillService] Failed to get/create skill:', error);
      throw handleDatabaseError(error, 'upsert', 'skills');
    }
  }

  async getOrCreateSkills(names: string[]): Promise<Skill[]> {
    logger.debug('[SkillService] Getting or creating multiple skills:', { names });
    
    try {
      // Use upsert to either create or get all skills in one operation
      const { data, error } = await supabase
        .from('skills')
        .upsert(
          names.map(name => ({ name })),
          { 
            onConflict: 'name',
            ignoreDuplicates: true
          }
        )
        .select();

      if (error) {
        logger.error('[SkillService] Error in getOrCreateSkills:', error);
        throw error;
      }

      logger.debug('[SkillService] Skills retrieved/created:', data);
      return data;
    } catch (error) {
      logger.error('[SkillService] Failed to get/create skills:', error);
      throw handleDatabaseError(error, 'upsert', 'skills');
    }
  }
} 