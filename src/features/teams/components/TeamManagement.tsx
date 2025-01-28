import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/shared/components';
import { useTeams, useTeamMembers, useTeamList, useTeamMutations } from '../hooks/useTeams';
import { useEntitySkills } from '@/features/skills/hooks/useSkills';
import { SkillMatrixWithPermissions } from '@/features/skills/components/SkillMatrixWithPermissions';
import { UIErrorBoundary } from '@/features/error-handling/components/ErrorBoundary';
import { ConfirmDialog } from './ConfirmDialog';
import type { TeamCreate, TeamUpdate, TeamMember } from '../types/team.types';
import type { User } from '@/features/users/types/user.types';
import logger from '@/shared/utils/logger.utils';

interface TeamManagementProps {
  users: User[];
  initialTeamId?: string | undefined;
  permissions: {
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManageMembers: boolean;
  };
}

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
}

export function TeamManagement({ users, initialTeamId, permissions }: TeamManagementProps) {
  const navigate = useNavigate();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(initialTeamId || null);
  const [activeTab, setActiveTab] = useState('details');
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamData, setNewTeamData] = useState<TeamCreate>({
    name: '',
    description: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  const { data: teamList = [] } = useTeamList();
  const { data: selectedTeam } = useTeams(selectedTeamId);
  const { members, assignLead, addMember, removeMember } = useTeamMembers(selectedTeamId ?? '');
  const { 
    skills, 
    isLoading: skillsLoading, 
    addSkills,
    removeSkills 
  } = useEntitySkills(selectedTeamId ?? '', 'team');
  const teamMutations = useTeamMutations();

  logger.debug('[TeamManagement] Component state:', {
    selectedTeamId,
    activeTab,
    isCreating,
    skillsLoading,
    hasSkills: !!skills,
    skillsCount: skills?.length
  });

  const handleCreateTeam = async () => {
    try {
      await teamMutations.createTeam.mutateAsync(newTeamData);
      setIsCreating(false);
      setNewTeamData({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const handleUpdateTeam = async (teamId: string, data: TeamUpdate) => {
    try {
      await teamMutations.updateTeam.mutateAsync({ id: teamId, team: data });
    } catch (error) {
      console.error('Failed to update team:', error);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    setConfirmationState({
      isOpen: true,
      title: 'Delete Team',
      description: 'Are you sure you want to delete this team? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await teamMutations.deleteTeam.mutateAsync(teamId);
          setSelectedTeamId(null);
        } catch (error) {
          console.error('Failed to delete team:', error);
        }
      }
    });
  };

  const handleRemoveMember = async (member: TeamMember) => {
    setConfirmationState({
      isOpen: true,
      title: 'Remove Team Member',
      description: `Are you sure you want to remove ${member.full_name} from the team?`,
      onConfirm: async () => {
        try {
          await removeMember.mutateAsync(member.id);
        } catch (error) {
          console.error('Failed to remove team member:', error);
        }
      }
    });
  };

  const closeConfirmDialog = () => {
    setConfirmationState(prev => ({ ...prev, isOpen: false }));
  };

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeamId(teamId);
    navigate(`/team/${teamId}`);
  };

  const handleAddSkills = async (skillNames: string[]) => {
    logger.debug('[TeamManagement] Adding skills:', {
      selectedTeamId,
      skillNames
    });

    if (!selectedTeamId) {
      logger.warn('[TeamManagement] No team selected for skill addition');
      return;
    }

    try {
      await addSkills.mutateAsync(skillNames);
      logger.debug('[TeamManagement] Skills added successfully');
    } catch (error) {
      logger.error('[TeamManagement] Failed to add skills:', error);
    }
  };

  const handleRemoveSkills = async (skillNames: string[]) => {
    logger.debug('[TeamManagement] Removing skills:', {
      selectedTeamId,
      skillNames
    });

    if (!selectedTeamId) {
      logger.warn('[TeamManagement] No team selected for skill removal');
      return;
    }

    try {
      await removeSkills.mutateAsync(skillNames);
      logger.debug('[TeamManagement] Skills removed successfully');
    } catch (error) {
      logger.error('[TeamManagement] Failed to remove skills:', error);
    }
  };

  return (
    <UIErrorBoundary boundaryName="team-management">
      <div className="team-management-layout">
        {/* Team List */}
        <Card>
          <CardHeader>
            <div className="header-layout">
              <CardTitle>Teams</CardTitle>
              {permissions.canCreate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreating(true)}
                >
                  New Team
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isCreating ? (
              <div className="vertical-stack">
                <Input
                  placeholder="Team Name"
                  value={newTeamData.name}
                  onChange={e => setNewTeamData(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Description"
                  value={newTeamData.description}
                  onChange={e => setNewTeamData(prev => ({ ...prev, description: e.target.value }))}
                />
                <div className="form-row">
                  <Button onClick={handleCreateTeam}>Create</Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="vertical-stack-sm">
                {teamList.map(team => (
                  <div
                    key={team.id}
                    className={`team-item ${
                      team.id === selectedTeamId ? 'team-item-active' : ''
                    }`}
                    onClick={() => handleTeamSelect(team.id)}
                  >
                    <div className="font-medium">{team.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {team.memberCount} members
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Details */}
        {selectedTeamId && selectedTeam ? (
          <Card>
            <CardHeader>
              <div className="header-layout">
                <CardTitle>{selectedTeam.name}</CardTitle>
                {permissions.canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTeam(selectedTeam.id)}
                  >
                    Delete Team
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="tabs-list">
                  <TabsTrigger 
                    value="details" 
                    className="tab-trigger"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="members"
                    className="tab-trigger"
                  >
                    Members
                  </TabsTrigger>
                  <TabsTrigger 
                    value="skills"
                    className="tab-trigger"
                  >
                    Skills
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                  {permissions.canEdit ? (
                    <div className="space-y-4">
                      <Input
                        placeholder="Team Name"
                        value={selectedTeam.name}
                        onChange={e =>
                          handleUpdateTeam(selectedTeam.id, {
                            name: e.target.value,
                            description: selectedTeam.description
                          })
                        }
                      />
                      <Input
                        placeholder="Description"
                        value={selectedTeam.description || ''}
                        onChange={e =>
                          handleUpdateTeam(selectedTeam.id, {
                            name: selectedTeam.name,
                            description: e.target.value
                          })
                        }
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="font-medium">Name</div>
                        <div>{selectedTeam.name}</div>
                      </div>
                      <div>
                        <div className="font-medium">Description</div>
                        <div>{selectedTeam.description}</div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="members">
                  {permissions.canManageMembers ? (
                    <div className="vertical-stack">
                      <div className="search-layer">
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const selectedUser = users.find(u => 
                            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            u.full_name.toLowerCase().includes(searchTerm.toLowerCase())
                          );
                          if (selectedUser && !members.some(m => m.id === selectedUser.id)) {
                            addMember.mutate(selectedUser.id);
                            setSearchTerm('');
                          }
                        }}>
                          <div className="form-row">
                            <div className="form-field">
                              <div className="relative flex-1">
                                <Input
                                  type="text"
                                  placeholder="Search for an agent by name or email"
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="w-full"
                                />
                                {searchTerm && (
                                  <div className="suggestion-box">
                                    <div className="suggestion-box-content">
                                      {users
                                        .filter(user => 
                                          !members.some(member => member.id === user.id) &&
                                          (user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                           user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                                        )
                                        .map(user => (
                                          <div
                                            key={user.id}
                                            className="suggestion-item"
                                            onClick={() => {
                                              addMember.mutate(user.id);
                                              setSearchTerm('');
                                            }}
                                          >
                                            <div className="font-medium">{user.full_name}</div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button type="submit">Add</Button>
                          </div>
                        </form>
                      </div>
                      <div className="content-layer vertical-stack-sm">
                        {members.map(member => (
                          <div
                            key={member.id}
                            className="member-row"
                          >
                            <div className="flex-1">
                              <div 
                                className="member-name"
                                onClick={() => navigate(`/user/${member.id}`)}
                              >
                                {member.full_name}
                              </div>
                              <div 
                                className="member-email"
                                onClick={() => navigate(`/user/${member.id}`)}
                              >
                                {member.email}
                              </div>
                            </div>
                            <div className="member-actions">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/user/${member.id}`)}
                              >
                                View Profile
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (!selectedTeamId) return;
                                  try {
                                    await assignLead.mutateAsync(member.id);
                                  } catch (error) {
                                    console.error('Failed to assign team lead:', error);
                                  }
                                }}
                                disabled={member.role === 'lead' || assignLead.isPending}
                              >
                                {member.role === 'lead' 
                                  ? 'Team Lead' 
                                  : assignLead.isPending 
                                    ? 'Updating...' 
                                    : assignLead.isError 
                                      ? 'Failed - Retry' 
                                      : 'Make Lead'}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveMember(member)}
                                disabled={member.role === 'lead'}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="vertical-stack-sm">
                      {members.map(member => (
                        <div
                          key={member.id}
                          className="readonly-member"
                        >
                          <div className="font-medium">{member.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {member.role}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="skills">
                  <SkillMatrixWithPermissions
                    directSkills={skills?.map(s => s.name) || []}
                    inheritedSkills={[]}
                    isStale={skillsLoading}
                    onAddSkills={handleAddSkills}
                    onRemoveSkills={handleRemoveSkills}
                    forceDisabled={!permissions.canEdit}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : null}
        <ConfirmDialog
          isOpen={confirmationState.isOpen}
          onClose={closeConfirmDialog}
          onConfirm={confirmationState.onConfirm}
          title={confirmationState.title}
          description={confirmationState.description}
          confirmText="Confirm"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </UIErrorBoundary>
  );
} 