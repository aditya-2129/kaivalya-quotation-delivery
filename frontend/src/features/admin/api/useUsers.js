import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/users';
import { authService } from '@/services/auth';

/**
 * Hook for listing all users
 */
export const useUsers = (limit = 100, offset = 0) => {
  return useQuery({
    queryKey: ['users', { limit, offset }],
    queryFn: () => userService.listUsers(limit, offset),
  });
};

/**
 * Hook for creating a user (Auth + Profile)
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password, name, mobile, role }) => {
      // 1. Create Auth Account
      const authUser = await authService.createAuthAccount(email, password, name);
      // 2. Create User Profile
      return await userService.createUser({
        name,
        email,
        mobile,
        role,
        auth_id: authUser.userId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * Hook for updating a user profile
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * Hook for deleting a user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * Hook for resetting a user's password
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ authId, newPassword }) => authService.resetUserPassword(authId, newPassword),
  });
};
