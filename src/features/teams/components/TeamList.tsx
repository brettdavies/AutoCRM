import React from 'react';
import type { TeamListItem } from '../types/team.types';

interface TeamListProps {
  teams: TeamListItem[];
  onTeamSelect?: (teamId: string) => void;
}

const TeamList: React.FC<TeamListProps> = ({ teams, onTeamSelect }) => {
  return (
    <div className="space-y-2">
      {teams.map((team) => (
        <div
          key={team.id}
          className="p-2 rounded cursor-pointer hover:bg-accent"
          onClick={() => onTeamSelect?.(team.id)}
        >
          <div className="font-medium">{team.name}</div>
          <div className="text-sm text-muted-foreground">
            {team.memberCount} members
          </div>
        </div>
      ))}
    </div>
  );
};

export { TeamList }; 