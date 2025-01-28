import { QueryBuilder } from 'react-querybuilder';
import type { Skill } from '../types/skill.types';
import 'react-querybuilder/dist/query-builder.css';

interface SkillQueryBuilderProps {
  onQueryChange: (query: any) => void;
  initialQuery?: any;
  skills: Skill[];
}

export function SkillQueryBuilder({ onQueryChange, initialQuery, skills }: SkillQueryBuilderProps) {
  const fields = [
    { name: 'name', label: 'Name' },
    { 
      name: 'category', 
      label: 'Category',
      valueEditorType: 'select',
      values: [...new Set(skills.map(skill => skill.category))]
    },
    { name: 'source', label: 'Source' }
  ];

  return (
    <QueryBuilder
      fields={fields}
      onQueryChange={onQueryChange}
      defaultQuery={initialQuery}
    />
  );
} 