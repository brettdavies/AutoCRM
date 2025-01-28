import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SkillInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  variant?: 'direct' | 'inherited';
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const validateSkill = (skill: string): string => {
  console.log('🔍 Validating skill input:', skill);
  // Convert to lowercase and replace spaces with underscores
  let processed = skill.toLowerCase().replace(/\s+/g, '_');
  console.log('👉 After lowercase/space processing:', processed);
  
  // Remove any non-alphanumeric characters (except underscores)
  processed = processed.replace(/[^a-z0-9_]/g, '');
  console.log('👉 After character cleanup:', processed);
  
  // Truncate to 50 characters if necessary
  processed = processed.slice(0, 50);
  console.log('✨ Final validated skill:', processed);
  return processed;
};

export function SkillInput({
  skills,
  onChange,
  variant = 'direct',
  className,
  placeholder = 'Type a skill and press Enter...',
  disabled = false
}: SkillInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      
      const validatedSkill = validateSkill(inputValue);
      
      if (validatedSkill && !skills.includes(validatedSkill)) {
        onChange([...skills, validatedSkill]);
      }
      setInputValue('');
    }
  }, [inputValue, skills, onChange]);

  return (
    <div className={cn('w-full', className)}>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
} 