import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/components/AuthProvider'
import { Auth } from '@/features/auth/components/Auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { TicketManagement } from '@/features/tickets/pages/TicketManagement'
import { TicketCreationPage } from '@/features/tickets/pages/TicketCreationPage'
import { TicketDetailsPage } from '@/features/tickets/pages/TicketDetailsPage'
import '@/shared/styles/global/index.css'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function MainLayout() {
  const { session, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">AutoCRM</h1>
          {session && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/ticket/new" element={<TicketCreationPage />} />
          <Route path="/ticket/:id" element={<TicketDetailsPage />} />
          <Route path="/ticket" element={<TicketManagement />} />
          <Route path="/" element={<TicketManagement />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Auth>
            <MainLayout />
          </Auth>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
} 