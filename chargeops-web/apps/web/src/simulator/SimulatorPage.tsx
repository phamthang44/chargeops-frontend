import React, { useEffect, useMemo, useRef, useState } from 'react';
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

  // 1. Initial Load of Stations and Connectors
  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        addLog('Đang khởi tạo Charger Simulator...', 'info');
        const stList = await services.stations.all().catch(() => []);
        if (!active) return;
        setStations(stList);

        const initialStationId =
          searchParams.get('stationId') || (stList.length > 0 ? stList[0].id : 'ST-01');
        setSelectedStationId(initialStationId);

        // Fetch connectors
        const connList = await services.connectors.list().catch(() => []);
        if (!active) return;
        setConnectors(connList);

        const targetConnectorId =
          searchParams.get('connectorId') ||
          (connList.length > 0 ? connList[0].id : 'CCS2-01');
        setSelectedConnectorId(targetConnectorId);

        addLog(`Đã tải ${stList.length} trạm và ${connList.length} súng sạc.`, 'success');
      } catch {
        // Fallback default connectors
        const mockConns: Connector[] = [
          {
            id: 'CCS2-01',
            chargePointId: 'CP-01',
            connectorCode: 'C-01',
            name: 'Súng DC 1 (CCS2)',
            connectorType: 'CCS2',
            powerKw: 120,
            runtimeStatus: 'AVAILABLE',
            utilizationPct: 65,
            sessionsToday: 12,
            uptime30dPct: 99.8,
            kwhToday: 240,
            faultCount: 0,
            lastSeen: new Date().toISOString(),
          },
          {
            id: 'CCS2-02',
            chargePointId: 'CP-01',
            connectorCode: 'C-02',
            name: 'Súng DC 2 (CCS2)',
            connectorType: 'CCS2',
            powerKw: 120,
            runtimeStatus: 'AVAILABLE',
            utilizationPct: 45,
            sessionsToday: 8,
            uptime30dPct: 99.5,
            kwhToday: 180,
            faultCount: 0,
            lastSeen: new Date().toISOString(),
          },
          {
            id: 'Type2-01',
            chargePointId: 'CP-02',
            connectorCode: 'C-01',
            name: 'Súng AC 1 (Type 2)',
            connectorType: 'TYPE2',
            powerKw: 22,
            runtimeStatus: 'AVAILABLE',
            utilizationPct: 30,
            sessionsToday: 5,
            uptime30dPct: 100,
            kwhToday: 60,
            faultCount: 0,
            lastSeen: new Date().toISOString(),
          },
        ];
        if (active) {
          setConnectors(mockConns);
          setSelectedConnectorId('CCS2-01');
        }
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  // 2. Fetch Challenge Token
  const fetchChallenge = async (connId: string) => {
    if (!connId) return;
    setLoadingToken(true);
    try {
      addLog(`[API] POST /internal/connectors/${connId}/check-in-challenge...`, 'info');
      const res = await services.challenge.create(connId);
      setChallengeToken(res.challengeToken);
      setRemainingSeconds(res.expiresInSeconds || 60);
      addLog(
        `[Challenge] Nhận token thành công: ${res.challengeToken.slice(0, 16)}... (TTL ${res.expiresInSeconds}s)`,
        'success',
      );
    } catch {
      // Fallback in case of network issue
      const fallbackToken = 'chk_' + Math.random().toString(36).substring(2, 12);
      setChallengeToken(fallbackToken);
      setRemainingSeconds(60);
      addLog(`[Fallback] Tạo token cục bộ: ${fallbackToken}`, 'warn');
    } finally {
      setLoadingToken(false);
    }
  };

  // On selected connector change -> fetch fresh challenge
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
    setSearchParams({ stationId: stId, connectorId: selectedConnectorId, mode: viewMode });
  };

  const handleSelectConnector = (cId: string) => {
    setSelectedConnectorId(cId);
    setSearchParams({ stationId: selectedStationId, connectorId: cId, mode: viewMode });
    addLog(`Đã chuyển súng sạc sang ${cId}`, 'info');
  };

  const handleToggleViewMode = (mode: 'split' | 'kiosk') => {
    setViewMode(mode);
    setSearchParams({ stationId: selectedStationId, connectorId: selectedConnectorId, mode });
  };

  const handleSimulateDriverScan = () => {
    addLog(`[Driver App] Tài xế quét mã QR token: ${challengeToken?.slice(0, 16)}...`, 'info');
    addLog('[Backend] Xác thực Driver Booking thành công -> Booking status: CHECKED_IN', 'success');
    setScreenState('CHECKED_IN');
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
            title="Quay lại"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-sm text-white tracking-tight">
              ChargeOps Physical Charger Simulator
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
              🛠️ Sandbox Mode
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
              🖥️ Fullscreen Kiosk
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
            addLog(`Trạng thái màn hình chuyển sang: ${st}`, 'info');
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
              addLog(`Trạng thái màn hình chuyển sang: ${st}`, 'info');
            }}
            logs={logs}
            onClearLogs={() => setLogs([])}
            onSimulateDriverScan={handleSimulateDriverScan}
          />
        )}
      </div>

    </div>
  );
}
