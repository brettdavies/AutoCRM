import React from 'react';
import type { Skill } from '../types/skill.types';

interface SkillListProps {
  skills: Skill[];
}

const SkillList: React.FC<SkillListProps> = ({ skills }) => {
  return (
    <div>
      <h2>Skill List</h2>
      <ul>
        {skills.map((skill) => (
          <li key={skill.id}>{skill.name}</li>
        ))}
      </ul>
    </div>
  );
};

export { SkillList }; 