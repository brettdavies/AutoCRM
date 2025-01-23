import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
} from '@/shared/components';
import { useTeams } from '../hooks/useTeams';

interface TeamSelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
}

export function TeamSelect({ value, onChange, error }: TeamSelectProps) {
  const { data: teams } = useTeams();

  return (
    <div className="space-y-2">
      <Label htmlFor="team">Assign Team</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="team" className={error ? 'border-destructive' : ''}>
          <SelectValue placeholder="Select a team" />
        </SelectTrigger>
        <SelectContent>
          {teams?.map(team => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
} 