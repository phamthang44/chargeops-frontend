import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi, type UserProfile, type UserProfileUpdateRequest } from '@chargeops/api';

export function useUserProfile() {
  const api = useApi();
  const queryClient = useQueryClient();

  const profileQuery = useQuery<UserProfile>({
    queryKey: ['user-profile', 'me'],
    queryFn: () => api.profile.get(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const updateMutation = useMutation<UserProfile, Error, UserProfileUpdateRequest>({
    mutationFn: (payload: UserProfileUpdateRequest) => api.profile.update(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['user-profile', 'me'], updated);
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    avatarUrl: profileQuery.data?.avatarUrl ?? null,
    refetch: profileQuery.refetch,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
