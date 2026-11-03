import { Router, type IRouter } from "express";
import {
  CreateClientBody,
  CreateClientResponse,
  GetDashboardSummaryResponse,
  ListClientsQueryParams,
  ListClientsResponse,
} from "@workspace/api-zod";
import { prisma } from "@workspace/db";
import { requireSalonAdmin } from "../../middlewares/requireSalonAdmin";
import { kigaliDayBounds, toBooking } from "../../lib/salon-domain";

const router: IRouter = Router();

function toClientRecord(client: {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalVisits: number;
  marketingOptIn: boolean;
  bookings?: { startAt: Date }[];
}) {
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    totalVisits: client.totalVisits,
    marketingOptIn: client.marketingOptIn,
    lastVisit: client.bookings?.[0]?.startAt.toISOString() ?? null,
  };
}

router.get("/clients", requireSalonAdmin, async (req, res): Promise<void> => {
  const parsed = ListClientsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const search = parsed.data.search?.trim();
  const clients = await prisma.user.findMany({
    where: {
      role: "client",
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      bookings: {
        where: { status: "completed" },
        orderBy: { startAt: "desc" },
        take: 1,
        select: { startAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const result = clients.map((client) => toClientRecord(client));
  res.json(ListClientsResponse.parse(result));
});

router.post("/clients", requireSalonAdmin, async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim().toLowerCase();
  const phone = parsed.data.phone.trim();
  const marketingOptIn = parsed.data.marketingOptIn ?? false;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.role !== "client") {
    res.status(409).json({ error: "That email belongs to a staff account." });
    return;
  }

  const client = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          phone,
          marketingOptIn: existing.marketingOptIn || marketingOptIn,
        },
        include: {
          bookings: {
            where: { status: "completed" },
            orderBy: { startAt: "desc" },
            take: 1,
            select: { startAt: true },
          },
        },
      })
    : await prisma.user.create({
        data: {
          name,
          email,
          phone,
          role: "client",
          marketingOptIn,
        },
        include: {
          bookings: {
            where: { status: "completed" },
            orderBy: { startAt: "desc" },
            take: 1,
            select: { startAt: true },
          },
        },
      });

  req.log.info(
    { clientId: client.id, created: !existing, marketingOptIn: client.marketingOptIn },
    existing ? "Salon client updated from staff registration" : "Salon client registered by staff",
  );

  res
    .status(existing ? 200 : 201)
    .json(CreateClientResponse.parse(toClientRecord(client)));
});

router.get("/dashboard/summary", requireSalonAdmin, async (_req, res): Promise<void> => {
  const now = new Date();
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kigali",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const { start: todayStart, end: todayEnd } = kigaliDayBounds(today);
  const monthStartDate = new Date(`${today.slice(0, 7)}-01T00:00:00+02:00`);
  const [
    todayBookings,
    upcomingBookings,
    clients,
    marketingClients,
    monthlyAppointments,
    nextAppointments,
  ] = await Promise.all([
    prisma.booking.count({
      where: { startAt: { gte: todayStart, lt: todayEnd }, status: "confirmed" },
    }),
    prisma.booking.count({
      where: { startAt: { gte: now }, status: "confirmed" },
    }),
    prisma.user.count({ where: { role: "client" } }),
    prisma.user.count({ where: { role: "client", marketingOptIn: true } }),
    prisma.booking.findMany({
      where: {
        startAt: { gte: monthStartDate, lt: todayEnd },
        status: { in: ["confirmed", "completed"] },
      },
      include: { service: true },
    }),
    prisma.booking.findMany({
      where: { startAt: { gte: now }, status: "confirmed" },
      include: { service: true, stylist: true },
      orderBy: { startAt: "asc" },
      take: 5,
    }),
  ]);
  const monthlyRevenue = monthlyAppointments.reduce(
    (sum, booking) => sum + Number(booking.service.price),
    0,
  );
  res.json(
    GetDashboardSummaryResponse.parse({
      todayBookings,
      upcomingBookings,
      monthlyRevenue,
      totalClients: clients,
      marketingClients,
      nextAppointments: nextAppointments.map(toBooking),
    }),
  );
});

export default router;
