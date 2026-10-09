import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createServices, type Connector, type Station } from '@chargeops/api';
import { useAuth } from '@chargeops/auth';
import {
  PhysicalKioskScreen,
  type SimulatorScreenState,
} from './components/PhysicalKioskScreen';
import {
  SimulatorControlPanel,
  type SimulatorLogItem,
} from './components/SimulatorControlPanel';

export function SimulatorPage() {
  const { t } = useTranslation('simulator');
  const [searchParams, setSearchParams] = useSearchParams();
  const routeParams = useParams<{ connectorId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // Mode: kiosk only or split screen with control panel
  const [viewMode, setViewMode] = useState<'split' | 'kiosk'>(() => {
    return (searchParams.get('mode') as 'split' | 'kiosk') || 'split';
  });

  // Services client (fallback-safe for standalone simulator)
  const services = useMemo(() => createServices({ ownerView: false, getToken }), [getToken]);

  // Station and Connector data
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>(
    searchParams.get('stationId') || '',
  );
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string>(
    routeParams.connectorId || searchParams.get('connectorId') || '',
  );

  // Dynamic Challenge State
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(60);
  const [loadingToken, setLoadingToken] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Screen operational state
  const [screenState, setScreenState] = useState<SimulatorScreenState>('AVAILABLE');

  // Logs
  const [logs, setLogs] = useState<SimulatorLogItem[]>([]);
  const addLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const item: SimulatorLogItem = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString('vi-VN'),
      type,
      message,
    };
    setLogs((prev) => [item, ...prev.slice(0, 49)]);
  };

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1';

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

const FALLBACK_MOCK_STATIONS: Station[] = [
  {
    id: 'mock-st-01',
    stationCode: 'HN-01',
    name: 'Trạm Sạc Mô Phỏng ChargeOps',
    status: 'ACTIVE',
    chargerCount: 2,
    onlineCount: 2,
    address: 'Khu Công nghệ cao Hòa Lạc, Hà Nội',
  } as Station,
];

