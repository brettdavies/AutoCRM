import { useCallback } from 'react'
import logger from './logger.utils'

export const useLogger = (component?: string) => {
  const prefix = component ? `[${component}]` : ''

  const debug = useCallback((message: string, meta?: object) => {
    logger.debug(`${prefix} ${message}`, meta)
  }, [prefix])

  const info = useCallback((message: string, meta?: object) => {
    logger.info(`${prefix} ${message}`, meta)
  }, [prefix])

  const warn = useCallback((message: string, meta?: object) => {
    logger.warn(`${prefix} ${message}`, meta)
  }, [prefix])

  const error = useCallback((message: string, error?: Error | unknown, meta?: object) => {
    if (error instanceof Error) {
      logger.error(`${prefix} ${message}`, {
        ...meta,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      })
    } else {
      logger.error(`${prefix} ${message}`, { ...meta, error })
    }
  }, [prefix])

  const http = useCallback((message: string, meta?: object) => {
    logger.http(`${prefix} ${message}`, meta)
  }, [prefix])

  return {
    debug,
    info,
    warn,
    error,
    http
  }
} 