import type {
  Booking,
  BookingInput,
  BookingUpdate,
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

const STORAGE_KEY = 'marina-bella-salon-v1';

type StoreShape = {
  services: Service[];
  stylists: Stylist[];
  bookings: Booking[];
  clients: Client[];
  campaigns: PromotionCampaign[];
  nextServiceId: number;
};

const seedServices: Service[] = [
  { id: 1, name: 'The Marina Bella Blowout', category: 'Hair Styling', description: 'A nourishing wash, smooth blowout, and polished finish.', durationMinutes: 60, price: 25000, active: true },
  { id: 2, name: 'Protective Silk Press', category: 'Hair Styling', description: 'A heat-conscious silk press with a soft, lasting finish.', durationMinutes: 90, price: 35000, active: true },
  { id: 3, name: 'Signature Knotless Braids', category: 'Braiding', description: 'Lightweight knotless braids, shaped and finished to your preference.', durationMinutes: 240, price: 80000, active: true },
  { id: 4, name: 'Classic Cornrows', category: 'Braiding', description: 'Clean, carefully finished cornrows in a classic style.', durationMinutes: 150, price: 45000, active: true },
  { id: 5, name: 'Dimensional Gloss', category: 'Coloring', description: 'A gloss treatment that refreshes tone and adds reflective shine.', durationMinutes: 120, price: 40000, active: true },
  { id: 6, name: 'Full Color Refresh', category: 'Coloring', description: 'A full-color refresh with a conditioning finish.', durationMinutes: 180, price: 65000, active: true },
  { id: 7, name: 'Signature Red Color', category: 'Coloring', description: 'A custom red color service — from soft copper to vivid crimson — with a nourishing finish that keeps the tone rich and even.', durationMinutes: 180, price: 70000, active: true },
  { id: 8, name: 'Scalp Reset Ritual', category: 'Treatments', description: 'A soothing cleanse, scalp massage, and restorative mask.', durationMinutes: 45, price: 20000, active: true },
  { id: 9, name: 'Gel Manicure', category: 'Nails/Spa', description: 'A shaping, cuticle care, and long-wear gel finish.', durationMinutes: 60, price: 15000, active: true },
  { id: 10, name: 'Restorative Spa Pedicure', category: 'Nails/Spa', description: 'A relaxing soak, exfoliation, and nourishing finish.', durationMinutes: 75, price: 20000, active: true },
];

const seedStylists: Stylist[] = [
  { id: 'stylist-1', name: 'Senior Stylist', title: 'Hair styling & treatments', imageUrl: '/images/mallinabella-curls.jpg' },
  { id: 'stylist-2', name: 'Braiding Artist', title: 'Protective styles & braiding', imageUrl: '/images/mallinabella-knotless-braids.jpg' },
  { id: 'stylist-3', name: 'Color Specialist', title: 'Color & finishing', imageUrl: '/images/mallinabella-manicure.jpg' },
];

function createSeed(): StoreShape {
  return {
    services: seedServices,
    stylists: seedStylists,
    bookings: [],
    clients: [],
    campaigns: [],
    nextServiceId: 11,
  };
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

function readStore(): StoreShape {
  if (typeof window === 'undefined') return createSeed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeed();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return {
      ...createSeed(),
      ...parsed,
      services: parsed.services?.length ? parsed.services : seedServices,
      stylists: parsed.stylists?.length ? parsed.stylists : seedStylists,
    };
  } catch {
    return createSeed();
  }
}

function writeStore(store: StoreShape) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event('marina-bella-store'));
}

function upsertClientFromBooking(store: StoreShape, booking: Booking) {
  const email = booking.email.trim().toLowerCase();
  const existing = store.clients.find((client) => client.email.toLowerCase() === email);
  if (existing) {
    existing.name = booking.clientName;
    existing.phone = booking.phone;
    existing.marketingOptIn = existing.marketingOptIn || booking.marketingOptIn;
    existing.totalVisits += booking.status === 'cancelled' ? 0 : 1;
    existing.lastVisit = booking.startAt;
    return;
  }
  store.clients.unshift({
    id: uid('client'),
    name: booking.clientName,
    email: booking.email,
    phone: booking.phone,
    totalVisits: booking.status === 'cancelled' ? 0 : 1,
    marketingOptIn: booking.marketingOptIn,
    lastVisit: booking.startAt,
  });
}

