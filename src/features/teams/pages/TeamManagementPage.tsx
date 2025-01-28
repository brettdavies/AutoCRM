import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent } from '@/shared/components';
import { TeamManagement } from '../components/TeamManagement';
import { useUsers } from '@/features/auth/hooks/useUsers';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UIErrorBoundary } from '@/features/error-handling/components/ErrorBoundary';
import { useParams } from 'react-router-dom';
import logger from '@/shared/utils/logger.utils';
import type { User } from '@/features/users/types/user.types';
import { useTeamMembers } from '../hooks/useTeams';

export function TeamManagementPage() {
  const { teamId } = useParams();
  const { profile } = useAuth();
  const { data: rawUsers = [], isLoading: isLoadingUsers, error: usersError } = useUsers();
  const { members = [] } = useTeamMembers(teamId ?? '');

  const users: User[] = rawUsers.map(user => ({
    id: user.id,
    full_name: user.full_name || user.email,
    email: user.email,
    user_role: user.user_role,
    avatar_url: user.avatar_url || '',
    created_at: user.created_at || new Date().toISOString(),
    updated_at: user.updated_at || new Date().toISOString()
  }));

  const isLoading = isLoadingUsers;

  logger.debug('[TeamManagementPage] Loading state:', {
    isLoadingUsers,
    usersCount: users.length,
    usersError,
    teamId,
    userRole: profile?.user_role
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (usersError) {
    return <div>Error: {usersError.message}</div>;
  }

  const isAdmin = profile?.user_role === 'admin';
  const isTeamLead = members.some(member => 
    member.id === profile?.id && member.role === 'lead'
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Management"
        description="Manage teams and their members"
      />
      
      <UIErrorBoundary boundaryName="team-management">
        <Card>
          <CardContent className="p-6">
            <TeamManagement
              users={users}
              initialTeamId={teamId}
              permissions={{
                canCreate: isAdmin,
                canEdit: isAdmin,
                canDelete: isAdmin,
                canManageMembers: isAdmin || isTeamLead
              }}
            />
          </CardContent>
        </Card>
      </UIErrorBoundary>
    </div>
  );
} 