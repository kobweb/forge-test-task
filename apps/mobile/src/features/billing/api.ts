import { entitlementSchema, routes, type Entitlement, type ProductId } from '@forge/contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, type ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useSession } from '@/stores/session-store';

export function useEntitlement() {
  const token = useSession((state) => state.token);
  return useQuery<Entitlement, ApiError>({
    queryKey: queryKeys.entitlement,
    queryFn: () => apiRequest('GET', routes.billing.entitlement, entitlementSchema),
    enabled: token !== null,
  });
}

export function usePurchase() {
  return useMutation<Entitlement, ApiError, ProductId>({
    mutationFn: (productId) =>
      apiRequest('POST', routes.billing.mockPurchase, entitlementSchema, { productId }),
    onSuccess: (entitlement) => queryClient.setQueryData(queryKeys.entitlement, entitlement),
  });
}

export function useRestorePurchases() {
  return useMutation<Entitlement, ApiError, void>({
    mutationFn: () => apiRequest('POST', routes.billing.mockRestore, entitlementSchema),
    onSuccess: (entitlement) => queryClient.setQueryData(queryKeys.entitlement, entitlement),
  });
}
