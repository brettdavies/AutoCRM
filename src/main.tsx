import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/global.css'
import { UIErrorBoundary } from '@/features/error-handling/components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <UIErrorBoundary boundaryName="root">
      <App />
    </UIErrorBoundary>
  </React.StrictMode>
) 