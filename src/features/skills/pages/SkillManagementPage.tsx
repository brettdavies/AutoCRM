import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent } from '@/shared/components';
import { SkillMatrixWithPermissions } from '../components/SkillMatrixWithPermissions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UIErrorBoundary } from '@/features/error-handling/components/ErrorBoundary';
import { createSkill, getSkills } from '@/core/api/skillApi';

export function SkillManagementPage() {
  const queryClient = useQueryClient();
  console.log('=== SkillManagementPage Render ===');

  const { data: skills = [], isLoading, error } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      console.log('🔍 Fetching all skills');
      const skills = await getSkills();
      console.log('📥 Fetched skills:', skills);
      return skills;
    }
  });

  const createSkillMutation = useMutation({
    mutationFn: async (name: string) => {
      console.log('🎯 Creating skill mutation started:', { name });
      const skill = await createSkill({ name });
      console.log('✅ Skill created successfully:', skill);
      return skill;
    },
    onSuccess: () => {
      console.log('🔄 Invalidating skills query cache');
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (error) => {
      console.error('❌ Skill creation failed:', error);
    }
  });

  const handleAddSkills = async (skillNames: string[]) => {
    console.log('=== handleAddSkills Start ===');
    console.log('📝 New skill names:', skillNames);
    console.log('🗃️ Existing skills:', skills);
    
    try {
      // Create any new skills that don't exist
      for (const name of skillNames) {
        const existingSkill = skills.find(s => s.name === name);
        console.log(`🔍 Checking skill "${name}"`, { exists: !!existingSkill });
        
        if (!existingSkill) {
          console.log(`➕ Creating new skill: "${name}"`);
          await createSkillMutation.mutateAsync(name);
        }
      }
    } catch (error) {
      console.error('❌ Failed to add skills:', error);
    }
  };

  const handleRemoveSkills = async (skillNames: string[]) => {
    console.log('=== handleRemoveSkills Start ===');
    console.log('📝 Skills to remove:', skillNames);
    // No need to do anything here as the skills are just being removed from the entity,
    // not deleted from the system
  };

  if (error) {
    return <div>Error loading skills: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill Management"
        description="Manage and organize system-wide skills"
      />
      
      <UIErrorBoundary boundaryName="skill-management">
        <Card>
          <CardContent className="p-6">
            <SkillMatrixWithPermissions
              directSkills={skills?.map(s => s.name) || []}
              inheritedSkills={[]}
              isStale={isLoading}
              onAddSkills={handleAddSkills}
              onRemoveSkills={handleRemoveSkills}
            />
          </CardContent>
        </Card>
      </UIErrorBoundary>
    </div>
  );
} 