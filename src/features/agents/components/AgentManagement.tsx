import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/shared/components';
import { useAgent } from '../hooks/useAgent';
import { SkillMatrix } from '@/features/skills/components/SkillMatrix';
import { TeamManagement } from '@/features/teams/components/TeamManagement';
import { UIErrorBoundary } from '@/features/error-handling/components/ErrorBoundary';
import type { Team } from '@/features/teams/types/team.types';
import type { AgentTeamMembership } from '../types/agent.types';

interface AgentManagementProps {
  agentId: string;
  onUpdate?: () => void;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function AgentManagement({ agentId, onUpdate }: AgentManagementProps) {
  const [activeTab, setActiveTab] = useState('skills');
  
  const {
    agent,
    isLoading,
    error,
    updateAgent,
    updateTeamMemberships,
    isUpdating
  } = useAgent(agentId);

  const handleTeamMembershipUpdate = async (teams: Team[]) => {
    try {
      const memberships: AgentTeamMembership[] = teams.map(team => ({
        teamId: team.id,
        role: 'member' as const,
        isPrimary: false,
        joinedAt: new Date().toISOString()
      }));
      
      await updateTeamMemberships(memberships);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update team memberships:', error);
    }
  };

  const handleSkillAssignment = async (skillIds: string[]) => {
    try {
      if (!agent) return;
      
      await updateAgent({
        name: agent.name,
        email: agent.email,
        role: agent.role,
        skillIds
      });
      onUpdate?.();
    } catch (error) {
      console.error('Failed to assign skills:', error);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading agent data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading || !agent) {
    return <LoadingSkeleton />;
  }

  return (
    <UIErrorBoundary boundaryName="agent-management">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Agent Management: {agent.name}</span>
            {isUpdating && <span className="text-sm text-muted-foreground">Updating...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
            </TabsList>

            <TabsContent value="skills">
              <SkillMatrix
                directSkills={agent.directSkills}
                inheritedSkills={agent.inheritedSkills.map(skill => ({
                  skill,
                  teams: agent.teams.map(t => t.teamId)
                }))}
                isStale={isUpdating}
                onRefresh={() => handleSkillAssignment(agent.directSkills.map(s => s.id))}
                showInherited={true}
              />
            </TabsContent>

            <TabsContent value="teams">
              <TeamManagement
                teams={agent.teams.map(membership => ({
                  id: membership.teamId,
                  name: membership.teamName || `Team ${membership.teamId}`,
                  description: membership.teamDescription || '',
                  members: membership.teamMembers?.map(m => ({
                    id: m.id,
                    name: m.name,
                    role: m.role as 'member' | 'lead',
                    joined_at: membership.joinedAt
                  })) || [],
                  skills: membership.teamSkills?.map(s => ({
                    id: s.id,
                    name: s.name,
                    category: s.category,
                    created_by: agent.id,
                    created_at: membership.joinedAt,
                    updated_at: membership.joinedAt
                  })) || [],
                  created_at: membership.joinedAt,
                  updated_at: membership.joinedAt
                }))}
                users={[{
                  id: agent.id,
                  full_name: agent.name,
                  email: agent.email,
                  user_role: agent.role
                }]}
                permissions={{
                  canCreate: false,
                  canDelete: false,
                  canEdit: true,
                  canManageMembers: true
                }}
                onTeamUpdate={handleTeamMembershipUpdate}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </UIErrorBoundary>
  );
} 