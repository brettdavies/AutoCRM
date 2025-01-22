import logger from './logger'

// Handle uncaught promises
const setupUnhandledRejectionHandler = () => {
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', {
      reason: event.reason,
      promise: event.promise
    })
  })
}

// Handle runtime errors
const setupErrorHandler = () => {
  window.addEventListener('error', (event) => {
    logger.error('Runtime Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    })
  })
}

export const setupErrorHandlers = () => {
  setupUnhandledRejectionHandler()
  setupErrorHandler()
} 