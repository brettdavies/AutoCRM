import * as ScrollArea from '@radix-ui/react-scroll-area';
import { useCallback, useState } from 'react';
import { SkillInput } from './SkillInput';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InheritedSkillInfo {
  name: string;
  teams: { id: string; name: string }[];
}

interface SkillMatrixProps {
  directSkills: string[];
  inheritedSkills: InheritedSkillInfo[];
  isStale?: boolean;
  onAddSkills?: ((skills: string[]) => void) | undefined;
  onRemoveSkills?: ((skills: string[]) => void) | undefined;
  disabled?: boolean;
  context?: 'user' | 'team';
}

export function SkillMatrix({ 
  directSkills, 
  inheritedSkills = [], 
  onAddSkills,
  onRemoveSkills,
  disabled = false,
  context = 'team'
}: SkillMatrixProps) {
  const [openTooltips, setOpenTooltips] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState({
    showDirect: false,
    showInherited: false
  });

  const toggleTooltip = useCallback((skillName: string) => {
    setOpenTooltips(prev => ({
      ...prev,
      [skillName]: !prev[skillName]
    }));
  }, []);

  const toggleFilter = useCallback((filterType: 'showDirect' | 'showInherited') => {
    setFilters(prev => {
      // If turning on a filter when both are off, just turn that one on
      if (!prev.showDirect && !prev.showInherited) {
        return { ...prev, [filterType]: true };
      }
      
      // If turning on a filter when the other is on, turn both off
      if ((filterType === 'showDirect' && prev.showInherited) || 
          (filterType === 'showInherited' && prev.showDirect)) {
        return { showDirect: false, showInherited: false };
      }
      
      // Toggle the selected filter
      return { ...prev, [filterType]: !prev[filterType] };
    });
  }, []);

  const handleSkillsChange = useCallback((newSkills: string[]) => {
    console.log('=== SkillMatrix Change Handler ===');
    console.log('📥 Current directSkills:', directSkills);
    console.log('📥 New skills:', newSkills);
    
    // Find skills to add (in new list but not in current)
    const skillsToAdd = newSkills.filter(s => !directSkills.includes(s));
    // Find skills to remove (in current but not in new)
    const skillsToRemove = directSkills.filter(s => !newSkills.includes(s));
    
    console.log('📊 Change analysis:', {
      skillsToAdd,
      skillsToRemove
    });
    
    if (skillsToAdd.length > 0 && onAddSkills) {
      console.log('📤 Calling onAddSkills with:', skillsToAdd);
      onAddSkills(skillsToAdd);
    }
    
    if (skillsToRemove.length > 0 && onRemoveSkills) {
      console.log('📤 Calling onRemoveSkills with:', skillsToRemove);
      onRemoveSkills(skillsToRemove);
    }
  }, [onAddSkills, onRemoveSkills, directSkills]);

  // Combine and filter skills for display
  const allSkills = [
    ...directSkills.map(skill => ({ name: skill, type: 'direct' as const })),
    ...inheritedSkills.map(skill => ({ name: skill.name, type: 'inherited' as const, teams: skill.teams }))
  ]
  .filter(skill => {
    if (!filters.showDirect && !filters.showInherited) return true;
    if (filters.showDirect && skill.type === 'direct') return true;
    if (filters.showInherited && skill.type === 'inherited') return true;
    return false;
  })
  .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ScrollArea.Root className="skill-matrix-container">
      <ScrollArea.Viewport className="skill-matrix-viewport">
        <div className="skill-matrix-content">
          <section>
            <div className="skill-matrix-header">
              <h3 className="skill-matrix-title">Skills</h3>
              {context === 'user' && (
                <div className="skill-matrix-filters">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFilter('showDirect')}
                    className={cn(
                      filters.showDirect && "bg-secondary"
                    )}
                  >
                    Direct
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFilter('showInherited')}
                    className={cn(
                      filters.showInherited && "bg-secondary"
                    )}
                  >
                    Inherited
                  </Button>
                </div>
              )}
            </div>
            <div className="skill-matrix-content">
              {!disabled && (
                <SkillInput
                  skills={allSkills.map(s => s.name)}
                  onChange={handleSkillsChange}
                  variant="direct"
                  disabled={disabled ?? false}
                />
              )}
              <div className="skill-matrix-badges">
                {allSkills.map((skill) => (
                  skill.type === 'direct' ? (
                    <Badge
                      key={`direct-${skill.name}`}
                      variant="default"
                      className="skill-badge-direct"
                    >
                      {skill.name}
                      {!disabled && (
                        <button
                          onClick={() => onRemoveSkills?.([skill.name])}
                          className="skill-badge-direct-remove"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ) : (
                    <TooltipProvider key={`inherited-${skill.name}`}>
                      <Tooltip 
                        open={openTooltips[skill.name] ?? false}
                        onOpenChange={(open) => setOpenTooltips(prev => ({ ...prev, [skill.name]: open }))}
                      >
                        <TooltipTrigger asChild>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "skill-badge-inherited",
                              openTooltips[skill.name] && "skill-badge-inherited-active"
                            )}
                            tabIndex={0}
                            role="button"
                            onClick={() => toggleTooltip(skill.name)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleTooltip(skill.name);
                              }
                            }}
                          >
                            {skill.name}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          align="center"
                          onPointerDownOutside={() => setOpenTooltips(prev => ({ ...prev, [skill.name]: false }))}
                        >
                          <p className="font-medium">Inherited from teams:</p>
                          <ul className="list-disc list-inside">
                            {skill.teams.map(team => (
                              <li key={team.id}>{team.name}</li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                ))}
              </div>
            </div>
          </section>
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical">
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}

export type { SkillMatrixProps, InheritedSkillInfo }; 