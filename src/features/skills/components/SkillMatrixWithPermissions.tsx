import { useAuth } from '@/features/auth/hooks/useAuth';
import { SkillMatrix, type SkillMatrixProps } from './SkillMatrix';

type SkillMatrixWithPermissionsProps = Omit<SkillMatrixProps, 'disabled'> & {
  forceDisabled?: boolean;  // Optional override for testing/special cases
};

export function SkillMatrixWithPermissions({ 
  forceDisabled,
  ...skillMatrixProps 
}: SkillMatrixWithPermissionsProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.user_role === 'admin';
  
  // If forceDisabled is provided, use that, otherwise base it on admin status
  const isDisabled = forceDisabled ?? !isAdmin;

  return (
    <SkillMatrix
      {...skillMatrixProps}
      disabled={isDisabled}
      onAddSkills={isDisabled ? undefined : skillMatrixProps.onAddSkills}
      onRemoveSkills={isDisabled ? undefined : skillMatrixProps.onRemoveSkills}
    />
  );
}

export type { SkillMatrixWithPermissionsProps }; 