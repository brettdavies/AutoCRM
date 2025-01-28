import { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '../types';
import { handleValidationError } from '../utils/handlers';
import { SkillService } from '@/features/skills/services/SkillService';

const skillService = new SkillService();

/**
 * Middleware for handling skill validation
 */
export const skillValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const skills = Array.isArray(req.body.skills) ? req.body.skills : [req.body.skill];
    
    // Validate skills
    const { values, errors } = skillService.validateSkills(skills);
    
    if (errors.length > 0) {
      return res.status(400).json({
        code: ErrorCode.INVALID_FORMAT,
        message: 'Skill validation failed',
        errors: errors.map(error => {
          const validationError = handleValidationError(
            error.error,
            `skills[${error.index}]`,
            skills[error.index]
          );
          return {
            field: validationError.field,
            message: validationError.message,
            value: validationError.value
          };
        })
      });
    }
    
    // Replace original skills with validated ones
    req.body.skills = values;
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Middleware for handling single skill validation
 */
export const singleSkillValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const skill = req.body.skill;
    
    // Validate single skill
    const { value, error } = skillService.validateSkill(skill);
    
    if (error) {
      const validationError = handleValidationError(
        error,
        'skill',
        skill
      );
      
      return res.status(400).json({
        code: ErrorCode.INVALID_FORMAT,
        message: 'Skill validation failed',
        error: {
          field: validationError.field,
          message: validationError.message,
          value: validationError.value
        }
      });
    }
    
    // Replace original skill with validated one
    req.body.skill = value;
    return next();
  } catch (error) {
    return next(error);
  }
}; 