export function listServices(): Service[] {
  return readStore().services.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function listStylists(): Stylist[] {
  return readStore().stylists.slice();
}

export function listBookings(): Booking[] {
  return readStore().bookings.slice().sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function listMyBookings(): Booking[] {
  return listBookings();
}

export function listClients(params?: ListClientsParams): Client[] {
  const search = params?.search?.trim().toLowerCase();
  return readStore()
    .clients
    .filter((client) => {
      if (!search) return true;
      return client.name.toLowerCase().includes(search) || client.email.toLowerCase().includes(search) || client.phone.includes(search);
    })
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listCampaigns(): PromotionCampaign[] {
  return readStore().campaigns.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAvailability(params: GetAvailabilityParams): TimeSlot[] {
  const store = readStore();
  const service = store.services.find((item) => item.id === params.serviceId && item.active);
  if (!service || !params.date) return [];

  const stylists = store.stylists.filter((stylist) => !params.stylistId || stylist.id === params.stylistId);
  const dayStart = new Date(`${params.date}T00:00:00`);
  if (Number.isNaN(dayStart.getTime())) return [];

  const slots: TimeSlot[] = [];
  const openHour = 9;
  const closeHour = 18;
  const stepMinutes = 30;
  const now = Date.now();

  for (const stylist of stylists) {
    for (let hour = openHour; hour < closeHour; hour += 1) {
      for (let minute = 0; minute < 60; minute += stepMinutes) {
        const startAt = new Date(dayStart);
        startAt.setHours(hour, minute, 0, 0);
        const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);
        if (endAt.getHours() > closeHour || (endAt.getHours() === closeHour && endAt.getMinutes() > 0)) continue;
        if (startAt.getTime() <= now) continue;
        const overlaps = store.bookings.some(
          (booking) =>
            booking.status !== 'cancelled' &&
            booking.stylistId === stylist.id &&
            new Date(booking.startAt).getTime() < endAt.getTime() &&
            new Date(booking.endAt).getTime() > startAt.getTime(),
        );
        if (overlaps) continue;
        slots.push({
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          stylistId: stylist.id,
          stylistName: stylist.name,
        });
      }
    }
  }

  return slots;
}

export function getDashboardSummary(): DashboardSummary {
  const store = readStore();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);
  const confirmed = store.bookings.filter((booking) => booking.status === 'confirmed');
  const todayBookings = confirmed.filter((booking) => booking.startAt.slice(0, 10) === today).length;
  const upcomingBookings = confirmed.filter((booking) => new Date(booking.startAt) >= now).length;
  const monthlyRevenue = store.bookings
    .filter((booking) => booking.status !== 'cancelled' && booking.startAt.startsWith(monthPrefix))
    .reduce((sum, booking) => {
      const service = store.services.find((item) => item.id === booking.serviceId);
      return sum + (service?.price ?? 0);
    }, 0);

  return {
    todayBookings,
    upcomingBookings,
    monthlyRevenue,
    totalClients: store.clients.length,
    marketingClients: store.clients.filter((client) => client.marketingOptIn).length,
    nextAppointments: confirmed
      .filter((booking) => new Date(booking.startAt) >= now)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, 8),
  };
}

export function createBooking(input: BookingInput): Booking {
  const store = readStore();
  const service = store.services.find((item) => item.id === input.serviceId && item.active);
  const stylist = store.stylists.find((item) => item.id === input.stylistId);
  if (!service || !stylist) throw new Error('Service or stylist not found');

  const startAt = new Date(input.startAt);
  const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);
  const booking: Booking = {
    id: uid('booking'),
    serviceId: service.id,
    serviceName: service.name,
    stylistId: stylist.id,
    stylistName: stylist.name,
    clientName: input.clientName.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    status: 'confirmed',
    notes: input.notes?.trim() || null,
    marketingOptIn: Boolean(input.marketingOptIn),
    accountRequested: Boolean(input.accountRequested),
    createdAt: new Date().toISOString(),
  };
  store.bookings.unshift(booking);
  upsertClientFromBooking(store, booking);
  writeStore(store);
  return booking;
}

