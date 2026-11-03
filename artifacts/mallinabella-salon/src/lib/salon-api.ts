import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import * as store from './salon-store';
import type {
  BookingInput,
  BookingUpdate,
  CampaignInput,
  ClientInput,
  GetAvailabilityParams,
  ListClientsParams,
  ServiceInput,
  ServiceUpdate,
} from './salon-types';

export type {
  Booking,
  CampaignInput,
  CampaignSendResult,
  Client,
  ClientInput,
  DashboardSummary,
  GetAvailabilityParams,
  ListClientsParams,
  PromotionCampaign,
  Service,
  ServiceInput,
  ServiceUpdate,
  Stylist,
  TimeSlot,
} from './salon-types';

type MutateOptions<T> = {
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
};

function useStoreVersion() {
  return useSyncExternalStore(
    store.subscribeStore,
    () => {
      if (typeof window === 'undefined') return 'ssr';
      return window.localStorage.getItem('marina-bella-salon-v1') ?? 'empty';
    },
    () => 'ssr',
  );
}

function useLocalQuery<T>(read: () => T, enabled = true) {
  const version = useStoreVersion();
  const [tick, setTick] = useState(0);
  const data = useMemo(() => (enabled ? read() : undefined), [enabled, read, version, tick]);
  const refetch = useCallback(() => setTick((value) => value + 1), []);
  return {
    data,
    isLoading: false,
    isError: false,
    refetch,
  };
}

function useLocalMutation<TArgs, TResult>(action: (args: TArgs) => TResult) {
  const [isPending, setIsPending] = useState(false);
  const mutate = useCallback(
    (args: TArgs, options?: MutateOptions<TResult>) => {
      setIsPending(true);
      try {
        const result = action(args);
        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        options?.onError?.(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [action],
  );
  return { mutate, isPending };
}

export function getListServicesQueryKey() {
  return ['local', 'services'] as const;
}
export function getListBookingsQueryKey() {
  return ['local', 'bookings'] as const;
}
export function getListClientsQueryKey() {
  return ['local', 'clients'] as const;
}
export function getListCampaignsQueryKey() {
  return ['local', 'campaigns'] as const;
}
export function getGetDashboardSummaryQueryKey() {
  return ['local', 'dashboard'] as const;
}
export function getGetMyBookingsQueryKey() {
  return ['local', 'my-bookings'] as const;
}
export function getGetAvailabilityQueryKey(params: GetAvailabilityParams) {
  return ['local', 'availability', params] as const;
}

export function useListServices() {
  const read = useCallback(() => store.listServices(), []);
  return useLocalQuery(read);
}

export function useListStylists() {
  const read = useCallback(() => store.listStylists(), []);
  return useLocalQuery(read);
}

export function useListBookings() {
  const read = useCallback(() => store.listBookings(), []);
  return useLocalQuery(read);
}

export function useGetMyBookings(_options?: unknown) {
  const read = useCallback(() => store.listMyBookings(), []);
  return useLocalQuery(read);
}

export function useListClients(params?: ListClientsParams) {
  const search = params?.search;
  const read = useCallback(() => store.listClients(search ? { search } : undefined), [search]);
  return useLocalQuery(read);
}

export function useListCampaigns() {
  const read = useCallback(() => store.listCampaigns(), []);
  return useLocalQuery(read);
}

export function useGetDashboardSummary() {
  const read = useCallback(() => store.getDashboardSummary(), []);
  return useLocalQuery(read);
}

export function useGetAvailability(
  params: GetAvailabilityParams,
  options?: { query?: { enabled?: boolean; queryKey?: unknown } },
) {
  const enabled = options?.query?.enabled ?? true;
  const key = JSON.stringify(params);
  const read = useCallback(() => store.getAvailability(params), [key]);
  return useLocalQuery(read, enabled);
}

export function useCreateBooking() {
  return useLocalMutation(({ data }: { data: BookingInput }) => store.createBooking(data));
}

export function useUpdateBooking() {
  return useLocalMutation(({ bookingId, data }: { bookingId: string; data: BookingUpdate }) =>
    store.updateBooking(bookingId, data),
  );
}

export function useCreateClient() {
  return useLocalMutation(({ data }: { data: ClientInput }) => store.createClient(data));
}

export function useCreateService() {
  return useLocalMutation(({ data }: { data: ServiceInput }) => store.createService(data));
}

export function useUpdateService() {
  return useLocalMutation(({ serviceId, data }: { serviceId: number; data: ServiceUpdate }) =>
    store.updateService(serviceId, data),
  );
}

export function useDeleteService() {
  return useLocalMutation(({ serviceId }: { serviceId: number }) => {
    store.deleteService(serviceId);
    return true;
  });
}

export function useCreateCampaign() {
  return useLocalMutation(({ data }: { data: CampaignInput }) => store.createCampaign(data));
}

export function useSendCampaign() {
  return useLocalMutation(({ campaignId }: { campaignId: string }) => store.sendCampaign(campaignId));
}
