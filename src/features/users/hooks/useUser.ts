import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService } from '../services/UserService';
import type { User, UserUpdate } from '../types/user.types';

export function useUser(userId: string) {
  const queryClient = useQueryClient();
  const userService = new UserService();

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['user', userId],
    queryFn: () => userService.getUser(userId),
    enabled: !!userId,
  });

  const updateUser = useMutation({
    mutationFn: (data: UserUpdate) => userService.updateUser(data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user', userId], updatedUser);
    },
  });

  return {
    user,
    isLoading,
    error,
    updateUser,
  };
} 