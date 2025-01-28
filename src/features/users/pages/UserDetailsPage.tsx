import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUser } from '../hooks/useUser';
import { useUserTeams } from '../hooks/useUserTeams';
import { useEntitySkills } from '@/features/skills/hooks/useSkills';
import { SkillMatrix } from '@/features/skills/components/SkillMatrix';
import type { InheritedSkillInfo } from '@/features/skills/components/SkillMatrix';
import { UIErrorBoundary } from '@/features/error-handling/components/ErrorBoundary';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { TeamMembership } from '../types/user.types';
import logger from '@/shared/utils/logger.utils';

interface EditUserData {
  full_name: string;
  email: string;
  user_role: 'admin' | 'agent' | 'customer';
}

interface ConfirmationState {
  isOpen: boolean;
  team: TeamMembership | null;
}

export function UserDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EditUserData | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmationState>({
    isOpen: false,
    team: null
  });

  const { user, updateUser } = useUser(userId ?? '');
  const { data: teams = [], isLoading: teamsLoading } = useUserTeams(userId ?? '');
  const { 
    skills: directSkills, 
    isLoading: directSkillsLoading,
    addSkills,
    removeSkills 
  } = useEntitySkills(userId ?? '', 'agent');

  logger.debug('[UserDetailsPage] Raw data:', {
    userId,
    teamsCount: teams.length,
    teams: teams.map(t => ({
      id: t.id,
      name: t.name,
      skillsCount: t.skills?.length || 0,
      skills: t.skills
    })),
    directSkillsCount: directSkills?.length || 0,
    directSkills
  });

  // Process inherited skills from teams
  const inheritedSkills: InheritedSkillInfo[] = teams?.reduce<InheritedSkillInfo[]>((acc, team) => {
    // Get skills from each team
    const teamSkills = team.skills || [];
    
    logger.debug('[UserDetailsPage] Processing team skills:', {
      teamId: team.id,
      teamName: team.name,
      rawSkills: teamSkills
    });
    
    // Add each skill with team info
    teamSkills.forEach(skill => {
      const existingSkill = acc.find(s => s.name === skill.name);
      if (existingSkill) {
        // Add team to existing skill if not already present
        if (!existingSkill.teams.some(t => t.id === team.id)) {
          existingSkill.teams.push({ id: team.id, name: team.name });
          logger.debug('[UserDetailsPage] Added team to existing skill:', {
            skillName: skill.name,
            teamId: team.id,
            teamName: team.name
          });
        }
      } else {
        // Add new inherited skill
        acc.push({
          name: skill.name,
          teams: [{ id: team.id, name: team.name }]
        });
        logger.debug('[UserDetailsPage] Added new inherited skill:', {
          skillName: skill.name,
          teamId: team.id,
          teamName: team.name
        });
      }
    });
    
    return acc;
  }, []);

  logger.debug('[UserDetailsPage] Final processed data:', {
    inheritedSkillsCount: inheritedSkills.length,
    inheritedSkills,
    directSkillsCount: directSkills?.length || 0,
    directSkills: directSkills?.map(s => s.name)
  });

  const handleEditClick = () => {
    if (!user) return;
    setEditData({
      full_name: user.full_name,
      email: user.email,
      user_role: user.user_role
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editData || !userId) return;
    try {
      await updateUser.mutateAsync({
        id: userId,
        ...editData
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleRemoveFromTeam = async (team: TeamMembership) => {
    if (team.role === 'lead') return;
    setConfirmState({
      isOpen: true,
      team
    });
  };

  const handleConfirmRemove = async () => {
    if (!confirmState.team) return;
    try {
      // Call your remove member mutation here
      // await removeMember.mutateAsync({ teamId: confirmState.team.id, userId });
    } catch (error) {
      console.error('Failed to remove team member:', error);
    } finally {
      setConfirmState({ isOpen: false, team: null });
    }
  };

  const handleAddSkills = async (skillNames: string[]) => {
    if (!userId) return;
    try {
      await addSkills.mutateAsync(skillNames);
    } catch (error) {
      console.error('Failed to add skills:', error);
    }
  };

  const handleRemoveSkills = async (skillNames: string[]) => {
    if (!userId) return;
    try {
      await removeSkills.mutateAsync(skillNames);
    } catch (error) {
      console.error('Failed to remove skills:', error);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <UIErrorBoundary boundaryName="user-details">
      <div className="space-y-6">
        {/* User Details Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar_url} alt={user.full_name} />
                <AvatarFallback className="text-2xl font-bold">
                  {(user.full_name || user.email || '??').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle>{user.full_name || 'Unnamed User'}</CardTitle>
            </div>
            <Button
              variant="outline"
              onClick={handleEditClick}
            >
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-medium">Email</div>
              <div>{user.email}</div>
            </div>
            <div>
              <div className="font-medium">Role</div>
              <div className="capitalize">{user.user_role || 'Not set'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Teams Card */}
        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
          </CardHeader>
          <CardContent>
            {teamsLoading ? (
              <div>Loading teams...</div>
            ) : teams?.length ? (
              <div className="space-y-2">
                {teams.map(team => (
                  <div
                    key={team.id}
                    className="team-membership-row"
                  >
                    <div className="team-membership-content">
                      <div>
                        <div className="team-membership-name">{team.name}</div>
                        {team.description && (
                          <div className="team-membership-description">
                            {team.description}
                          </div>
                        )}
                      </div>
                      <div className="team-membership-role">
                        {team.role === 'lead' ? 'Team Lead' : 'Member'}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveFromTeam(team)}
                      disabled={team.role === 'lead'}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">No team memberships</div>
            )}
          </CardContent>
        </Card>

        {/* Skills Card */}
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {directSkillsLoading || teamsLoading ? (
              <div>Loading skills...</div>
            ) : (
              <SkillMatrix
                directSkills={directSkills?.map(s => s.name) || []}
                inheritedSkills={inheritedSkills}
                isStale={false}
                onAddSkills={handleAddSkills}
                onRemoveSkills={handleRemoveSkills}
                disabled={false}
                context="user"
              />
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Make changes to the user's information below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="font-medium">Full Name</div>
                <Input
                  value={editData?.full_name ?? ''}
                  onChange={e => setEditData(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">Email</div>
                <Input
                  value={editData?.email ?? ''}
                  onChange={e => setEditData(prev => prev ? { ...prev, email: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <div className="font-medium">Role</div>
                <Input
                  value={editData?.user_role ?? ''}
                  className="capitalize"
                  disabled
                  readOnly
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog 
          open={confirmState.isOpen} 
          onOpenChange={(open: boolean) => !open && setConfirmState({ isOpen: false, team: null })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove from Team</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this user from {confirmState.team?.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmRemove}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </UIErrorBoundary>
  );
} 