import { Select } from '@/shared/components';
import { useTeams } from '../hooks/useTeams';

interface TeamSelectProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TeamSelect({ value, onChange, error }: TeamSelectProps) {
  const { data: teams } = useTeams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-1">
      <Select
        id="team"
        name="team"
        label="Assign Team"
        value={value}
        onChange={handleChange}
        error={error}
      >
        <option value="">Select a team</option>
        {teams?.map(team => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </Select>
    </div>
  );
} 