import { supabase } from '@/supabaseClient'
import logger from '@/utils/logger'

export abstract class BaseApiClient {
  protected logger = logger.child({ client: this.constructor.name })

  constructor(protected supabaseClient = supabase) {
    this.logger.info('API Client initialized')
  }

  protected async handleRequest<T>(
    operation: string,
    request: Promise<{ data: T; error: any }>
  ): Promise<T> {
    try {
      const { data, error } = await request
      
      if (error) {
        this.logger.error(`${operation} failed`, { error })
        throw error
      }

      this.logger.debug(`${operation} successful`, { data })
      return data
    } catch (error) {
      this.logger.error(`${operation} failed unexpectedly`, { error })
      throw error
    }
  }

  protected abstract validateResponse(data: unknown): boolean
} 