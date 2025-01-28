import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/useAuth"

export function UserMenu() {
  const { profile, signOut } = useAuth()
  
  if (!profile) return null

  const initials = profile.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || profile.email[0].toUpperCase()

  console.log('Profile data:', { 
    full_name: profile.full_name,
    email: profile.email,
    avatar_url: profile.avatar_url 
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name || profile.email} />
            ) : (
              <AvatarFallback>{initials}</AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1">
            {profile.full_name && (
              <p className="text-sm font-medium leading-none">{profile.full_name}</p>
            )}
            <p className="text-xs leading-none text-muted-foreground">
              {profile.email}
            </p>
          </div>
        </div>
        <DropdownMenuItem onClick={() => signOut()}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 