const FALLBACK_MOCK_CONNECTORS: Connector[] = [
  {
    id: 'mock-conn-01',
    chargePointId: 'mock-cp-01',
    connectorCode: 'C-01',
    name: 'Trụ DC-01 · Súng C-01 (CCS2)',
    connectorType: 'CCS2',
    powerKw: 120,
    runtimeStatus: 'AVAILABLE',
    utilizationPct: 0,
    sessionsToday: 0,
    uptime30dPct: 100,
    kwhToday: 0,
    faultCount: 0,
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'mock-conn-02',
    chargePointId: 'mock-cp-01',
    connectorCode: 'C-02',
    name: 'Trụ DC-01 · Súng C-02 (Type 2)',
    connectorType: 'TYPE2',
    powerKw: 22,
    runtimeStatus: 'AVAILABLE',
    utilizationPct: 0,
    sessionsToday: 0,
    uptime30dPct: 100,
    kwhToday: 0,
    faultCount: 0,
    lastSeen: new Date().toISOString(),
  },
];

  // Helper gọi fetch tự động kèm Bearer Token từ Keycloak session
  const authFetch = async (path: string, init: RequestInit = {}) => {
    let token: string | null = null;
    try {
      token = await getToken();
    } catch {
      // ignore
    }
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((init.headers as Record<string, string>) || {}),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    });
  };

  // 1. Initial Load of Stations (thuần túy gọi Public Discovery API GET /stations)
  useEffect(() => {
    let active = true;
    async function loadStations() {
      try {
        addLog(t('logs.connectingDiscovery', 'Đang kết nối lấy danh sách trạm qua Discovery API...'), 'info');

        let stList: Station[] = [];
        try {
          const discRes = await authFetch('/stations?page=1&size=50');
          if (discRes.ok) {
            const json = await discRes.json();
            const items = json?.data?.items || json?.data || [];
            if (Array.isArray(items) && items.length > 0) {
              stList = items.map((it: any) => ({
                id: it.id,
                stationCode: it.stationCode,
                name: it.name,
                status: it.status || 'ACTIVE',
                address: it.address,
                chargerCount: it.totalConnectors || 0,
                onlineCount: it.availableConnectors || 0,
              } as Station));
            }
          } else if (discRes.status === 401) {
            addLog(t('logs.unauthorized401', 'API /stations trả về 401: Token chưa sẵn sàng hoặc phiên hết hạn.'), 'warn');
          }
        } catch {
          // Bỏ qua lỗi mạng
        }

        // Nếu backend chưa có trạm hoặc đang offline, dùng dữ liệu mô phỏng cục bộ
        // Tuyệt đối KHÔNG gọi API quản trị /admin/stations
        if (stList.length === 0) {
          stList = FALLBACK_MOCK_STATIONS;
        }

        if (!active) return;
        setStations(stList);

        if (stList.length > 0) {
          const urlStationId = searchParams.get('stationId');
          const matchedStation = stList.find((s) => s.id === urlStationId);
          const initialStationId = matchedStation ? matchedStation.id : stList[0].id;
          setSelectedStationId(initialStationId);
          addLog(t('logs.loadedStations', { count: stList.length, defaultValue: `Đã tải ${stList.length} trạm sạc từ API hệ thống.` }), 'success');
        } else {
          addLog(t('logs.noStations', 'Không tìm thấy trạm sạc nào trong hệ thống.'), 'warn');
        }
      } catch (err) {
        addLog(t('logs.errorLoadingStations', { message: (err as Error).message, defaultValue: 'Không thể tải danh sách trạm: ' + (err as Error).message }), 'error');
      }
    }

    loadStations();
    return () => {
      active = false;
    };
  }, [getToken]);

  // 2. Load connectors thật qua Public Station Detail API: GET /stations/{stationId}
  useEffect(() => {
    if (!selectedStationId) return;
    let active = true;

    async function loadConnectors() {
      try {
        addLog(t('logs.loadingConnectors', { id: selectedStationId, defaultValue: `Đang tải súng sạc qua API /stations/${selectedStationId}...` }), 'info');
        let conns: Connector[] = [];

        // Thử lấy chi tiết trạm từ API discovery: GET /stations/{selectedStationId}
        if (isUUID(selectedStationId)) {
          try {
            const res = await authFetch(`/stations/${selectedStationId}`);
            if (res.ok) {
              const json = await res.json();
              const detail = json?.data || json;
              if (detail?.chargePoints && Array.isArray(detail.chargePoints)) {
                for (const cp of detail.chargePoints) {
                  if (cp.connectors && Array.isArray(cp.connectors)) {
                    for (const c of cp.connectors) {
                      conns.push({
                        id: c.id,
                        chargePointId: cp.id,
                        chargePointCode: cp.chargePointCode,
                        chargePointName: cp.name || cp.chargePointCode,
                        connectorCode: c.connectorCode,
                        name: `Trụ ${cp.chargePointCode || cp.name} · Cổng ${c.connectorCode} (${c.connectorType || 'CCS2'})`,
                        connectorType: c.connectorType || 'CCS2',
                        powerKw: Number(c.powerKw || cp.maxPowerKw) || 0,
                        runtimeStatus: c.runtimeStatus || 'AVAILABLE',
                        utilizationPct: 0,
                        sessionsToday: 0,
                        uptime30dPct: 100,
                        kwhToday: 0,
                        faultCount: 0,
                        lastSeen: new Date().toISOString(),
                      });
                    }
                  }
                }
              }
            } else if (res.status === 401) {
              addLog(t('logs.unauthorizedStation401', { id: selectedStationId, defaultValue: `API /stations/${selectedStationId} trả về 401 Unauthorized.` }), 'warn');
            }
          } catch {
            // fallback
          }
        }

        // Tuyệt đối KHÔNG gọi API /owner hay /admin
        // Nếu trạm không có cổng hoặc trạm mock, fallback sang danh sách mock cục bộ
        if (conns.length === 0) {
          conns = FALLBACK_MOCK_CONNECTORS;
        }

        if (!active) return;
        setConnectors(conns);

        if (conns.length > 0) {
          const urlConnId = routeParams.connectorId || searchParams.get('connectorId');
          const matched = conns.find((c) => c.id === urlConnId || c.connectorCode === urlConnId);
          const nextConnId = matched ? matched.id : conns[0].id;
          setSelectedConnectorId(nextConnId);
          addLog(t('logs.loadedConnectors', { count: conns.length, name: matched?.name || conns[0].name, defaultValue: `Đã nạp ${conns.length} súng sạc. Đang chọn: ${matched?.name || conns[0].name}` }), 'success');
        } else {
          setSelectedConnectorId('');
          addLog(t('logs.noConnectors', 'Trạm này chưa có cổng sạc nào được cấu hình.'), 'warn');
        }
      } catch (err) {
        addLog(t('logs.errorLoadingConnectors', { message: (err as Error).message, defaultValue: 'Lỗi tải danh sách súng sạc: ' + (err as Error).message }), 'error');
      }
    }

    loadConnectors();
    return () => {
      active = false;
    };
  }, [selectedStationId]);

  // 3. Fetch Challenge Token từ Backend
  const fetchChallenge = async (connId: string) => {
    if (!connId) return;
    setLoadingToken(true);

    // Kiểm tra định dạng UUID: tránh gửi ID giả như CCS2-01 gây lỗi crash Spring Boot
    if (!isUUID(connId)) {
      addLog(t('logs.invalidUuidWarn', { id: connId, defaultValue: `[Bỏ qua] Mã "${connId}" không phải UUID cổng sạc hợp lệ. Dùng token mô phỏng...` }), 'warn');
      const fallbackToken = 'chk_' + Math.random().toString(36).substring(2, 12);
      setChallengeToken(fallbackToken);
      setRemainingSeconds(60);
      setLoadingToken(false);
      return;
    }

    try {
      addLog(t('logs.fetchingChallenge', { id: connId, defaultValue: `[API] POST /internal/connectors/${connId}/check-in-challenge...` }), 'info');
      const res = await authFetch(`/internal/connectors/${connId}/check-in-challenge`, {
        method: 'POST',
      });
      if (res.ok) {
        const json = await res.json();
        const data = json?.data || json;
        if (data?.challengeToken) {
          setChallengeToken(data.challengeToken);
          setRemainingSeconds(data.expiresInSeconds || 60);
          addLog(
            t('logs.challengeReceived', { token: data.challengeToken.slice(0, 16), ttl: data.expiresInSeconds || 60, defaultValue: `[Challenge] Nhận token thành công từ Backend Redis: ${data.challengeToken.slice(0, 16)}... (TTL ${data.expiresInSeconds || 60}s)` }),
            'success',
          );
          return;
        }
      }

      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.error?.message || errJson?.message || `HTTP ${res.status}`;
      throw new Error(errMsg);
    } catch (err) {
      const msg = (err as Error)?.message || 'Không thể tạo mã challenge';
      addLog(t('logs.challengeError', { message: msg, defaultValue: `[Lỗi Backend] ${msg}. Sử dụng token mô phỏng tạm thời.` }), 'warn');
      const fallbackToken = 'chk_' + Math.random().toString(36).substring(2, 12);
      setChallengeToken(fallbackToken);
      setRemainingSeconds(60);
    } finally {
      setLoadingToken(false);
    }
  };

  // Tự động lấy challenge khi đổi connector
  useEffect(() => {
    if (selectedConnectorId) {
      fetchChallenge(selectedConnectorId);
    }
  }, [selectedConnectorId]);

  // 3. Countdown Ticker
  const autoRefreshRef = useRef(autoRefresh);
  autoRefreshRef.current = autoRefresh;

  const selectedConnIdRef = useRef(selectedConnectorId);
  selectedConnIdRef.current = selectedConnectorId;

  useEffect(() => {
    if (screenState !== 'AVAILABLE') return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (autoRefreshRef.current && selectedConnIdRef.current) {
            addLog('[TTL] Mã QR đã hết hạn (0s). Đang tự động tạo mã mới...', 'warn');
            fetchChallenge(selectedConnIdRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screenState]);

  // Handlers
  const handleSelectStation = (stId: string) => {
    setSelectedStationId(stId);
    setSearchParams({ stationId: stId, mode: viewMode });
  };

  const handleSelectConnector = (cId: string) => {
    setSelectedConnectorId(cId);
    setSearchParams({ stationId: selectedStationId, connectorId: cId, mode: viewMode });
    addLog(t('logs.switchedConnector', { id: cId, defaultValue: `Đã chuyển súng sạc sang ${cId}` }), 'info');
  };

  const handleToggleViewMode = (mode: 'split' | 'kiosk') => {
    setViewMode(mode);
    setSearchParams({ stationId: selectedStationId, connectorId: selectedConnectorId, mode });
  };

  const handleSimulateDriverScan = () => {
    addLog(t('logs.driverScanned', { token: challengeToken?.slice(0, 16) || '', defaultValue: `[Driver App] Tài xế quét mã QR token: ${challengeToken?.slice(0, 16)}...` }), 'info');
    addLog(t('logs.backendVerified', '[Backend] Xác thực Driver Booking thành công -> Booking status: CHECKED_IN'), 'success');
    setScreenState('CHECKED_IN');
  };

  const handleQuickSync = async (rawQuery: string): Promise<{ found: boolean; message: string }> => {
    const q = rawQuery.trim();
    if (!q) return { found: false, message: t('logs.syncInputPrompt', 'Vui lòng nhập mã hoặc UUID cần tìm') };
    const qLower = q.toLowerCase();

    // 1. Khớp ngay trong connectors của trạm hiện tại
    const localMatch = connectors.find((c) => {
      const cId = (c.id || '').toLowerCase();
      const cCode = (c.connectorCode || '').toLowerCase();
      const cpCode = (c.chargePointCode || '').toLowerCase();
      const name = (c.name || '').toLowerCase();
      const combo = `${cpCode} ${cCode}`.toLowerCase();
      const comboDash = `${cpCode}-${cCode}`.toLowerCase();
      return (
        cId === qLower ||
        cCode === qLower ||
        cpCode === qLower ||
        combo === qLower ||
        comboDash === qLower ||
        (qLower.includes(cpCode) && qLower.includes(cCode)) ||
        name.includes(qLower)
      );
    });
    if (localMatch) {
      setSelectedConnectorId(localMatch.id);
      setSearchParams({ stationId: selectedStationId, connectorId: localMatch.id, mode: viewMode });
      addLog(
        t('logs.syncLocalSwitched', { chargePoint: localMatch.chargePointCode || 'N/A', connector: localMatch.connectorCode, defaultValue: `[Đồng bộ] Đã chuyển sang: Trụ ${localMatch.chargePointCode || 'N/A'} · Cổng ${localMatch.connectorCode}` }),
        'success',
      );
      return { found: true, message: `Đã chọn: ${localMatch.name || localMatch.connectorCode}` };
    }

    // 2. Khớp trực tiếp trạm (theo UUID, stationCode, hoặc tên trạm)
    const stMatch = stations.find(
      (s) =>
        s.id.toLowerCase() === qLower ||
        (s.stationCode && s.stationCode.toLowerCase() === qLower) ||
        (s.name && s.name.toLowerCase().includes(qLower)),
    );
    if (stMatch) {
      setSelectedStationId(stMatch.id);
      setSearchParams({ stationId: stMatch.id, mode: viewMode });
      addLog(t('logs.syncStationSwitched', { stationName: stMatch.name, code: stMatch.stationCode || 'N/A', defaultValue: `[Đồng bộ] Đã chuyển sang trạm: ${stMatch.name} (${stMatch.stationCode || 'N/A'})` }), 'success');
      return { found: true, message: `Đã tìm thấy trạm: ${stMatch.name}` };
    }

    // 3. Quét chi tiết tất cả các trạm trong hệ thống để tìm súng sạc
    addLog(t('logs.syncScanning', { query: q, defaultValue: `Đang quét tìm "${q}" qua các trạm trong hệ thống...` }), 'info');
    for (const st of stations) {
      if (st.id === selectedStationId) continue;
      if (!isUUID(st.id)) continue;
      try {
        const res = await authFetch(`/stations/${st.id}`);
        if (res.ok) {
          const json = await res.json();
          const detail = json?.data || json;
          if (detail?.chargePoints && Array.isArray(detail.chargePoints)) {
            for (const cp of detail.chargePoints) {
              if (cp.connectors && Array.isArray(cp.connectors)) {
                for (const c of cp.connectors) {
                  const cId = (c.id || '').toLowerCase();
                  const cCode = (c.connectorCode || '').toLowerCase();
                  const cpCode = (cp.chargePointCode || '').toLowerCase();
                  const name = (c.name || '').toLowerCase();
                  const combo = `${cpCode} ${cCode}`.toLowerCase();
                  const comboDash = `${cpCode}-${cCode}`.toLowerCase();
                  const matched =
                    cId === qLower ||
                    cCode === qLower ||
                    cpCode === qLower ||
                    combo === qLower ||
                    comboDash === qLower ||
                    (qLower.includes(cpCode) && qLower.includes(cCode)) ||
                    name.includes(qLower);

                  if (matched) {
                    setSelectedStationId(st.id);
                    setSelectedConnectorId(c.id);
                    setSearchParams({ stationId: st.id, connectorId: c.id, mode: viewMode });
                    addLog(
                      t('logs.syncFound', { chargePoint: cp.chargePointCode || cp.name, connector: c.connectorCode, stationName: st.name, defaultValue: `[Đồng bộ thành công] Tìm thấy Trụ "${cp.chargePointCode || cp.name}" · Cổng "${c.connectorCode}" thuộc trạm "${st.name}"!` }),
                      'success',
                    );
                    return {
                      found: true,
                      message: `Đã định vị: Trụ ${cp.chargePointCode || cp.name} · Cổng ${c.connectorCode} tại trạm "${st.name}"`,
                    };
                  }
                }
              }
            }
          }
        }
      } catch {
        // bỏ qua lỗi trạm đơn lẻ
      }
    }

    addLog(t('logs.syncNotFound', { query: q, defaultValue: `Không tìm thấy cổng sạc hoặc trạm nào khớp với "${q}".` }), 'warn');
    return { found: false, message: `Không tìm thấy súng sạc hoặc trạm nào khớp với "${q}"` };
  };

  const currentStation = stations.find((s) => s.id === selectedStationId) || stations[0] || null;
  const currentConnector =
    connectors.find((c) => c.id === selectedConnectorId) || connectors[0] || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8 antialiased">
      
      {/* Top Floating Control Toolbar */}
      <div className="mx-auto mb-6 flex max-w-[1020px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-2.5 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-slate-300 hover:bg-white/20 transition-all cursor-pointer"
            title={t('back', 'Quay lại')}
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-sm text-white tracking-tight">
              {t('title', 'ChargeOps Physical Charger Simulator')}
            </span>
          </div>
        </div>

        {/* Right Mode Switchers & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl bg-black/50 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => handleToggleViewMode('split')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('modes.split', '🛠️ Sandbox Mode')}
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('kiosk')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'kiosk'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('modes.kiosk', '🖥️ Fullscreen Kiosk')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto flex max-w-[1020px] flex-col gap-7">
        {/* Physical Kiosk Display Screen */}
        <PhysicalKioskScreen
          station={currentStation}
          connector={currentConnector}
          challengeToken={challengeToken}
          remainingSeconds={remainingSeconds}
          loadingToken={loadingToken}
          onRefreshChallenge={() => fetchChallenge(selectedConnectorId)}
          screenState={screenState}
          onStateChange={(st) => {
            setScreenState(st);
            addLog(t('logs.screenStateChanged', { state: st, defaultValue: `Trạng thái màn hình chuyển sang: ${st}` }), 'info');
          }}
        />

        {/* Sandbox Operator Control Panel (Shown in split view) */}
        {viewMode === 'split' && (
          <SimulatorControlPanel
            stations={stations}
            selectedStationId={selectedStationId}
            onSelectStation={handleSelectStation}
            connectors={connectors}
            selectedConnectorId={selectedConnectorId}
            onSelectConnector={handleSelectConnector}
            challengeToken={challengeToken}
            remainingSeconds={remainingSeconds}
            autoRefresh={autoRefresh}
            onToggleAutoRefresh={setAutoRefresh}
            onRefreshChallenge={() => fetchChallenge(selectedConnectorId)}
            screenState={screenState}
            onStateChange={(st) => {
              setScreenState(st);
              addLog(t('logs.screenStateChanged', { state: st, defaultValue: `Trạng thái màn hình chuyển sang: ${st}` }), 'info');
            }}
            logs={logs}
            onClearLogs={() => setLogs([])}
            onSimulateDriverScan={handleSimulateDriverScan}
            onQuickSync={handleQuickSync}
          />
        )}
      </div>

    </div>
  );
}
