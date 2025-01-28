import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpDown, ArrowUp, ArrowDown, X } from "lucide-react";
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { User } from '../types/user.types';
import { UIErrorBoundary } from '@/features/error-handling/components/ErrorBoundary';
import { useTickets } from '@/features/tickets/hooks/useTickets';
import { useTeamMembers } from '@/features/teams/hooks/useTeams';
import type { Ticket } from '@/features/tickets/types/ticket.types';

type SortField = 'id' | 'full_name' | 'email' | 'user_role' | 'created_at';
type SortOrder = 'asc' | 'desc' | 'off';

export function UserListPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('full_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: users, isLoading, error } = useUsers();
  const { tickets: allTickets } = useTickets(profile?.id ? {
    agentId: profile.id
  } : {});

  // Get team members for teams where the user is lead
  const { members: teamMembers = [] } = useTeamMembers(profile?.team_id ?? '');
  const isTeamLead = teamMembers.some(member => 
    member.id === profile?.id && member.role === 'lead'
  );

  if (!profile) return null;

  const filteredUsers = users?.filter((user: User) => {
    // Role-based access control
    if (profile.user_role !== 'admin') {
      if (isTeamLead) {
        // Team leads can only see themselves for now
        return user.id === profile.id;
      }
      
      if (profile.user_role === 'agent') {
        // Get all customer IDs from tickets assigned to this agent
        const customerIds = allTickets?.map((ticket: Ticket) => ticket.created_by) || [];
        // Agents can see:
        // 1. Themselves
        // 2. Customers from their assigned tickets
        return user.id === profile.id || customerIds.includes(user.id);
      }
      
      // Regular users can only see themselves
      return user.id === profile.id;
    }

    // Filter by role if selected
    if (roleFilter !== 'all' && user.user_role !== roleFilter) {
      return false;
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        user.id.toLowerCase().includes(searchLower) ||
        user.full_name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Sort users
  const sortedUsers = [...(filteredUsers || [])].sort((a, b) => {
    if (sortOrder === 'off') {
      return a.full_name.localeCompare(b.full_name);
    }

    if (sortField === 'created_at') {
      const aDate = a.created_at ? new Date(a.created_at) : new Date(0);
      const bDate = b.created_at ? new Date(b.created_at) : new Date(0);
      return (sortOrder === 'asc' ? 1 : -1) * (aDate.getTime() - bDate.getTime());
    }
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (!aValue && !bValue) return 0;
    if (!aValue) return sortOrder === 'asc' ? -1 : 1;
    if (!bValue) return sortOrder === 'asc' ? 1 : -1;
    
    return (sortOrder === 'asc' ? 1 : -1) * aValue.localeCompare(bValue);
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> off
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortOrder('off');
        setSortField('full_name');
      } else {
        setSortOrder('asc');
        setSortField(field);
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field || sortOrder === 'off') {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortOrder === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-1" /> : 
      <ArrowDown className="h-4 w-4 ml-1" />;
  };

  return (
    <UIErrorBoundary boundaryName="user-list">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Users</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-80 pr-8"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Role: {roleFilter === 'all' ? 'All' : roleFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setRoleFilter('all')}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter('admin')}>
                    Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter('agent')}>
                    Agent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter('customer')}>
                    Customer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div>Loading users...</div>
        ) : error ? (
          <div>Error loading users: {error.message}</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => toggleSort('id')} className="cursor-pointer w-[200px]">
                    <div className="flex items-center">
                      ID {getSortIcon('id')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort('full_name')} className="cursor-pointer">
                    <div className="flex items-center">
                      User {getSortIcon('full_name')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort('email')} className="cursor-pointer">
                    <div className="flex items-center">
                      Email {getSortIcon('email')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort('user_role')} className="cursor-pointer">
                    <div className="flex items-center">
                      Role {getSortIcon('user_role')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => toggleSort('created_at')} className="cursor-pointer">
                    <div className="flex items-center">
                      Joined {getSortIcon('created_at')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/user/${user.id}`)}
                  >
                    <TableCell className="font-mono text-sm">
                      {user.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url} alt={user.full_name} />
                          <AvatarFallback>
                            {user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.user_role}</TableCell>
                    <TableCell>
                      {user.created_at 
                        ? new Date(user.created_at).toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </UIErrorBoundary>
  );
} 