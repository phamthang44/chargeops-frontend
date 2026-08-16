/**
 * In-memory implementation of every service — the app's data source until the
 * Spring Boot backend exists. Simulates network latency so loading states are
 * real, and mutates the in-memory DB so flows (cancel, approve, rename…) feel
 * live within a session.
 */
import type { Services } from '../services';
import type { AdministrativeProvince, AdministrativeWard, Booking, BookingStatus, BookingSummary, ChargePoint, Connector, PaymentMethod, Station, StationApprovalDetail, StationApprovalSummary, StationStaffMember, StationStatusHistory, TicketMessage, TicketStatus } from '../types';
import { STATION_SCOPED_CATEGORIES } from '../types';
import { buildMockDb } from './seed';

const MOCK_PROVINCES: AdministrativeProvince[] = [
  { code: '01', name: 'Hà Nội', fullName: 'Thành phố Hà Nội' },
  { code: '79', name: 'Hồ Chí Minh', fullName: 'Thành phố Hồ Chí Minh' },
  { code: '48', name: 'Đà Nẵng', fullName: 'Thành phố Đà Nẵng' },
  { code: '92', name: 'Cần Thơ', fullName: 'Thành phố Cần Thơ' },
  { code: '31', name: 'Hải Phòng', fullName: 'Thành phố Hải Phòng' },
];

const MOCK_WARDS: Record<string, AdministrativeWard[]> = {
  '01': [
    { code: '00001', provinceCode: '01', name: 'Phúc Xá', fullName: 'Phường Phúc Xá' },
    { code: '00004', provinceCode: '01', name: 'Trúc Bạch', fullName: 'Phường Trúc Bạch' },
    { code: '00006', provinceCode: '01', name: 'Vĩnh Phúc', fullName: 'Phường Vĩnh Phúc' },
    { code: '00028', provinceCode: '01', name: 'Hàng Bạc', fullName: 'Phường Hàng Bạc' },
    { code: '00037', provinceCode: '01', name: 'Tràng Tiền', fullName: 'Phường Tràng Tiền' },
  ],
  '79': [
    { code: '26734', provinceCode: '79', name: 'Bến Nghé', fullName: 'Phường Bến Nghé' },
    { code: '26737', provinceCode: '79', name: 'Bến Thành', fullName: 'Phường Bến Thành' },
    { code: '26740', provinceCode: '79', name: 'Cầu Kho', fullName: 'Phường Cầu Kho' },
    { code: '26743', provinceCode: '79', name: 'Cầu Ông Lãnh', fullName: 'Phường Cầu Ông Lãnh' },
    { code: '26746', provinceCode: '79', name: 'Cô Giang', fullName: 'Phường Cô Giang' },
    { code: '26884', provinceCode: '79', name: 'Thảo Điền', fullName: 'Phường Thảo Điền' },
  ],
  '48': [
    { code: '20194', provinceCode: '48', name: 'Hải Châu 1', fullName: 'Phường Hải Châu 1' },
    { code: '20197', provinceCode: '48', name: 'Hải Châu 2', fullName: 'Phường Hải Châu 2' },
    { code: '20200', provinceCode: '48', name: 'Thạch Thang', fullName: 'Phường Thạch Thang' },
  ],
  '92': [
    { code: '31147', provinceCode: '92', name: 'Tân An', fullName: 'Phường Tân An' },
    { code: '31150', provinceCode: '92', name: 'An Cư', fullName: 'Phường An Cư' },
    { code: '31153', provinceCode: '92', name: 'An Hòa', fullName: 'Phường An Hòa' },
  ],
  '31': [
    { code: '11383', provinceCode: '31', name: 'Hoàng Văn Thụ', fullName: 'Phường Hoàng Văn Thụ' },
    { code: '11386', provinceCode: '31', name: 'Minh Khai', fullName: 'Phường Minh Khai' },
  ],
};

/**
 * BR-CHG-01 — a Connector is only live if its Charge Point is ACTIVE. Derived
 * here rather than stored so a device going offline never overwrites (and then
 * loses) the per-connector status the owner set.
 */
