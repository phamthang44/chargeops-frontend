/**
 * In-memory implementation of every service — the app's data source until the
 * Spring Boot backend exists. Simulates network latency so loading states are
 * real, and mutates the in-memory DB so flows (cancel, approve, rename…) feel
 * live within a session.
 */
import type { Services } from '../services';
import type { Booking, BookingStatus, BookingSummary, Charger, PaymentMethod, Station } from '../types';
import { buildMockDb } from './seed';

const delay = (ms = 250 + Math.random() * 250) => new Promise((r) => setTimeout(r, ms));

let seq = 3304;

export function createMockServices(scope: { ownerView: boolean } = { ownerView: true }): Services {
  const db = buildMockDb();

  /** Owner console sees only its stations' bookings; admin sees the platform. */
  const scopedBookings = () =>
    scope.ownerView
      ? db.bookings.filter((b) => db.ownerStationIds.includes(b.stationId))
      : db.bookings;

  /** Transactions scoped the same way (owner ⇒ own stations only). */
  const scopedTx = () =>
    scope.ownerView
      ? db.transactions.filter((t) => {
          const b = db.bookings.find((x) => x.id === t.bookingId);
          return b && db.ownerStationIds.includes(b.stationId);
        })
      : db.transactions;

  return {
    dashboard: {
      async owner() {
        await delay();
        const lic = db.licenses[0];
        // maintenance still counts as connected/online; only offline drops out
        const online = db.chargers.filter((c) => c.status !== 'offline');
        const offline = db.chargers.find((c) => c.status === 'offline');
        const upcoming = scopedBookings()
          .filter((b) => b.status === 'confirmed' || b.status === 'pending')
          .slice(0, 4);
        return {
          license: { status: lic.status, expiryDate: lic.expiryDate, daysLeft: lic.daysLeft },
          kpis: {
            bookingsToday: 24,
            bookingsDelta: 4,
            revenueTodayVnd: 4_200_000,
            revenueDeltaPct: 12,
            chargersOnline: online.length,
            chargersTotal: db.chargers.length,
            offlineChargerNote: offline ? `${offline.id} mất kết nối` : null,
            avgUtilizationPct: 68,
            utilizationDeltaPts: 5,
          },
          chargers: db.chargers.map(({ id, name, status, utilizationPct }) => ({ id, name, status, utilizationPct })),
          upcomingBookings: upcoming.map((b) => ({
            id: b.id,
            startTime: b.startAt.slice(11, 16),
            driverName: b.driverName,
          })),
        };
      },
      async admin() {
        await delay();
        return {
          kpis: {
            activeStations: 24,
            stationsDeltaWeek: 2,
            pendingApprovals: db.approvalQueue.length,
            newApprovalsToday: 2,
            bookingsToday: 132,
            bookingsDeltaPct: 12,
            revenueMonthVnd: 86_400_000,
            revenueDeltaPct: 18,
          },
          actionQueue: {
            pendingStations: db.approvalQueue.length,
            expiringLicenses: db.licenses.filter((l) => l.status === 'expiring').length,
            expiringDaysMin: 11,
            expiredLicenses: db.licenses.filter((l) => l.status === 'expired').length,
            reportedFaults: db.chargers.reduce((n, c) => n + c.faultCount, 0),
          },
          topStations: [
            { name: 'Trạm Cầu Giấy', revenueVnd: 15_800_000 },
            { name: 'Trạm Hà Đông', revenueVnd: 12_400_000 },
            { name: 'Trạm Thanh Xuân', revenueVnd: 9_100_000 },
            { name: 'Trạm Long Biên', revenueVnd: 7_600_000 },
          ],
        };
      },
    },

    analytics: {
      async overview() {
        await delay();
        const months = ['T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
        const base = 42_000_000;
        return {
          kpis: [
            { label: 'DOANH THU 12TH', value: '₫742tr', delta: '+18% so với kỳ trước', deltaPositive: true },
            { label: 'TỔNG ĐẶT CHỖ', value: '18.240', delta: '+2.140 lượt', deltaPositive: true },
            { label: 'TRẠM HOẠT ĐỘNG', value: '24', delta: '+2 tuần này', deltaPositive: true },
            { label: 'TỶ LỆ LẤP ĐẦY', value: '71%', delta: '+4 điểm', deltaPositive: true },
            { label: 'HỦY / NO-SHOW', value: '6,2%', delta: '-0,8 điểm', deltaPositive: true },
          ],
          revenueTrend: months.map((m, i) => ({ month: m, vnd: Math.round(base * (1 + i * 0.08 + (i % 3) * 0.02)) })),
          topStations: [
            { name: 'Trạm Cầu Giấy', revenueVnd: 15_800_000, pct: 100 },
            { name: 'Trạm Hà Đông', revenueVnd: 12_400_000, pct: 78 },
            { name: 'Trạm Thanh Xuân', revenueVnd: 9_100_000, pct: 58 },
            { name: 'Trạm Long Biên', revenueVnd: 7_600_000, pct: 48 },
            { name: 'Trạm Đống Đa', revenueVnd: 5_200_000, pct: 33 },
          ],
          peakHours: Array.from({ length: 24 }, (_, h) => {
            // twin peaks around 8h and 18h
            const morning = Math.exp(-((h - 8) ** 2) / 6);
            const evening = Math.exp(-((h - 18) ** 2) / 5) * 1.2;
            return { hour: h, sessions: Math.round((morning + evening) * 40) };
          }),
          connectorMix: [
            { connector: 'CCS2', pct: 48 },
            { connector: 'CHAdeMO', pct: 24 },
            { connector: 'Type2AC', pct: 20 },
            { connector: 'GBT', pct: 8 },
          ],
        };
      },
    },

    bookings: {
      async list(params = {}) {
        await delay();
        const { status = 'all', search = '', page = 0, pageSize = 10 } = params;
        const q = search.trim().toLowerCase();
        let rows = scopedBookings();
        if (status !== 'all') rows = rows.filter((b) => b.status === status);
        if (q) {
          rows = rows.filter((b) =>
            [b.id, b.driverName, b.chargerId, b.stationName].some((f) => f.toLowerCase().includes(q)),
          );
        }
        return { items: rows.slice(page * pageSize, (page + 1) * pageSize), total: rows.length, page, pageSize };
      },
      async get(id) {
        await delay(150);
        const b = db.bookings.find((x) => x.id === id);
        if (!b) throw new Error(`Không tìm thấy đặt chỗ ${id}`);
        return b;
      },
      async summary() {
        await delay();
        const rows = scopedBookings();
        const byStatus = { pending: 0, confirmed: 0, checkedin: 0, charging: 0, completed: 0, cancelled: 0 } as Record<BookingStatus, number>;
        for (const b of rows) byStatus[b.status]++;
        return {
          total: rows.length,
          byStatus,
          grossVnd: rows.filter((b) => b.status !== 'pending').reduce((s, b) => s + b.amountVnd, 0),
          refundedVnd: rows.reduce((s, b) => s + b.refundVnd, 0),
        } satisfies BookingSummary;
      },
      async cancel(id) {
        await delay();
        const b = await this.get(id);
        // BR-PAY-03 — mock assumes ≥60 min before start ⇒ 100% refund.
        b.status = 'cancelled';
        b.refundPct = 100;
        b.refundVnd = b.amountVnd;
        return { ...b };
      },
    },

    chargers: {
      async list(stationId) {
        await delay();
        const all = [...db.chargers, ...db.provisioned];
        return stationId ? all.filter((c) => c.stationId === stationId) : scope.ownerView ? db.chargers : all;
      },
      async update(id, patch) {
        await delay();
        const c = [...db.chargers, ...db.provisioned].find((x) => x.id === id);
        if (!c) throw new Error(`Không tìm thấy trụ ${id}`);
        if (patch.name !== undefined) c.name = patch.name;
        if (patch.status !== undefined) c.status = patch.status;
        return { ...c };
      },
      async provision(input) {
        await delay();
        const rec: Charger = {
          id: 'CH-' + seq++,
          stationId: 'ST-1042',
          name: input.name || '—',
          connector: input.connector,
          powerKw: input.powerKw,
          status: 'unclaimed',
          utilizationPct: 0,
          sessionsToday: 0,
          uptime30dPct: 0,
          kwhToday: 0,
          faultCount: 0,
          lastSeen: '—',
        };
        db.provisioned.unshift(rec);
        return { ...rec };
      },
    },

    stations: {
      async mine() {
        await delay();
        return [...db.ownerStations];
      },
      async register(input) {
        await delay();
        const st: Station = {
          id: 'ST-' + (1057 + db.ownerStations.length),
          name: input.name,
          city: input.city,
          address: input.address,
          ownerName: 'EVGo Co.',
          chargerCount: input.plannedChargers,
          onlineCount: 0,
          status: 'pending',
          licenseSummary: null,
          rejectionReason: null,
          bookingsToday: 0,
          revenueWeekVnd: 0,
          utilizationPct: 0,
          submittedAt: '2026-06-28',
        };
        db.ownerStations.push(st);
        return { ...st };
      },
      async approvals() {
        await delay();
        return db.approvalQueue.filter((s) => s.status === 'pending');
      },
      async approve(id) {
        await delay();
        const s = db.approvalQueue.find((x) => x.id === id);
        if (!s) throw new Error(`Không tìm thấy hồ sơ ${id}`);
        s.status = 'active';
        return { ...s };
      },
      async reject(id, reason) {
        await delay();
        const s = db.approvalQueue.find((x) => x.id === id);
        if (!s) throw new Error(`Không tìm thấy hồ sơ ${id}`);
        s.status = 'rejected';
        s.rejectionReason = reason;
        return { ...s };
      },
    },

    transactions: {
      async list(params = {}) {
        await delay();
        const { type = 'all', method = 'all', page = 0, pageSize = 12 } = params;
        let rows = scopedTx();
        if (type !== 'all') rows = rows.filter((t) => t.type === type);
        if (method !== 'all') rows = rows.filter((t) => t.method === method);
        return { items: rows.slice(page * pageSize, (page + 1) * pageSize), total: rows.length, page, pageSize };
      },
      async summary() {
        await delay();
        const rows = scopedTx();
        const payments = rows.filter((t) => t.type === 'payment');
        const refunds = rows.filter((t) => t.type === 'refund');
        const grossVnd = payments.reduce((s, t) => s + t.amountVnd, 0);
        const refundedVnd = refunds.reduce((s, t) => s + Math.abs(t.amountVnd), 0);

        // payment split by method
        const methods: PaymentMethod[] = ['VNPAY', 'MOMO', 'ATM'];
        const methodBreakdown = methods
          .map((m) => {
            const totalVnd = payments.filter((t) => t.method === m).reduce((s, t) => s + t.amountVnd, 0);
            return { method: m, totalVnd, pct: grossVnd ? Math.round((totalVnd / grossVnd) * 100) : 0 };
          })
          .filter((m) => m.totalVnd > 0);

        // last 11 days of net revenue
        const byDay = new Map<number, number>();
        for (const t of rows) {
          const day = Number(t.date.slice(8, 10));
          byDay.set(day, (byDay.get(day) ?? 0) + t.amountVnd);
        }
        const dailyTrend = [...byDay.entries()]
          .sort((a, b) => a[0] - b[0])
          .slice(-11)
          .map(([day, vnd]) => ({ day, vnd }));

        return {
          grossVnd,
          refundedVnd,
          netVnd: grossVnd - refundedVnd,
          avgVnd: payments.length ? Math.round(grossVnd / payments.length) : 0,
          payCount: payments.length,
          refundCount: refunds.length,
          methodBreakdown,
          dailyTrend,
        };
      },
    },

    licenses: {
      async mine() {
        await delay();
        return { ...db.licenses[0] };
      },
      async list() {
        await delay();
        return [...db.licenses];
      },
      async recordRenewal(stationId) {
        await delay();
        const l = db.licenses.find((x) => x.stationId === stationId);
        if (!l) throw new Error(`Không tìm thấy giấy phép ${stationId}`);
        l.status = 'active';
        l.daysLeft = l.plan === 'yearly' ? 365 : 30;
        return { ...l };
      },
    },

    users: {
      async list(params = {}) {
        await delay();
        const q = (params.search ?? '').trim().toLowerCase();
        let rows = [...db.users];
        if (params.role && params.role !== 'all') rows = rows.filter((u) => u.role === params.role);
        if (q) rows = rows.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
        return rows;
      },
      async setStatus(id, status) {
        await delay();
        const u = db.users.find((x) => x.id === id);
        if (!u) throw new Error(`Không tìm thấy người dùng ${id}`);
        u.status = status;
        return { ...u };
      },
    },

    pricing: {
      async get() {
        await delay();
        return structuredClone(db.pricing);
      },
      async save(config) {
        await delay();
        db.pricing = structuredClone(config);
        return structuredClone(db.pricing);
      },
    },

    policies: {
      async docs() {
        await delay();
        return [...db.policyDocs];
      },
      async save(doc) {
        await delay();
        if (doc.id) {
          const d = db.policyDocs.find((x) => x.id === doc.id);
          if (!d) throw new Error(`Không tìm thấy tài liệu ${doc.id}`);
          d.category = doc.category;
          d.content = doc.content;
          d.updatedAt = '2026-06-28';
          return { ...d };
        }
        const d = { id: 'POL-' + String(db.policyDocs.length + 1).padStart(2, '0'), category: doc.category, content: doc.content, updatedAt: '2026-06-28' };
        db.policyDocs.push(d);
        return { ...d };
      },
      async remove(id) {
        await delay();
        const i = db.policyDocs.findIndex((x) => x.id === id);
        if (i >= 0) db.policyDocs.splice(i, 1);
      },
      async ask(question) {
        await delay(650);
        // Toy retrieval: keyword match over the KB — the real thing is RAG server-side.
        const q = question.toLowerCase();
        const hit =
          db.policyDocs.find((d) => q.split(/\s+/).filter((w) => w.length > 3).some((w) => d.content.toLowerCase().includes(w))) ??
          db.policyDocs[0];
        return { text: hit.content, sources: [hit.id] };
      },
    },
  };
}

export type { Booking };
