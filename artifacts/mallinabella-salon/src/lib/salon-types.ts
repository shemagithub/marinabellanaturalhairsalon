export interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  durationMinutes: number;
  price: number;
  active: boolean;
}

export interface ServiceInput {
  name: string;
  category: string;
  description: string;
  durationMinutes: number;
  price: number;
}

export interface ServiceUpdate {
  name?: string;
  category?: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
  active?: boolean;
}

export interface Stylist {
  id: string;
  name: string;
  title: string;
  imageUrl?: string | null;
}

export interface TimeSlot {
  startAt: string;
  endAt: string;
  stylistId: string;
  stylistName: string;
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  serviceId: number;
  serviceName: string;
  stylistId: string;
  stylistName: string;
  clientName: string;
  email: string;
  phone: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  notes?: string | null;
  marketingOptIn: boolean;
  accountRequested?: boolean;
  createdAt: string;
}

export interface BookingInput {
  serviceId: number;
  stylistId: string;
  clientName: string;
  email: string;
  phone: string;
  startAt: string;
  notes?: string;
  marketingOptIn?: boolean;
  accountRequested?: boolean;
}

export interface BookingUpdate {
  status?: BookingStatus;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalVisits: number;
  marketingOptIn: boolean;
  lastVisit?: string | null;
}

export interface ClientInput {
  name: string;
  email: string;
  phone: string;
  marketingOptIn?: boolean;
}

export interface DashboardSummary {
  todayBookings: number;
  upcomingBookings: number;
  monthlyRevenue: number;
  totalClients: number;
  marketingClients: number;
  nextAppointments: Booking[];
}

export type PromotionCampaignStatus = 'draft' | 'sent';

export interface PromotionCampaign {
  id: string;
  subject: string;
  body: string;
  status: PromotionCampaignStatus;
  recipientCount: number;
  sentAt?: string | null;
  createdAt: string;
}

export interface CampaignInput {
  subject: string;
  body: string;
}

export interface CampaignSendResult {
  campaign: PromotionCampaign;
  recipientCount: number;
  deliveryMode: string;
}

export type GetAvailabilityParams = {
  serviceId: number;
  date: string;
  stylistId?: string;
};

export type ListClientsParams = {
  search?: string;
};