function effectiveRuntimeStatus(c: Connector, chargePoints: ChargePoint[]): Connector['runtimeStatus'] {
  const cp = chargePoints.find((x) => x.id === c.chargePointId);
  return cp?.status === 'active' ? c.runtimeStatus : 'offline';
}

/** BR-PAY-03 + FR08 grace-period override, evaluated at cancel moment. */
function computeRefundPct(b: Booking, now = Date.now()): number {
  const minutesSinceCreated = (now - new Date(b.createdAt).getTime()) / 60_000;
  if (minutesSinceCreated <= 5) return 100; // grace period — overrides the tier table
  const minutesBeforeStart = (new Date(b.startAt).getTime() - now) / 60_000;
  if (minutesBeforeStart >= 60) return 100;
  if (minutesBeforeStart >= 15) return 50;
  return 0;
}

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

  /**
   * BR-TKT-01 ticket routing. Owner/staff receive station-scoped categories
   * only (CHARGING_ISSUE, and BOOKING when linked to a station) and only for
   * their own stations. PAYMENT, ACCOUNT and OTHER are platform matters and
   * route to Admin — station access alone does not entitle an owner to a
   * driver's payment or account thread. Admin sees everything.
   */
  const scopedTickets = () =>
    scope.ownerView
      ? db.tickets.filter(
          (tk) =>
            tk.stationId &&
            db.ownerStationIds.includes(tk.stationId) &&
            STATION_SCOPED_CATEGORIES.includes(tk.category),
        )
      : db.tickets;

  /**
   * Connectors reachable by the caller (BR-ACC-05). A Connector has no stationId
   * of its own — it inherits one through its Charge Point — so scoping has to
   * hop via chargePoints rather than filtering connectors directly.
   */
  const scopedConnectors = () => {
    if (!scope.ownerView) return db.connectors;
    const mine = new Set(
      db.chargePoints.filter((cp) => db.ownerStationIds.includes(cp.stationId)).map((cp) => cp.id),
    );
    return db.connectors.filter((c) => mine.has(c.chargePointId));
  };

  return {
    location: {
      async getProvinces() {
        await delay();
        return [...MOCK_PROVINCES];
      },
      async getWards(provinceCode: string) {
        await delay();
        return [...(MOCK_WARDS[provinceCode] ?? [])];
      },
    },

    dashboard: {
      async owner() {
        await delay();
        const lic = db.licenses[0];
        // OFFLINE connectors drop out; AVAILABLE/IN_USE both count as connected/online
        const mine = scopedConnectors();
        const live = mine.map((c) => ({ c, status: effectiveRuntimeStatus(c, db.chargePoints) }));
        const online = live.filter((x) => x.status !== 'offline');
        const offline = live.find((x) => x.status === 'offline')?.c;
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
            chargersTotal: mine.length,
            offlineChargerNote: offline ? `${offline.id} mất kết nối` : null,
            avgUtilizationPct: 68,
            utilizationDeltaPts: 5,
          },
          chargers: mine.map((c) => ({
            id: c.id,
            name: c.name,
            zoneLabel: db.chargePoints.find((cp) => cp.id === c.chargePointId)?.zoneLabel ?? null,
            runtimeStatus: effectiveRuntimeStatus(c, db.chargePoints),
            utilizationPct: c.utilizationPct,
          })),
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
            expiringLicenses: db.licenses.filter((l) => l.expiringSoon || (l.daysLeft != null && l.daysLeft > 0 && l.daysLeft <= 15)).length,
            expiringDaysMin: 11,
            expiredLicenses: db.licenses.filter((l) => l.status === 'EXPIRED' || l.status === 'expired' || (l.daysLeft != null && l.daysLeft < 0)).length,
            reportedFaults: db.connectors.reduce((n, c) => n + c.faultCount, 0),
          },
          topStations: [
            { name: 'Trạm Cầu Giấy', revenueVnd: 15_800_000 },
            { name: 'Trạm Hà Đông', revenueVnd: 12_400_000 },
            { name: 'Trạm Thanh Xuân', revenueVnd: 9_100_000 },
            { name: 'Trạm Long Biên', revenueVnd: 7_600_000 },
          ],
        };
      },
      async staff() {
        await delay();
        // OFFLINE connectors drop out; AVAILABLE/IN_USE both count as connected/online
        const mine = scopedConnectors();
        const live = mine.map((c) => ({ c, status: effectiveRuntimeStatus(c, db.chargePoints) }));
        const online = live.filter((x) => x.status !== 'offline');
        const offline = live.find((x) => x.status === 'offline')?.c;
        const upcoming = scopedBookings()
          .filter((b) => b.status === 'confirmed' || b.status === 'pending')
          .slice(0, 4);
        const myTickets = scopedTickets();
        const recentTickets = [...myTickets]
          .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
          .slice(0, 4);
        return {
          kpis: {
            bookingsToday: 24,
            bookingsDelta: 4,
            chargersOnline: online.length,
            chargersTotal: mine.length,
            offlineChargerNote: offline ? `${offline.id} mất kết nối` : null,
            openTickets: myTickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length,
            pendingCheckins: scopedBookings().filter((b) => b.status === 'confirmed').length,
          },
          chargers: mine.map((c) => ({
            id: c.id,
            name: c.name,
            zoneLabel: db.chargePoints.find((cp) => cp.id === c.chargePointId)?.zoneLabel ?? null,
            runtimeStatus: effectiveRuntimeStatus(c, db.chargePoints),
          })),
          upcomingBookings: upcoming.map((b) => ({
            id: b.id,
            startTime: b.startAt.slice(11, 16),
            driverName: b.driverName,
            connectorId: b.connectorId,
          })),
          recentTickets: recentTickets.map(({ id, subject, status, updatedAt }) => ({ id, subject, status, updatedAt })),
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
        const { status = 'all', search = '', searchIn = 'all', page = 0, pageSize = 10 } = params;
        const q = search.trim().toLowerCase();
        let rows = scopedBookings();
        if (status !== 'all') rows = rows.filter((b) => b.status === status);
        if (q) {
          const fieldsOf = (b: Booking): string[] => {
            switch (searchIn) {
              case 'id':
                return [b.id];
              case 'driver':
                return [b.driverName];
              case 'connector':
                return [b.connectorId];
              case 'station':
                return [b.stationName];
              default:
                return [b.id, b.driverName, b.connectorId, b.stationName];
            }
          };
          rows = rows.filter((b) => fieldsOf(b).some((f) => f.toLowerCase().includes(q)));
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
        const refundPct = computeRefundPct(b);
        b.status = 'cancelled';
        b.refundPct = refundPct;
        b.refundVnd = Math.round((b.amountVnd * refundPct) / 100 / 1000) * 1000;
        return { ...b };
      },
      async activeFor(connectorIds) {
        await delay(180);
        const ids = new Set(connectorIds);
        return db.bookings
          .filter((b) => ids.has(b.connectorId) && (b.status === 'confirmed' || b.status === 'checkedin'))
          .sort((a, b) => (a.startAt < b.startAt ? -1 : 1));
      },
    },

    chargePoints: {
      async list(stationId) {
        await delay();
        return stationId ? db.chargePoints.filter((c) => c.stationId === stationId) : scope.ownerView ? db.chargePoints.filter((c) => db.ownerStationIds.includes(c.stationId)) : db.chargePoints;
      },
      async update(id, patch) {
        await delay();
        const cp = db.chargePoints.find((x) => x.id === id);
        if (!cp) throw new Error(`Không tìm thấy trụ sạc ${id}`);
        if (patch.name !== undefined) cp.name = patch.name;
        if (patch.zoneLabel !== undefined) cp.zoneLabel = patch.zoneLabel;
        if (patch.status !== undefined) cp.status = patch.status;
        return { ...cp };
      },
      async provision(input) {
        await delay();
        const rec: ChargePoint = {
          id: 'CP-' + seq++,
          stationId: input.stationId,
          name: input.name || '—',
          zoneLabel: input.zoneLabel ?? null,
          maxPowerKw: 0,
          status: 'unclaimed',
        };
        db.chargePoints.unshift(rec);
        return { ...rec };
      },
      async activate(id) {
        await delay();
        const cp = db.chargePoints.find((x) => x.id === id);
        if (!cp) throw new Error(`Không tìm thấy trụ sạc ${id}`);
        cp.status = 'active';
        return { ...cp };
      },
    },

    connectors: {
      async list(chargePointId) {
        await delay();
        return chargePointId
          ? db.connectors.filter((c) => c.chargePointId === chargePointId)
          : scopedConnectors();
      },
      async update(id, patch) {
        await delay();
        const c = db.connectors.find((x) => x.id === id);
        if (!c) throw new Error(`Không tìm thấy connector ${id}`);
        if (patch.runtimeStatus !== undefined) c.runtimeStatus = patch.runtimeStatus;
        return { ...c };
      },
      async provision(input) {
        await delay();
        const rec: Connector = {
          id: 'CH-' + seq++,
          chargePointId: input.chargePointId,
          name: input.name || 'Connector ' + (db.connectors.filter((c) => c.chargePointId === input.chargePointId).length + 1),
          connectorType: input.connectorType,
          powerKw: input.powerKw,
          runtimeStatus: 'offline',
          qrToken: 'QR-' + seq,
          utilizationPct: 0,
          sessionsToday: 0,
          uptime30dPct: 0,
          kwhToday: 0,
          faultCount: 0,
          lastSeen: '—',
        };
        db.connectors.unshift(rec);
        const cp = db.chargePoints.find((c) => c.id === input.chargePointId);
        if (cp) cp.maxPowerKw = Math.max(cp.maxPowerKw, input.powerKw);
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
        const province = MOCK_PROVINCES.find((p) => p.code === input.provinceCode);
        const ward = input.provinceCode ? MOCK_WARDS[input.provinceCode]?.find((w) => w.code === input.wardCode) : undefined;
        const cityName = province?.name ?? input.city ?? 'Hà Nội';
        const addressText = [input.addressLine || input.address, ward?.name, province?.name].filter(Boolean).join(', ') || input.addressLine || input.address || '';
        const code = 'ST-' + (1057 + db.ownerStations.length);
        const chargers = input.plannedChargePointCount ?? input.plannedChargers ?? 4;
        const st: Station = {
          id: code,
          stationCode: code,
          name: input.name,
          city: cityName,
          address: addressText,
          ownerName: 'EVGo Co.',
          chargerCount: chargers,
          onlineCount: 0,
          status: 'pending',
          licenseSummary: null,
          rejectionReason: null,
          bookingsToday: 0,
          revenueWeekVnd: 0,
          utilizationPct: 0,
          submittedAt: new Date().toISOString().slice(0, 10),
        };
        db.ownerStations.push(st);
        return { ...st };
      },
      async updateAmenities(id, amenities) {
        await delay();
        // Owner may only edit their own stations (BR-STA-02) — scoped to ownerStations.
        const st = db.ownerStations.find((s) => s.id === id);
        if (!st) throw new Error(`Không tìm thấy trạm ${id}`);
        st.amenities = [...amenities];
        return { ...st };
      },
      async approvals(): Promise<StationApprovalSummary[]> {
        await delay();
        return db.approvalQueue
          .filter((s) => s.status === 'pending')
          .map((s) => ({
            id: s.id,
            stationCode: s.stationCode || s.id,
            name: s.name,
            ownerDisplayName: s.ownerDisplayName || s.ownerName || 'Chủ trạm',
            provinceName: s.provinceName || s.city || 'Hà Nội',
            plannedChargePointCount: s.plannedChargePointCount ?? s.chargerCount ?? 4,
            submittedAt: s.submittedAt || new Date().toISOString(),
            ownerName: s.ownerDisplayName || s.ownerName,
            city: s.provinceName || s.city,
            chargerCount: s.plannedChargePointCount ?? s.chargerCount ?? 4,
          }));
      },
      async approvalDetail(id): Promise<StationApprovalDetail> {
        await delay();
        const s =
          db.approvalQueue.find((x) => x.id === id || x.stationCode === id) ||
          db.ownerStations.find((x) => x.id === id || x.stationCode === id) ||
          db.allStations.find((x) => x.id === id || x.stationCode === id);
        if (!s) throw new Error(`Không tìm thấy hồ sơ ${id}`);

        return {
          id: s.id,
          stationCode: s.stationCode || s.id,
          name: s.name,
          ownerDisplayName: s.ownerDisplayName || s.ownerName || 'Chủ trạm',
          provinceName: s.provinceName || s.city || 'Hà Nội',
          wardName: s.wardName || 'Phường Dịch Vọng Hậu',
          addressLine: s.addressLine || s.address || '123 Cầu Giấy',
          plannedChargePointCount: s.plannedChargePointCount ?? s.chargerCount ?? 4,
          status: s.status,
          submittedAt: s.submittedAt || new Date().toISOString(),
          licenseSubmitted: s.licenseSubmitted ?? false,
          assets: s.assets ?? [],
        };
      },
      async all() {
        await delay();
        return [...db.allStations];
      },
      async approve(id): Promise<void> {
        await delay();
        const s = db.approvalQueue.find((x) => x.id === id);
        if (!s) throw new Error(`Không tìm thấy hồ sơ ${id}`);
        if (!s.licenseSubmitted) {
          const err = new Error('Trạm cần có License còn hiệu lực trước khi được duyệt.');
          (err as any).code = 'APPROVAL_003';
          throw err;
        }
        s.status = 'active';
      },
      async reject(id, reason): Promise<void> {
        await delay();
        const s = db.approvalQueue.find((x) => x.id === id);
        if (!s) throw new Error(`Không tìm thấy hồ sơ ${id}`);
        s.status = 'rejected';
        s.rejectionReason = reason;
      },
      async suspend(id): Promise<void> {
        await delay();
        const s = db.allStations.find((x) => x.id === id) || db.ownerStations.find((x) => x.id === id);
        if (!s) throw new Error(`Không tìm thấy trạm ${id}`);
        s.status = 'suspended';
      },
      async statusHistory(id) {
        await delay();
        const station =
          db.ownerStations.find((s) => s.id === id || s.stationCode === id) ||
          db.approvalQueue.find((s) => s.id === id || s.stationCode === id) ||
          db.allStations.find((s) => s.id === id || s.stationCode === id);

        const list: StationStatusHistory[] = [];
        const baseTime = new Date('2026-06-20T08:30:00Z').getTime();

        list.push({
          id: `hist-${id}-1`,
          stationId: id,
          stationCode: station?.stationCode ?? id,
          stationName: station?.name ?? 'Trạm sạc',
          eventType: 'SUBMITTED',
          fromStatus: null,
          toStatus: 'PENDING_APPROVAL',
          reason: null,
          performedByName: station?.ownerDisplayName || station?.ownerName || 'Chủ trạm (Nguyễn Văn An)',
          performedByRole: 'STATION_OWNER',
          performedAt: new Date(baseTime).toISOString(),
        });

        if (station) {
          const st = (station.status || '').toLowerCase();
          if (st === 'rejected' || station.rejectionReason) {
            list.push({
              id: `hist-${id}-2`,
              stationId: id,
              stationCode: station.stationCode ?? id,
              stationName: station.name,
              eventType: 'REJECTED',
              fromStatus: 'PENDING_APPROVAL',
              toStatus: 'REJECTED',
              reason: station.rejectionReason || 'Hồ sơ chưa có giấy phép PCCC và gói dịch vụ License chưa kích hoạt.',
              performedByName: 'Admin Hệ Thống (Trần Quản Trị)',
              performedByRole: 'ADMIN',
              performedAt: new Date(baseTime + 86400000 * 2).toISOString(),
            });
          } else if (st === 'active') {
            list.push({
              id: `hist-${id}-2`,
              stationId: id,
              stationCode: station.stationCode ?? id,
              stationName: station.name,
              eventType: 'APPROVED',
              fromStatus: 'PENDING_APPROVAL',
              toStatus: 'ACTIVE',
              reason: null,
              performedByName: 'Admin Hệ Thống (Trần Quản Trị)',
              performedByRole: 'ADMIN',
              performedAt: new Date(baseTime + 86400000).toISOString(),
            });
          } else if (st === 'suspended') {
            list.push({
              id: `hist-${id}-2`,
              stationId: id,
              stationCode: station.stationCode ?? id,
              stationName: station.name,
              eventType: 'APPROVED',
              fromStatus: 'PENDING_APPROVAL',
              toStatus: 'ACTIVE',
              reason: null,
              performedByName: 'Admin Hệ Thống (Trần Quản Trị)',
              performedByRole: 'ADMIN',
              performedAt: new Date(baseTime + 86400000).toISOString(),
            });
            list.push({
              id: `hist-${id}-3`,
              stationId: id,
              stationCode: station.stationCode ?? id,
              stationName: station.name,
              eventType: 'SUSPENDED',
              fromStatus: 'ACTIVE',
              toStatus: 'SUSPENDED',
              reason: 'Bảo trì khẩn cấp đường dây trung thế theo yêu cầu EVN.',
              performedByName: 'Admin Hệ Thống (Lê Kiểm Soát)',
              performedByRole: 'ADMIN',
              performedAt: new Date(baseTime + 86400000 * 10).toISOString(),
            });
          }
        }
        return list;
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
          .filter((m) => m.totalVnd > 0)
          .sort((a, b) => b.totalVnd - a.totalVnd);

        // rolling 11-day trend
        const byDay = new Map<string, number>();
        for (const t of payments) {
          const d = t.date.slice(5); // MM-DD
          byDay.set(d, (byDay.get(d) ?? 0) + t.amountVnd);
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
      async issue(stationId, input) {
        await delay();
        const station =
          db.approvalQueue.find((s) => s.id === stationId || s.stationCode === stationId) ||
          db.ownerStations.find((s) => s.id === stationId || s.stationCode === stationId) ||
          db.allStations.find((s) => s.id === stationId || s.stationCode === stationId);
        if (!station) {
          const err = new Error(`Không tìm thấy trạm ${stationId}`);
          (err as any).code = 'LICENSE_001';
          throw err;
        }

        const hasActive = db.licenses.some(
          (l) => (l.stationId === stationId || l.stationId === station.id) && (l.status === 'ACTIVE' || l.status === 'active')
        );
        if (hasActive) {
          const err = new Error('Trạm sạc này đã có gói giấy phép (License) đang hoạt động.');
          (err as any).code = 'LICENSE_002';
          throw err;
        }

        const now = new Date();
        const startAt = now.toISOString();
        const expDate = new Date(now);
        if (input.plan === 'YEARLY' || (input.plan as any) === 'yearly') {
          expDate.setFullYear(expDate.getFullYear() + 1);
        } else {
          expDate.setMonth(expDate.getMonth() + 1);
        }
        const expiresAt = expDate.toISOString();
        const daysLeft = input.plan === 'YEARLY' || (input.plan as any) === 'yearly' ? 365 : 30;

        const newLic: License = {
          id: `lic-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          stationId: station.id,
          stationName: station.name,
          ownerName: station.ownerDisplayName || station.ownerName || 'Chủ trạm',
          plan: input.plan,
          feeAmount: input.feeAmount,
          startAt,
          expiresAt,
          status: 'ACTIVE',
          daysLeft,
          expiringSoon: false,
          priceVnd: input.feeAmount,
          startDate: startAt.split('T')[0],
          expiryDate: expiresAt.split('T')[0],
        };

        db.licenses.unshift(newLic);
        station.licenseSubmitted = true;
        station.licenseSummary = `${input.plan === 'YEARLY' ? 'Năm' : 'Tháng'} · hết hạn ${expiresAt.split('T')[0]}`;
        return { ...newLic };
      },
      async mine(stationId?: string) {
        await delay();
        if (stationId) {
          const lic = db.licenses.find((x) => x.stationId === stationId && (x.status === 'ACTIVE' || x.status === 'active')) || db.licenses.find((x) => x.stationId === stationId);
          if (lic) return { ...lic };
        }
        return { ...db.licenses[0] };
      },
      async history(stationId: string) {
        await delay();
        return db.licenses.filter((x) => x.stationId === stationId);
      },
      async list() {
        await delay();
        return [...db.licenses];
      },
      async recordRenewal(stationId, input) {
        await delay();
        const old = db.licenses.find((x) => x.stationId === stationId);
        if (!old) throw new Error(`Không tìm thấy giấy phép cho trạm ${stationId}`);
        const plan = input?.plan || old.plan;
        const fee = input?.feeAmount ?? old.feeAmount ?? 500000;

        const isOldActive = old.status === 'ACTIVE' || old.status === 'active';
        const startAt = isOldActive ? old.expiresAt : new Date().toISOString();
        const startDateObj = new Date(startAt);
        const expDateObj = new Date(startDateObj);
        if (plan === 'YEARLY' || (plan as any) === 'yearly') {
          expDateObj.setFullYear(expDateObj.getFullYear() + 1);
        } else {
          expDateObj.setMonth(expDateObj.getMonth() + 1);
        }
        const expiresAt = expDateObj.toISOString();
        const daysLeft = plan === 'YEARLY' || (plan as any) === 'yearly' ? 365 : 30;

        const newLic: License = {
          id: `lic-renew-${Date.now()}`,
          stationId: old.stationId,
          stationName: old.stationName,
          ownerName: old.ownerName,
          plan,
          feeAmount: fee,
          startAt,
          expiresAt,
          status: isOldActive ? 'PENDING' : 'ACTIVE',
          daysLeft,
          expiringSoon: false,
          priceVnd: fee,
          startDate: startAt.split('T')[0],
          expiryDate: expiresAt.split('T')[0],
        };

        db.licenses.unshift(newLic);
        return { ...newLic };
      },
      async suspend(stationId, licenseId) {
        await delay();
        const l = db.licenses.find((x) => x.id === licenseId || x.stationId === stationId);
        if (!l) throw new Error('Không tìm thấy license');
        l.status = 'SUSPENDED';
        const st = db.allStations.find((s) => s.id === stationId) || db.approvalQueue.find((s) => s.id === stationId);
        if (st) st.licenseSubmitted = false;
        return { ...l };
      },
      async activate(stationId, licenseId) {
        await delay();
        const l = db.licenses.find((x) => x.id === licenseId || x.stationId === stationId);
        if (!l) throw new Error('Không tìm thấy license');
        l.status = 'ACTIVE';
        const st = db.allStations.find((s) => s.id === stationId) || db.approvalQueue.find((s) => s.id === stationId);
        if (st) st.licenseSubmitted = true;
        return { ...l };
      },
      async cancel(stationId, licenseId) {
        await delay();
        const l = db.licenses.find((x) => x.id === licenseId || x.stationId === stationId);
        if (!l) throw new Error('Không tìm thấy license');
        l.status = 'CANCELLED';
        const st = db.allStations.find((s) => s.id === stationId) || db.approvalQueue.find((s) => s.id === stationId);
        if (st) st.licenseSubmitted = false;
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

    staff: {
      async list() {
        await delay();
        // BR-ACC-05: owner sees assignments for their own stations only.
        return db.stationStaff
          .filter((s) => db.ownerStationIds.includes(s.stationId))
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      },
      async invite({ email, stationId }) {
        await delay();
        const clean = email.trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) throw new Error('Email không hợp lệ');

        const station = db.ownerStations.find((s) => s.id === stationId);
        if (!station) throw new Error(`Không tìm thấy trạm ${stationId}`);
        if (db.stationStaff.some((s) => s.email.toLowerCase() === clean && s.stationId === stationId)) {
          throw new Error(`${email} đã là nhân viên của ${station.name}`);
        }

        // FR17: grant additively to an existing account, else provision a new one.
        const existing = db.users.find((u) => u.email.toLowerCase() === clean);
        const created = !existing;
        const member: StationStaffMember = {
          userId: existing?.id ?? 'U-' + seq++,
          stationId,
          stationName: station.name,
          name: existing?.name ?? clean,
          email: existing?.email ?? clean,
          primaryRole: existing?.role ?? 'DRIVER',
          provisioned: created,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        db.stationStaff.unshift(member);
        if (created) {
          db.users.push({
            id: member.userId,
            name: member.name,
            email: member.email,
            role: 'DRIVER',
            joined: member.createdAt,
            bookingCount: 0,
            status: 'active',
          });
        }
        return { member: { ...member }, created };
      },
      async revoke(userId, stationId) {
        await delay();
        const i = db.stationStaff.findIndex((s) => s.userId === userId && s.stationId === stationId);
        if (i < 0) throw new Error('Không tìm thấy phân công này');
        // Deletes the assignment row only — the account and its other roles survive (FR17).
        db.stationStaff.splice(i, 1);
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

    tickets: {
      async list(params = {}) {
        await delay();
        const { status = 'all', category = 'all', search = '', page = 0, pageSize = 10 } = params;
        const q = search.trim().toLowerCase();
        let rows = scopedTickets();
        if (status !== 'all') rows = rows.filter((tk) => tk.status === status);
        if (category !== 'all') rows = rows.filter((tk) => tk.category === category);
        if (q) {
          rows = rows.filter(
            (tk) =>
              tk.id.toLowerCase().includes(q) ||
              tk.subject.toLowerCase().includes(q) ||
              tk.reporterName.toLowerCase().includes(q),
          );
        }
        rows = [...rows].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
        return { items: rows.slice(page * pageSize, (page + 1) * pageSize), total: rows.length, page, pageSize };
      },
      async get(id) {
        await delay(150);
        const tk = db.tickets.find((x) => x.id === id);
        if (!tk) throw new Error(`Không tìm thấy ticket ${id}`);
        return tk;
      },
      async messages(id) {
        await delay(150);
        return [...(db.ticketMessages[id] ?? [])];
      },
      async summary() {
        await delay();
        const rows = scopedTickets();
        const byStatus = { open: 0, in_progress: 0, resolved: 0, closed: 0 } as Record<TicketStatus, number>;
        for (const tk of rows) byStatus[tk.status]++;
        return { total: rows.length, byStatus };
      },
      async reply(id, body) {
        await delay();
        const tk = db.tickets.find((x) => x.id === id);
        if (!tk) throw new Error(`Không tìm thấy ticket ${id}`);
        const now = new Date().toISOString();
        const reply: TicketMessage = {
          id: 'MSG-' + seq++,
          ticketId: id,
          authorName: scope.ownerView ? 'Bạn' : 'Quản trị viên',
          authorRole: scope.ownerView ? 'station_staff' : 'platform_admin',
          body,
          createdAt: now,
        };
        (db.ticketMessages[id] ??= []).push(reply);
        tk.lastMessagePreview = body.slice(0, 120);
        tk.messageCount += 1;
        tk.updatedAt = now;
        if (tk.status === 'open') tk.status = 'in_progress';
        return reply;
      },
      async setStatus(id, status) {
        await delay();
        const tk = db.tickets.find((x) => x.id === id);
        if (!tk) throw new Error(`Không tìm thấy ticket ${id}`);
        tk.status = status;
        tk.updatedAt = new Date().toISOString();
        return { ...tk };
      },
      async reassign(id, stationName) {
        await delay();
        const tk = db.tickets.find((x) => x.id === id);
        if (!tk) throw new Error(`Không tìm thấy ticket ${id}`);
        const match = db.stationsDirectory.find((s) => s.name === stationName);
        tk.stationId = match?.id ?? tk.stationId;
        tk.stationName = match?.name ?? stationName;
        tk.updatedAt = new Date().toISOString();
        return { ...tk };
      },
      async escalate(id) {
        await delay();
        const tk = db.tickets.find((x) => x.id === id);
        if (!tk) throw new Error(`Không tìm thấy ticket ${id}`);
        tk.status = 'in_progress';
        tk.assigneeName = 'Đội vận hành trung tâm';
        tk.updatedAt = new Date().toISOString();
        return { ...tk };
      },
    },
  };
}

export type { Booking };
