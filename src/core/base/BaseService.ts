import logger from '@/utils/logger'
import { Database } from '@/types/database.types'

export abstract class BaseService {
  protected logger = logger.child({ service: this.constructor.name })
  
  constructor(protected db: Database['public']) {
    this.logger.info('Service initialized')
  }

  protected async handleError<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      this.logger.error(errorMessage, { error })
      throw error
    }
  }

  protected abstract validate(): Promise<boolean>
} 