/**
 * In-memory implementation of every service — the app's data source until the
 * Spring Boot backend exists. Simulates network latency so loading states are
 * real, and mutates the in-memory DB so flows (cancel, approve, rename…) feel
 * live within a session.
 */
import type { Services } from '../services';
import type {
  AdministrativeProvince,
  AdministrativeWard,
  Booking,
  BookingStatus,
  BookingSummary,
  ChargePoint,
  Connector,
  License,
  LicenseStatus,
  LicenseStatusEventDto,
  OwnerDashboard,
  PaymentMethod,
  Station,
  StationApprovalDetail,
  StationApprovalSummary,
  StationAsset,
  StaffAssignmentStatus,
  CurrentStaffContextResponse,
  StationStaffMember,
  StationStatusHistory,
  TicketMessage,
  TicketStatus,
  TransactionSummary,
  UserProfile,
  UserProfileUpdateRequest,
} from '../types';
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
  return cp?.provisioningStatus === 'ACTIVE' && cp?.operationalStatus === 'AVAILABLE' ? c.runtimeStatus : 'OFFLINE';
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
    profile: {
      async get(): Promise<UserProfile> {
        await delay();
        return {
          id: '11111111-1111-1111-1111-111111111111',
          keycloakId: 'keycloak-001',
          email: 'admin@chargeops.com',
          displayName: 'Admin ChargeOps',
          phone: '0901234567',
          status: 'active',
          profileCompleted: true,
        };
      },
      async update(req: UserProfileUpdateRequest): Promise<UserProfile> {
        await delay();
        return {
          id: '11111111-1111-1111-1111-111111111111',
          keycloakId: 'keycloak-001',
          email: 'admin@chargeops.com',
          displayName: req.displayName,
          phone: req.phone,
          status: 'active',
          profileCompleted: true,
        };
      },
    },

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
        const online = live.filter((x) => x.status !== 'OFFLINE');
        const offline = live.find((x) => x.status === 'OFFLINE')?.c;
        const upcoming = scopedBookings()
          .filter((b) => b.status === 'confirmed' || b.status === 'pending')
          .slice(0, 4);
        return {
          license: {
            status: lic.status,
            expiryDate: lic.expiryDate || lic.expiresAt?.split('T')[0] || '',
            daysLeft: lic.daysLeft ?? 0,
            expiringSoon: lic.expiringSoon ?? false,
          },
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
            name: c.name || c.connectorCode || c.id,
            zoneLabel: db.chargePoints.find((cp) => cp.id === c.chargePointId)?.zoneLabel ?? null,
            runtimeStatus: effectiveRuntimeStatus(c, db.chargePoints),
            utilizationPct: c.utilizationPct ?? 0,
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
            reportedFaults: db.connectors.reduce((n, c) => n + (c.faultCount ?? 0), 0),
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
        const online = live.filter((x) => x.status !== 'OFFLINE');
        const offline = live.find((x) => x.status === 'OFFLINE')?.c;
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
            name: c.name || c.connectorCode || c.id,
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
            { connector: 'CHADEMO', pct: 24 },
            { connector: 'TYPE2', pct: 20 },
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
        return { ...cp };
      },
      async changeOperationalStatus(id, input) {
        await delay();
        const cp = db.chargePoints.find((x) => x.id === id);
        if (!cp) throw new Error(`Không tìm thấy trụ sạc ${id}`);
        cp.operationalStatus = input.operationalStatus;
        return { ...cp };
      },
      async provision(input) {
        await delay();
        const id = 'CP-' + seq++;
        const maxPowerKw = Math.max(...input.connectorGroups.map((group) => group.powerKw));
        const rec: ChargePoint = {
          id,
          stationId: input.stationId,
          name: input.name || input.chargePointCode || id,
          zoneLabel: input.zoneLabel ?? null,
          maxPowerKw,
          provisioningStatus: 'PENDING_ACTIVATION',
          operationalStatus: 'AVAILABLE',
        };
        db.chargePoints.unshift(rec);
        let connectorNumber = 1;
        input.connectorGroups.forEach((group) => {
          for (let index = 0; index < group.quantity; index += 1) {
            const connectorCode = `C-${String(connectorNumber++).padStart(2, '0')}`;
            db.connectors.unshift({
              id: 'CH-' + seq++,
              chargePointId: id,
              connectorCode,
              name: connectorCode,
              connectorType: group.connectorType,
              powerKw: group.powerKw,
              runtimeStatus: 'AVAILABLE',
              utilizationPct: 0,
              sessionsToday: 0,
              uptime30dPct: 0,
              kwhToday: 0,
              faultCount: 0,
              lastSeen: '—',
            });
          }
        });
        return { ...rec };
      },
      async activate(id, _stationId, expectedConnectorCount) {
        await delay();
        const cp = db.chargePoints.find((x) => x.id === id);
        if (!cp) throw new Error(`Không tìm thấy trụ sạc ${id}`);
        if (cp.provisioningStatus !== 'PENDING_ACTIVATION') {
          throw new Error('Chỉ trụ đang chờ kích hoạt mới có thể được kích hoạt.');
        }
        const actualConnectorCount = db.connectors.filter((c) => c.chargePointId === id).length;
        if (actualConnectorCount === 0) {
          throw new Error('Trụ sạc cần ít nhất một súng sạc trước khi kích hoạt.');
        }
        if (actualConnectorCount !== expectedConnectorCount) {
          throw new Error(`Số súng xác nhận (${expectedConnectorCount}) không khớp tồn kho (${actualConnectorCount}).`);
        }
        cp.provisioningStatus = 'ACTIVE';
        return { ...cp };
      },
      async suspend(id) {
        await delay();
        const cp = db.chargePoints.find((x) => x.id === id);
        if (!cp) throw new Error(`Không tìm thấy trụ sạc ${id}`);
        cp.provisioningStatus = 'SUSPENDED';
        return { ...cp };
      },
      async reactivate(id) {
        await delay();
        const cp = db.chargePoints.find((x) => x.id === id);
        if (!cp) throw new Error(`Không tìm thấy trụ sạc ${id}`);
        cp.provisioningStatus = 'ACTIVE';
        return { ...cp };
      },
      async get(id) {
        await delay();
        const cp = db.chargePoints.find((x) => x.id === id);
        if (!cp) throw new Error(`Không tìm thấy trụ sạc ${id}`);
        return { ...cp };
      },
      async remove(id) {
        await delay();
        const index = db.chargePoints.findIndex((cp) => cp.id === id);
        if (index < 0) throw new Error(`Không tìm thấy trụ sạc ${id}`);
        if (db.chargePoints[index].provisioningStatus !== 'PENDING_ACTIVATION') {
          throw new Error('Chỉ có thể xóa trụ đang chờ kích hoạt.');
        }
        db.chargePoints.splice(index, 1);
        for (let i = db.connectors.length - 1; i >= 0; i -= 1) {
          if (db.connectors[i].chargePointId === id) db.connectors.splice(i, 1);
        }
      },
      async statusHistory(id) {
        await delay();
        const cp = db.chargePoints.find((x) => x.id === id);
        if (!cp) return [];
        return [
          {
            id: 'CP-EVT-1',
            statusDimension: 'PROVISIONING' as const,
            fromStatus: 'PENDING_ACTIVATION',
            toStatus: cp.provisioningStatus,
            reason: cp.provisioningStatus === 'SUSPENDED' ? 'Tạm ngưng kiểm tra kỹ thuật' : 'Kích hoạt hoàn tất nghiệm thu',
            actorType: 'ADMIN' as const,
            performedById: 'usr-admin-1',
            performedByDisplayName: 'Admin Quản trị',
            performedAt: new Date().toISOString(),
          },
        ];
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
        if (patch.connectorType !== undefined) c.connectorType = patch.connectorType;
        if (patch.powerKw !== undefined) c.powerKw = patch.powerKw;
        return { ...c };
      },
      async provision(input) {
        await delay();
        const cp = db.chargePoints.find((c) => c.id === input.chargePointId);
        if (!cp) throw new Error(`Không tìm thấy trụ sạc ${input.chargePointId}`);
        if (cp.provisioningStatus !== 'PENDING_ACTIVATION') {
          throw new Error('Không thể thêm súng sạc sau khi trụ đã kích hoạt.');
        }
        const code = input.connectorCode || ('C-0' + (db.connectors.filter((c) => c.chargePointId === input.chargePointId).length + 1));
        const rec: Connector = {
          id: 'CH-' + seq++,
          chargePointId: input.chargePointId,
          connectorCode: code,
          name: input.name || code,
          connectorType: input.connectorType,
          powerKw: input.powerKw,
          runtimeStatus: 'AVAILABLE',
          utilizationPct: 0,
          sessionsToday: 0,
          uptime30dPct: 0,
          kwhToday: 0,
          faultCount: 0,
          lastSeen: '—',
        };
        db.connectors.unshift(rec);
        cp.maxPowerKw = Math.max(cp.maxPowerKw, input.powerKw);
        return { ...rec };
      },
      async remove(id, _stationId, chargePointId) {
        await delay();
        const cp = db.chargePoints.find((item) => item.id === chargePointId);
        if (!cp) throw new Error(`Không tìm thấy trụ sạc ${chargePointId}`);
        if (cp.provisioningStatus !== 'PENDING_ACTIVATION') {
          throw new Error('Chỉ có thể xóa súng của trụ đang chờ kích hoạt.');
        }
        const index = db.connectors.findIndex((connector) => connector.id === id);
        if (index < 0) throw new Error(`Không tìm thấy connector ${id}`);
        db.connectors.splice(index, 1);
        const remaining = db.connectors.filter((connector) => connector.chargePointId === chargePointId);
        cp.maxPowerKw = remaining.length ? Math.max(...remaining.map((connector) => connector.powerKw)) : 0;
      },
      async statusHistory(id) {
        await delay();
        const c = db.connectors.find((x) => x.id === id);
        if (!c) return [];
        return [
          {
            id: 'CONN-EVT-1',
            fromStatus: 'AVAILABLE' as const,
            toStatus: c.runtimeStatus,
            reason: 'Thay đổi trạng thái vận hành súng sạc',
            actorType: 'OWNER' as const,
            performedById: 'usr-owner-1',
            performedByDisplayName: 'Chủ trạm',
            performedAt: new Date().toISOString(),
          },
        ];
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
      async changeOperationalStatus(stationId, input) {
        await delay();
        const st = db.ownerStations.find((s) => s.id === stationId);
        if (st) {
          st.operationalStatus = input.operationalStatus;
          st.operationalStatusReason = input.reason || null;
          if (input.operationalStatus === 'PAUSED') {
            st.operatingState = 'PAUSED_BY_OWNER';
            st.openNow = false;
          } else if (input.operationalStatus === 'MAINTENANCE') {
            st.operatingState = 'MAINTENANCE';
            st.openNow = false;
          } else if (input.operationalStatus === 'OPERATING') {
            st.operatingState = 'OPEN';
            st.openNow = true;
          }
        }
        return {
          stationId,
          operationalStatus: input.operationalStatus,
          reason: input.reason,
        };
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
      async adminList(params = {}) {
        await delay();
        let list = [...db.allStations];
        if (params.status && (params.status as string) !== 'all') {
          list = list.filter((s) => String(s.status).toUpperCase() === String(params.status).toUpperCase());
        }
        if (params.search) {
          const q = params.search.toLowerCase();
          list = list.filter((s) => s.name.toLowerCase().includes(q) || (s.stationCode || '').toLowerCase().includes(q));
        }
        const pageNo = params.pageNo ?? 1;
        const pageSize = params.pageSize ?? 8;
        const start = (pageNo - 1) * pageSize;
        const items = list.slice(start, start + pageSize).map((s) => ({
          id: s.id,
          stationCode: s.stationCode || s.id,
          name: s.name,
          addressLine: s.addressLine || s.address || 'Hà Nội',
          provinceName: s.provinceName || s.city || 'Hà Nội',
          wardName: s.wardName || 'Phường Dịch Vọng Hậu',
          ownerId: 'owner-1',
          ownerDisplayName: s.ownerDisplayName || s.ownerName || 'Chủ trạm EVGo',
          ownerEmail: 'owner@evgo.vn',
          contactPhone: '0901234567',
          plannedChargePointCount: s.plannedChargePointCount ?? s.chargerCount ?? 4,
          status: s.status,
          createdAt: s.submittedAt || new Date().toISOString(),
          licenseSummary: typeof s.licenseSummary === 'object' ? s.licenseSummary : null,
        }));
        return {
          items,
          total: list.length,
          page: pageNo,
          pageSize,
        };
      },
      async adminDetail(id) {
        await delay();
        const s =
          db.allStations.find((x) => x.id === id || x.stationCode === id) ||
          db.ownerStations.find((x) => x.id === id || x.stationCode === id) ||
          db.approvalQueue.find((x) => x.id === id || x.stationCode === id);
        if (!s) throw new Error(`Không tìm thấy trạm ${id}`);
        return {
          id: s.id,
          stationCode: s.stationCode || s.id,
          name: s.name,
          description: 'Trạm sạc tiêu chuẩn ChargeOps.',
          addressLine: s.addressLine || s.address || '123 Cầu Giấy',
          provinceName: s.provinceName || s.city || 'Hà Nội',
          wardName: s.wardName || 'Phường Dịch Vọng Hậu',
          latitude: 21.028511,
          longitude: 105.854444,
          contactPhone: '0901234567',
          plannedChargePointCount: s.plannedChargePointCount ?? s.chargerCount ?? 4,
          status: s.status,
          createdAt: s.submittedAt || new Date().toISOString(),
          ownerId: 'owner-1',
          ownerDisplayName: s.ownerDisplayName || s.ownerName || 'Chủ trạm EVGo',
          ownerEmail: 'owner@evgo.vn',
          ownerPhoneNumber: '0901234567',
          assets: s.assets ?? [],
          operatingPeriods: [
            { id: 'p-1', dayOfWeek: 'MONDAY', openTime: '06:00', closeTime: '23:00' },
            { id: 'p-2', dayOfWeek: 'TUESDAY', openTime: '06:00', closeTime: '23:00' },
            { id: 'p-3', dayOfWeek: 'WEDNESDAY', openTime: '06:00', closeTime: '23:00' },
            { id: 'p-4', dayOfWeek: 'THURSDAY', openTime: '06:00', closeTime: '23:00' },
            { id: 'p-5', dayOfWeek: 'FRIDAY', openTime: '06:00', closeTime: '23:00' },
            { id: 'p-6', dayOfWeek: 'SATURDAY', openTime: '06:00', closeTime: '23:00' },
            { id: 'p-7', dayOfWeek: 'SUNDAY', openTime: '06:00', closeTime: '23:00' },
          ],
          licenseSummary: typeof s.licenseSummary === 'object' ? s.licenseSummary : null,
        };
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
      async suspend(id, reason): Promise<void> {
        await delay();
        const s = db.allStations.find((x) => x.id === id) || db.ownerStations.find((x) => x.id === id);
        if (!s) throw new Error(`Không tìm thấy trạm ${id}`);
        s.status = 'suspended';
      },
      async reactivate(id, reason): Promise<void> {
        await delay();
        const s = db.allStations.find((x) => x.id === id) || db.ownerStations.find((x) => x.id === id);
        if (!s) throw new Error(`Không tìm thấy trạm ${id}`);
        s.status = 'active';
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
      async getAssets(stationId) {
        await delay();
        const s = db.ownerStations.find((x) => x.id === stationId) || db.allStations.find((x) => x.id === stationId);
        return s?.assets ?? [];
      },
      async registerAsset(stationId, input) {
        await delay();
        const s = db.ownerStations.find((x) => x.id === stationId) || db.allStations.find((x) => x.id === stationId);
        if (!s) throw new Error(`Không tìm thấy trạm ${stationId}`);
        if (!s.assets) s.assets = [];
        const isPrimary = Boolean(input.primary) || s.assets.length === 0;
        if (isPrimary) {
          s.assets.forEach((a) => (a.isPrimary = false));
        }
        const newAsset: StationAsset = {
          id: `asset-${Date.now()}`,
          assetUrl: input.assetUrl,
          storageKey: input.storageKey,
          assetType: input.assetType || 'IMAGE',
          altText: input.altText || s.name,
          isPrimary,
          displayOrder: s.assets.length,
        };
        s.assets.push(newAsset);
        return newAsset;
      },
      async deleteAsset(stationId, assetId) {
        await delay();
        const s = db.ownerStations.find((x) => x.id === stationId) || db.allStations.find((x) => x.id === stationId);
        if (s && s.assets) {
          s.assets = s.assets.filter((a) => a.id !== assetId && a.storageKey !== assetId);
        }
      },
      async setPrimaryAsset(stationId, assetId) {
        await delay();
        const s = db.ownerStations.find((x) => x.id === stationId) || db.allStations.find((x) => x.id === stationId);
        if (!s || !s.assets) throw new Error(`Không tìm thấy ảnh ${assetId}`);
        let target: StationAsset | undefined;
        s.assets.forEach((a) => {
          if (a.id === assetId || a.storageKey === assetId) {
            a.isPrimary = true;
            target = a;
          } else {
            a.isPrimary = false;
          }
        });
        if (!target) throw new Error(`Không tìm thấy ảnh ${assetId}`);
        return target;
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
          .sort((a, b) => a[0].localeCompare(b[0]))
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
        const fee = input.plan === 'YEARLY' ? 5000000 : 500000;
        const nextSeq = 1000 + db.licenses.length + 1;
        const licId = `lic-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const newLic: License = {
          id: licId,
          licenseCode: `LIC-${String(nextSeq).padStart(6, '0')}`,
          stationId: station.id,
          stationCode: station.stationCode || station.id,
          stationName: station.name,
          ownerName: station.ownerDisplayName || station.ownerName || 'Chủ trạm',
          plan: input.plan,
          feeAmount: fee,
          startAt,
          expiresAt,
          status: 'ACTIVE',
          daysLeft,
          expiringSoon: false,
          priceVnd: fee,
          startDate: startAt.split('T')[0],
          expiryDate: expiresAt.split('T')[0],
          createdAt: now.toISOString(),
          recordedByName: 'Quản trị hệ thống',
        };

        db.licenses.unshift(newLic);
        if (!db.licenseStatusEvents[licId]) {
          db.licenseStatusEvents[licId] = [];
        }
        db.licenseStatusEvents[licId].push({
          id: `LSE-${Date.now()}-1`,
          licenseId: licId,
          eventType: 'ISSUED',
          fromStatus: null,
          toStatus: 'ACTIVE',
          reason: 'Cấp mới License sau xác minh ngoài nền tảng',
          actorType: 'USER',
          performedByName: 'Quản trị hệ thống',
          performedAt: now.toISOString(),
        });

        station.licenseSubmitted = true;
        station.licenseSummary = `${input.plan === 'YEARLY' ? 'Năm' : 'Tháng'} · hết hạn ${expiresAt.split('T')[0]}`;
        return { ...newLic };
      },
      async mine(stationId?: string) {
        await delay();
        if (stationId) {
          const lic = db.licenses.find((x) => (x.stationId === stationId || x.stationCode === stationId) && (x.status === 'ACTIVE' || x.status === 'active')) || db.licenses.find((x) => x.stationId === stationId || x.stationCode === stationId);
          if (lic) return { ...lic };
        }
        return { ...db.licenses[0] };
      },
      async history(stationId: string) {
        await delay();
        return db.licenses.filter((x) => x.stationId === stationId || x.stationCode === stationId);
      },
      async list(params = {}) {
        await delay();
        let items = [...db.licenses];

        if (params.status && params.status !== 'all') {
          const s = String(params.status).toUpperCase();
          items = items.filter((l) => {
            const st = String(l.status).toUpperCase();
            if (s === 'EXPIRED') return st === 'EXPIRED' || st === 'expired';
            return st === s;
          });
        }

        if (params.stationId) {
          items = items.filter((l) => l.stationId === params.stationId || l.stationCode === params.stationId);
        }

        if (params.search) {
          const q = params.search.trim().toLowerCase();
          items = items.filter((l) => {
            return (
              (l.licenseCode && l.licenseCode.toLowerCase().includes(q)) ||
              (l.id && l.id.toLowerCase().includes(q)) ||
              (l.stationId && l.stationId.toLowerCase().includes(q)) ||
              (l.stationCode && l.stationCode.toLowerCase().includes(q)) ||
              (l.stationName && l.stationName.toLowerCase().includes(q)) ||
              (l.ownerName && l.ownerName.toLowerCase().includes(q))
            );
          });
        }

        const total = items.length;
        const page = params.pageNo ?? 0;
        const pageSize = params.pageSize ?? 10;
        const start = page * pageSize;
        const paginatedItems = items.slice(start, start + pageSize);

        return {
          items: paginatedItems,
          total,
          page,
          pageSize,
        };
      },
      async detail(licenseId: string) {
        await delay();
        const l = db.licenses.find((x) => x.id === licenseId || x.licenseCode === licenseId);
        if (!l) throw new Error(`Không tìm thấy giấy phép ${licenseId}`);
        return { ...l };
      },
      async statusEvents(licenseId: string) {
        await delay();
        const events = db.licenseStatusEvents[licenseId];
        if (events && events.length > 0) {
          return [...events];
        }
        const lic = db.licenses.find((x) => x.id === licenseId || x.licenseCode === licenseId);
        if (!lic) return [];

        const defaultEvents: LicenseStatusEventDto[] = [
          {
            id: `LSE-${licenseId}-1`,
            licenseId: lic.id,
            eventType: 'ISSUED',
            fromStatus: null,
            toStatus: lic.status === 'PENDING' ? 'PENDING' : 'ACTIVE',
            reason: 'Ghi nhận cấp License từ quản trị viên',
            actorType: 'USER',
            performedByName: lic.recordedByName || 'Quản trị hệ thống',
            performedAt: lic.createdAt || lic.startAt || new Date().toISOString(),
          },
        ];
        if (lic.status === 'SUSPENDED') {
          defaultEvents.push({
            id: `LSE-${licenseId}-2`,
            licenseId: lic.id,
            eventType: 'SUSPENDED',
            fromStatus: 'ACTIVE',
            toStatus: 'SUSPENDED',
            reason: 'Tạm ngưng quyền vận hành',
            actorType: 'USER',
            performedByName: 'Quản trị hệ thống',
            performedAt: new Date().toISOString(),
          });
        } else if (lic.status === 'CANCELLED') {
          defaultEvents.push({
            id: `LSE-${licenseId}-2`,
            licenseId: lic.id,
            eventType: 'CANCELLED',
            fromStatus: 'ACTIVE',
            toStatus: 'CANCELLED',
            reason: 'Hủy bỏ License',
            actorType: 'USER',
            performedByName: 'Quản trị hệ thống',
            performedAt: new Date().toISOString(),
          });
        }
        db.licenseStatusEvents[licenseId] = defaultEvents;
        return defaultEvents;
      },
      async recordRenewal(stationId, input) {
        await delay();
        const old = db.licenses.find((x) => x.stationId === stationId || x.stationCode === stationId);
        if (!old) throw new Error(`Không tìm thấy giấy phép cho trạm ${stationId}`);
        const plan = input?.plan || old.plan;
        const fee = plan === 'YEARLY' || (plan as any) === 'yearly' ? 5000000 : 500000;

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
        const nextSeq = 1000 + db.licenses.length + 1;
        const newLicId = `lic-renew-${Date.now()}`;
        const newStatus = isOldActive ? 'PENDING' : 'ACTIVE';

        const newLic: License = {
          id: newLicId,
          licenseCode: `LIC-${String(nextSeq).padStart(6, '0')}`,
          stationId: old.stationId,
          stationCode: old.stationCode || old.stationId,
          stationName: old.stationName,
          ownerName: old.ownerName,
          plan,
          feeAmount: fee,
          startAt,
          expiresAt,
          status: newStatus,
          daysLeft,
          expiringSoon: false,
          priceVnd: fee,
          startDate: startAt.split('T')[0],
          expiryDate: expiresAt.split('T')[0],
          createdAt: new Date().toISOString(),
          recordedByName: 'Quản trị hệ thống',
        };

        db.licenses.unshift(newLic);
        db.licenseStatusEvents[newLicId] = [
          {
            id: `LSE-${newLicId}-1`,
            licenseId: newLicId,
            eventType: 'ISSUED',
            fromStatus: null,
            toStatus: newStatus,
            reason: `Ghi nhận gia hạn gói ${plan === 'YEARLY' ? 'Năm' : 'Tháng'} ngoài nền tảng`,
            actorType: 'USER',
            performedByName: 'Quản trị hệ thống',
            performedAt: new Date().toISOString(),
          },
        ];

        return { ...newLic };
      },
      async renew(licenseId: string, input) {
        await delay();
        const old = db.licenses.find((x) => x.id === licenseId || x.licenseCode === licenseId);
        if (!old) throw new Error(`Không tìm thấy giấy phép ${licenseId}`);
        return this.recordRenewal(old.stationId, input);
      },
      async suspend(stationId, licenseId, reason) {
        await delay();
        const l = db.licenses.find((x) => x.id === licenseId || x.licenseCode === licenseId);
        if (!l) throw new Error('Không tìm thấy license');
        const prevStatus = l.status;
        l.status = 'SUSPENDED';
        const st = db.allStations.find((s) => s.id === stationId) || db.approvalQueue.find((s) => s.id === stationId);
        if (st) st.licenseSubmitted = false;

        if (!db.licenseStatusEvents[l.id]) db.licenseStatusEvents[l.id] = [];
        db.licenseStatusEvents[l.id].unshift({
          id: `LSE-${Date.now()}`,
          licenseId: l.id,
          eventType: 'SUSPENDED',
          fromStatus: prevStatus,
          toStatus: 'SUSPENDED',
          reason: reason || 'Tạm ngưng quyền vận hành',
          actorType: 'USER',
          performedByName: 'Admin Hệ Thống (Lê Kiểm Soát)',
          performedAt: new Date().toISOString(),
        });

        return { ...l };
      },
      async activate(stationId, licenseId, reason) {
        await delay();
        const l = db.licenses.find((x) => x.id === licenseId || x.licenseCode === licenseId);
        if (!l) throw new Error('Không tìm thấy license');
        const prevStatus = l.status;
        l.status = 'ACTIVE';
        const st = db.allStations.find((s) => s.id === stationId) || db.approvalQueue.find((s) => s.id === stationId);
        if (st) st.licenseSubmitted = true;

        const isReactivation = prevStatus === 'SUSPENDED';
        const eventType = isReactivation ? 'REACTIVATED' : 'ACTIVATED';

        if (!db.licenseStatusEvents[l.id]) db.licenseStatusEvents[l.id] = [];
        db.licenseStatusEvents[l.id].unshift({
          id: `LSE-${Date.now()}`,
          licenseId: l.id,
          eventType,
          fromStatus: prevStatus,
          toStatus: 'ACTIVE',
          reason: reason || (isReactivation ? 'Khôi phục quyền vận hành' : null),
          actorType: isReactivation ? 'USER' : 'SYSTEM',
          performedByName: isReactivation ? 'Admin Hệ Thống (Lê Kiểm Soát)' : 'SYSTEM',
          performedAt: new Date().toISOString(),
        });

        return { ...l };
      },
      async cancel(stationId, licenseId, reason) {
        await delay();
        const l = db.licenses.find((x) => x.id === licenseId || x.licenseCode === licenseId);
        if (!l) throw new Error('Không tìm thấy license');
        const prevStatus = l.status;
        l.status = 'CANCELLED';
        const st = db.allStations.find((s) => s.id === stationId) || db.approvalQueue.find((s) => s.id === stationId);
        if (st) st.licenseSubmitted = false;

        if (!db.licenseStatusEvents[l.id]) db.licenseStatusEvents[l.id] = [];
        db.licenseStatusEvents[l.id].unshift({
          id: `LSE-${Date.now()}`,
          licenseId: l.id,
          eventType: 'CANCELLED',
          fromStatus: prevStatus,
          toStatus: 'CANCELLED',
          reason: reason || 'Hủy bỏ License vĩnh viễn',
          actorType: 'USER',
          performedByName: 'Admin Hệ Thống (Trần Quản Trị)',
          performedAt: new Date().toISOString(),
        });

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
      async currentContext(): Promise<CurrentStaffContextResponse> {
        await delay(150);
        const as = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('as') : null;
        if (as === 'staff') {
          const active = db.stationStaff.find((s) => s.status === 'ACTIVE') || {
            assignmentId: 'ASG-1001',
            stationId: 'ST-1001',
            stationName: 'Trạm Hà Đông',
            status: 'ACTIVE' as StaffAssignmentStatus,
          };
          return {
            staff: true,
            assignmentId: active.assignmentId,
            assignmentStatus: 'ACTIVE',
            station: {
              id: active.stationId,
              stationCode: 'ST-1001',
              name: active.stationName,
            },
          };
        }
        return {
          staff: false,
          assignmentId: null,
          assignmentStatus: null,
          station: null,
        };
      },

      async list(stationId?: string, params?: { pageNo?: number; pageSize?: number; assignmentStatus?: StaffAssignmentStatus }) {
        await delay();
        // BR-ACC-05: owner sees assignments for their own stations only.
        return db.stationStaff
          .filter((s) => {
            if (stationId && s.stationId !== stationId) return false;
            if (!stationId && !db.ownerStationIds.includes(s.stationId)) return false;
            if (params?.assignmentStatus && s.status !== params.assignmentStatus) return false;
            if (!params?.assignmentStatus && s.status !== 'ACTIVE') return false;
            return true;
          })
          .sort((a, b) => (a.assignedAt < b.assignedAt ? 1 : -1));
      },

      async lookup(stationId: string, email: string) {
        await delay(250);
        const clean = email.trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
          return { exists: false, email: clean, assignable: false, status: 'NOT_FOUND' };
        }

        // Check if Owner's own email
        if (clean === 'ops@evgo.vn' || clean === 'owner@chargeops.vn') {
          return {
            exists: true,
            email: clean,
            displayName: 'EVGo Co. (Vũ A.)',
            maskedPhone: '090****111',
            assignable: false,
            status: 'SELF_ASSIGNMENT',
          };
        }

        const user = db.users.find((u) => u.email.toLowerCase() === clean);
        if (!user) {
          return {
            exists: false,
            email: clean,
            assignable: false,
            status: 'NOT_FOUND',
          };
        }

        if (user.status === 'suspended') {
          return {
            exists: true,
            userId: user.id,
            email: user.email,
            displayName: user.name,
            maskedPhone: '098****321',
            assignable: false,
            status: 'ACCOUNT_INACTIVE',
          };
        }

        if (user.role === 'ADMIN' || user.role === 'OWNER') {
          return {
            exists: true,
            userId: user.id,
            email: user.email,
            displayName: user.name,
            maskedPhone: '098****888',
            assignable: false,
            status: 'ROLE_NOT_ALLOWED',
          };
        }

        // Check if already active at ANY station (V19 constraint: one active per user globally)
        const currentActive = db.stationStaff.find(
          (s) => (s.userId === user.id || s.email.toLowerCase() === clean) && s.status === 'ACTIVE',
        );
        if (currentActive) {
          return {
            exists: true,
            userId: user.id,
            email: user.email,
            displayName: user.name,
            maskedPhone: currentActive.maskedPhone || '098****123',
            assignable: false,
            status: 'ALREADY_ASSIGNED',
          };
        }

        // Eligible user
        return {
          exists: true,
          userId: user.id,
          email: user.email,
          displayName: user.name,
          maskedPhone: '098****567',
          assignable: true,
          status: 'ELIGIBLE',
        };
      },

      async assign(stationId: string, { email, note }: { email: string; note?: string }) {
        await delay();
        const clean = email.trim().toLowerCase();
        const station = db.ownerStations.find((s) => s.id === stationId);
        if (!station) throw new Error(`Không tìm thấy trạm ${stationId}`);

        const lookupResult = await this.lookup(stationId, clean);
        if (!lookupResult.assignable || !lookupResult.userId) {
          if (lookupResult.status === 'NOT_FOUND') {
            throw new Error('Tài khoản chưa tồn tại. Vui lòng yêu cầu nhân viên đăng ký tài khoản trước.');
          }
          if (lookupResult.status === 'SELF_ASSIGNMENT') {
            throw new Error('Bạn là chủ sở hữu trạm, không thể tự phân công làm nhân viên.');
          }
          if (lookupResult.status === 'ALREADY_ASSIGNED') {
            throw new Error('Nhân viên này hiện đang có nhiệm vụ tại một trạm khác hoặc chính trạm này.');
          }
          if (lookupResult.status === 'ROLE_NOT_ALLOWED') {
            throw new Error('Tài khoản có vai trò Quản trị hoặc Chủ trạm, không thể gán làm nhân viên trạm.');
          }
          if (lookupResult.status === 'ACCOUNT_INACTIVE') {
            throw new Error('Tài khoản này đang bị khóa hoặc tạm dừng hoạt động.');
          }
          throw new Error('Không thể phân công tài khoản này.');
        }

        const member: StationStaffMember = {
          assignmentId: 'ASG-' + seq++,
          stationId,
          stationName: station.name,
          userId: lookupResult.userId,
          displayName: lookupResult.displayName || clean,
          name: lookupResult.displayName || clean,
          email: lookupResult.email || clean,
          maskedPhone: lookupResult.maskedPhone || '098****000',
          status: 'ACTIVE',
          note: note?.trim() || undefined,
          assignedBy: 'U-2038',
          assignedAt: new Date().toISOString(),
          primaryRole: 'DRIVER',
          createdAt: new Date().toISOString().slice(0, 10),
        };

        db.stationStaff.unshift(member);
        return member;
      },

      async revoke(stationId: string, assignmentId: string) {
        await delay();
        const i = db.stationStaff.findIndex((s) => s.assignmentId === assignmentId && (!stationId || s.stationId === stationId));
        if (i < 0) throw new Error('Không tìm thấy phân công này');

        // Mark as REVOKED per lifecycle
        db.stationStaff[i].status = 'REVOKED';
        db.stationStaff[i].revokedAt = new Date().toISOString();
        db.stationStaff[i].revokedBy = 'U-2038';
        return db.stationStaff[i];
      },
    },

    pricing: {
      async get(stationId) {
        await delay();
        const base = structuredClone(db.pricingByStation[stationId] ?? db.pricing);
        if (!base.scheduleEffectiveFrom) {
          base.scheduleEffectiveFrom = '2026-08-15T08:00:00Z';
          base.scheduleStatus = 'ACTIVE';
        }
        return base;
      },
      async save(stationId, config) {
        await delay();
        const now = new Date().toISOString();
        const updated = {
          ...structuredClone(config),
          scheduleEffectiveFrom: now,
          scheduleStatus: 'ACTIVE',
        };
        db.pricingByStation[stationId] = updated;
        return structuredClone(updated);
      },
      async history(stationId) {
        await delay();
        const current = db.pricingByStation[stationId] ?? db.pricing;
        const currentFrom = current.scheduleEffectiveFrom || '2026-08-15T08:00:00Z';
        return [
          {
            scheduleId: `sched-${stationId}-1`,
            effectiveFrom: currentFrom,
            effectiveTo: null,
            status: 'ACTIVE',
            open24Hours: Boolean(current.open24Hours),
            hours: current.hours,
            changedByName: 'Nguyễn Văn Chủ Trạm',
            changedAt: currentFrom,
          },
          {
            scheduleId: `sched-${stationId}-0`,
            effectiveFrom: '2026-07-01T00:00:00Z',
            effectiveTo: currentFrom,
            status: 'EXPIRED',
            open24Hours: false,
            hours: current.hours,
            changedByName: 'Hệ thống khởi tạo',
            changedAt: '2026-07-01T00:00:00Z',
          },
        ];
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

    challenge: {
      async create(connectorId: string) {
        await delay(120);
        const token =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : 'chk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        return {
          challengeToken: token,
          expiresInSeconds: 60,
          connectorId,
          createdAt: new Date().toISOString(),
        };
      },
    },

    media: {
      async getImageKitAuth() {
        await delay();
        return {
          token: `mock-token-${Date.now()}`,
          expire: Math.floor(Date.now() / 1000) + 1800,
          signature: 'mock-sig-' + Math.random().toString(36).substring(2),
          publicKey: 'mock_public_key',
          urlEndpoint: 'https://ik.imagekit.io/chargeops',
        };
      },
    },
  };
}

export type { Booking };