export function updateBooking(bookingId: string, data: BookingUpdate): Booking {
  const store = readStore();
  const booking = store.bookings.find((item) => item.id === bookingId);
  if (!booking) throw new Error('Booking not found');
  if (data.status) booking.status = data.status;
  if (data.notes !== undefined) booking.notes = data.notes;
  writeStore(store);
  return booking;
}

export function createClient(input: ClientInput): Client {
  const store = readStore();
  const email = input.email.trim().toLowerCase();
  const existing = store.clients.find((client) => client.email.toLowerCase() === email);
  if (existing) {
    existing.name = input.name.trim();
    existing.phone = input.phone.trim();
    existing.marketingOptIn = Boolean(input.marketingOptIn);
    writeStore(store);
    return existing;
  }
  const client: Client = {
    id: uid('client'),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    totalVisits: 0,
    marketingOptIn: Boolean(input.marketingOptIn),
    lastVisit: null,
  };
  store.clients.unshift(client);
  writeStore(store);
  return client;
}

export function createService(input: ServiceInput): Service {
  const store = readStore();
  const service: Service = {
    id: store.nextServiceId++,
    name: input.name.trim(),
    category: input.category.trim(),
    description: input.description.trim(),
    durationMinutes: input.durationMinutes,
    price: input.price,
    active: true,
  };
  store.services.push(service);
  writeStore(store);
  return service;
}

export function updateService(serviceId: number, data: ServiceUpdate): Service {
  const store = readStore();
  const service = store.services.find((item) => item.id === serviceId);
  if (!service) throw new Error('Service not found');
  Object.assign(service, {
    ...(data.name !== undefined ? { name: data.name.trim() } : {}),
    ...(data.category !== undefined ? { category: data.category.trim() } : {}),
    ...(data.description !== undefined ? { description: data.description.trim() } : {}),
    ...(data.durationMinutes !== undefined ? { durationMinutes: data.durationMinutes } : {}),
    ...(data.price !== undefined ? { price: data.price } : {}),
    ...(data.active !== undefined ? { active: data.active } : {}),
  });
  writeStore(store);
  return service;
}

export function deleteService(serviceId: number) {
  const store = readStore();
  store.services = store.services.filter((item) => item.id !== serviceId);
  writeStore(store);
}

export function createCampaign(input: CampaignInput): PromotionCampaign {
  const store = readStore();
  const campaign: PromotionCampaign = {
    id: uid('campaign'),
    subject: input.subject.trim(),
    body: input.body.trim(),
    status: 'draft',
    recipientCount: 0,
    sentAt: null,
    createdAt: new Date().toISOString(),
  };
  store.campaigns.unshift(campaign);
  writeStore(store);
  return campaign;
}

export function sendCampaign(campaignId: string): CampaignSendResult {
  const store = readStore();
  const campaign = store.campaigns.find((item) => item.id === campaignId);
  if (!campaign) throw new Error('Campaign not found');
  const recipients = store.clients.filter((client) => client.marketingOptIn);
  campaign.status = 'sent';
  campaign.recipientCount = recipients.length;
  campaign.sentAt = new Date().toISOString();
  writeStore(store);
  return {
    campaign,
    recipientCount: recipients.length,
    deliveryMode: 'local-demo',
  };
}

export function subscribeStore(listener: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener('marina-bella-store', listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('marina-bella-store', listener);
    window.removeEventListener('storage', onStorage);
  };
}
