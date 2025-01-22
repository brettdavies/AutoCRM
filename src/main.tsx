import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@/shared/styles/global/index.css'
import { UIErrorBoundary } from '@/features/error-handling/boundaries/UIErrorBoundary'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <UIErrorBoundary boundaryName="root">
      <App />
    </UIErrorBoundary>
  </React.StrictMode>
) 