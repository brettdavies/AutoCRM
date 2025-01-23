import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/components/AuthProvider'
import { Auth } from '@/features/auth/components/Auth'
import { SignUp } from '@/features/auth/components/SignUp'
import { AuthCallback } from '@/features/auth/components/AuthCallback'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { TicketManagement } from '@/features/tickets/pages/TicketManagement'
import { TicketCreationPage } from '@/features/tickets/pages/TicketCreationPage'
import { TicketDetailsPage } from '@/features/tickets/pages/TicketDetailsPage'
import '@/shared/styles/global/index.css'
import { Button } from '@/shared/components'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppContent() {
  const { session, signOut } = useAuth()

  if (!session) {
    return (
      <Routes>
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="font-bold">AutoCRM</span>
            </a>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2">
            <nav className="flex items-center space-x-6">
              <a href="/ticket" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Tickets
              </a>
              <a href="/ticket/create" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Create Ticket
              </a>
            </nav>
            <Button variant="outline" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Routes>
          <Route path="/" element={<TicketManagement />} />
          <Route path="/ticket" element={<TicketManagement />} />
          <Route path="/ticket/create" element={<TicketCreationPage />} />
          <Route path="/ticket/:ticketId" element={<TicketDetailsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App; 