import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/components/AuthProvider'
import { Auth } from '@/features/auth/components/Auth'
import { SignUp } from '@/features/auth/components/SignUp'
import { AuthCallback } from '@/features/auth/components/AuthCallback'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { TicketManagement } from '@/features/tickets/pages/TicketManagement'
import { TicketCreationPage } from '@/features/tickets/pages/TicketCreationPage'
import { TicketDetailsPage } from '@/features/tickets/pages/TicketDetailsPage'
import { TeamManagementPage } from '@/features/teams/pages/TeamManagementPage'
import { SkillManagementPage } from '@/features/skills/pages/SkillManagementPage'
import { RoleProtectedRoute } from '@/features/auth/components/protection/RoleProtectedRoute'
import { Button } from '@/shared/components'
import { Sun, Moon } from 'lucide-react'
import { UserDetailsPage } from '@/features/users/pages/UserDetailsPage'
import { UserMenu } from '@/features/users/components/UserMenu'
import { UserListPage } from '@/features/users/pages/UserListPage'
import { Toaster } from '@/components/ui/toaster'

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
  const { session, profile } = useAuth()
  const isAdmin = profile?.user_role === 'admin'
  const isAgent = profile?.user_role === 'agent'
  
  console.log('[AppContent] Profile:', profile)
  console.log('[AppContent] Is Admin:', isAdmin)

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
              <Link to="/ticket" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Tickets
              </Link>
              <Link to="/ticket/create" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Create Ticket
              </Link>
              {(isAdmin || isAgent) && (
                <>
                  <Link to="/user" className="text-sm font-medium text-muted-foreground hover:text-primary">
                    Users
                  </Link>
                  <Link to="/team" className="text-sm font-medium text-muted-foreground hover:text-primary">
                    Teams
                  </Link>
                  <Link to="/admin/skills" className="text-sm font-medium text-muted-foreground hover:text-primary">
                    Skills
                  </Link>
                </>
              )}
            </nav>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  document.documentElement.classList.toggle('dark');
                }}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Routes>
          <Route path="/" element={<TicketManagement />} />
          <Route path="/ticket" element={<TicketManagement />} />
          <Route path="/ticket/create" element={<TicketCreationPage />} />
          <Route path="/ticket/:ticketId" element={<TicketDetailsPage />} />
          
          {/* Protected Routes */}
          <Route 
            path="/team/:teamId" 
            element={
              <RoleProtectedRoute 
                allowedRoles={['admin', 'agent']} 
                fallbackPath="/"
                loadingComponent={<div>Loading...</div>}
                unauthorizedPath="/"
              >
                <TeamManagementPage />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="/team" 
            element={
              <RoleProtectedRoute 
                allowedRoles={['admin', 'agent']} 
                fallbackPath="/"
                loadingComponent={<div>Loading...</div>}
                unauthorizedPath="/"
              >
                <TeamManagementPage />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="/admin/skills" 
            element={
              <RoleProtectedRoute 
                allowedRoles={['admin', 'agent']} 
                fallbackPath="/"
                loadingComponent={<div>Loading...</div>}
                unauthorizedPath="/"
              >
                <SkillManagementPage />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="/user" 
            element={
              <RoleProtectedRoute 
                allowedRoles={['admin', 'agent']} 
                fallbackPath="/"
                loadingComponent={<div>Loading...</div>}
                unauthorizedPath="/"
              >
                <UserListPage />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="/user/:userId" 
            element={
              <RoleProtectedRoute 
                allowedRoles={['admin', 'agent']} 
                fallbackPath="/"
                loadingComponent={<div>Loading...</div>}
                unauthorizedPath="/"
              >
                <UserDetailsPage />
              </RoleProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
} 