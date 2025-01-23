import { useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { DemoLogin } from './DemoLogin'
import { Login } from './Login'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/shared/components'

export function Auth() {
    const { session, signOut } = useAuth()

    useEffect(() => {
        console.log('Auth component mounted')
        return () => {
            console.log('Auth component unmounted')
        }
    }, [])

    if (session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-muted">
                <Button
                    variant="destructive"
                    onClick={() => signOut()}
                >
                    Sign Out
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted">
            <div className="w-full max-w-5xl px-4">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">
                            Welcome to AutoCRM
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Login />
                            <DemoLogin />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 