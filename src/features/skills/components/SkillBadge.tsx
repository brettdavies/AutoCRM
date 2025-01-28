import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Badge } from '@/shared/components';
import type { Skill } from '../types/skill.types';

const skillBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        direct: 'bg-primary text-primary-foreground',
        inherited: 'bg-muted text-muted-foreground',
        stale: 'bg-muted text-muted-foreground opacity-60'
      },
      size: {
        default: 'h-6',
        sm: 'h-5'
      }
    },
    defaultVariants: {
      variant: 'direct',
      size: 'default'
    }
  }
);

interface SkillBadgeProps extends VariantProps<typeof skillBadgeVariants> {
  skill: Skill;
  count?: number;
  className?: string;
  teams?: string[];
}

export function SkillBadge({ skill, count, className, variant, size, teams }: SkillBadgeProps) {
  return (
    <span
      className={cn(skillBadgeVariants({ variant, size }), className)}
      title={teams ? `From teams: ${teams.join(', ')}` : undefined}
    >
      {skill.name}
      {count && count > 1 && <span className="ml-1 opacity-60">x{count}</span>}
    </span>
  );
} 