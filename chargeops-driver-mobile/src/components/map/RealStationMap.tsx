import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Station } from '@/types';

// Conditionally import WebView on native to prevent bundling issues on web
let NativeWebView: any = null;
if (Platform.OS !== 'web') {
  try {
    NativeWebView = require('react-native-webview').WebView;
  } catch {
    NativeWebView = null;
  }
}

export interface RealStationMapProps {
  stations: Station[];
  selectedStationId?: string | null;
  onSelectStation?: (station: Station) => void;
  userCoords?: { latitude: number; longitude: number } | null;
  isDark?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface RealStationMapRef {
  recenterToUser: () => void;
  flyToStation: (station: Station) => void;
  navigateToStation: (station: Station) => void;
}

/**
 * Generates self-contained Leaflet HTML with CartoDB Voyager (Light) & Dark Matter (Dark) tiles.
 * Handles SVG EV pins, status indicators, user radar pulse, and bidirectional bridge.
 */
function buildLeafletHtml(
  stations: Station[],
  selectedStationId: string | null | undefined,
  userCoords: { latitude: number; longitude: number } | null | undefined,
  isDark: boolean,
): string {
  // Find initial focus
  const selectedStation = stations.find((s) => s.id === selectedStationId);
  const initialLat = selectedStation?.latitude ?? userCoords?.latitude ?? 10.7721;
  const initialLng = selectedStation?.longitude ?? userCoords?.longitude ?? 106.6982;
  const initialZoom = selectedStation ? 15 : 13;

  const serializedStations = JSON.stringify(
    stations.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      latitude: s.latitude,
      longitude: s.longitude,
      availableConnectors: s.availableConnectors ?? 0,
      totalConnectors: s.totalConnectors ?? 0,
      isOpen: s.isOpen !== false,
      maxPowerKw: s.maxPowerKw,
    })),
  );

  const osmTileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: ${isDark ? '#111514' : '#F8FAFC'};
      overflow: hidden;
      -webkit-user-select: none;
      user-select: none;
    }
    .dark-map .leaflet-tile-pane {
      filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
    }
    .leaflet-control-attribution,
    .leaflet-control-container .leaflet-bottom,
    .leaflet-control-container .leaflet-control-attribution {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      height: 0 !important;
      pointer-events: none !important;
    }
    .leaflet-control-zoom {
      display: none !important; /* Mobile EV app style: clean view without bulky zoom buttons */
    }

    /* Custom EV Station Pin */
    .ev-marker-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transform: translate(-50%, -100%);
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .ev-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 9px;
      border-radius: 999px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11.5px;
      font-weight: 700;
      color: #FFFFFF;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
      border: 2px solid #FFFFFF;
      white-space: nowrap;
    }
    .ev-pill.available { background: #10B981; }
    .ev-pill.busy { background: #F59E0B; }
    .ev-pill.full { background: #EF4444; }
    .ev-pill.closed { background: #64748B; }
    .ev-pill.paused { background: #E11D48; }
    .ev-pill.maintenance { background: #D97706; }
    .ev-pill.no_schedule { background: #94A3B8; }

    .ev-arrow {
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid;
      margin-top: -1px;
    }
    .ev-arrow.available { border-top-color: #10B981; }
    .ev-arrow.busy { border-top-color: #F59E0B; }
    .ev-arrow.full { border-top-color: #EF4444; }
    .ev-arrow.closed { border-top-color: #64748B; }
    .ev-arrow.paused { border-top-color: #E11D48; }
    .ev-arrow.maintenance { border-top-color: #D97706; }
    .ev-arrow.no_schedule { border-top-color: #94A3B8; }

    .ev-marker-wrap.selected {
      transform: translate(-50%, -100%) scale(1.18);
      z-index: 99999 !important;
    }
    .ev-marker-wrap.selected .ev-pill {
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.45), 0 8px 20px rgba(0, 0, 0, 0.4);
      border-color: #FFFFFF;
    }

    /* Driver GPS Radar Marker */
    .user-radar-wrap {
      width: 28px;
      height: 28px;
      position: relative;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .user-radar-ring {
      position: absolute;
      top: -8px;
      left: -8px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.28);
      animation: radar-pulse 2.2s infinite ease-out;
    }
    .user-core-dot {
      position: absolute;
      top: 5px;
      left: 5px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #10B981;
      border: 3px solid #FFFFFF;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
    }
    @keyframes radar-pulse {
      0% { transform: scale(0.6); opacity: 1; }
      80%, 100% { transform: scale(1.9); opacity: 0; }
    }
  </style>
</head>
<body class="${isDark ? 'dark-map' : ''}">
  <div id="map"></div>
  <script>
    var stations = ${serializedStations};
    var selectedId = ${JSON.stringify(selectedStationId ?? null)};
    var userCoords = ${JSON.stringify(userCoords ?? null)};
    var isDark = ${isDark ? 'true' : 'false'};

    // Initialize Map
    var map = L.map('map', {
      center: [${initialLat}, ${initialLng}],
      zoom: ${initialZoom},
      zoomControl: false,
      attributionControl: false
    });

    var tileLayer = L.tileLayer('${osmTileUrl}', {
      maxZoom: 19
    }).addTo(map);

    function sendToHost(type, payload) {
      var msg = JSON.stringify(Object.assign({ type: type }, payload || {}));
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      } else if (window.parent && window.parent.postMessage) {
        window.parent.postMessage(msg, '*');
      }
    }

    var markerMap = {};
    var userMarker = null;
    var routeLine = null;

    function getPinStatus(s) {
      if (s.operatingState === 'PAUSED_BY_OWNER') return 'paused';
      if (s.operatingState === 'MAINTENANCE') return 'maintenance';
      if (s.operatingState === 'SCHEDULE_NOT_CONFIGURED' || s.operatingState === 'UNAVAILABLE_BY_PLATFORM') return 'no_schedule';
      if (!s.isOpen || s.operatingState === 'CLOSED_BY_SCHEDULE') return 'closed';
      if (s.availableConnectors <= 0) return 'full';
      if (s.availableConnectors <= 1) return 'busy';
      return 'available';
    }

    function createPinHtml(s, isSelected) {
      var status = getPinStatus(s);
      var selClass = isSelected ? ' selected' : '';
      var boltSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';
      var iconSvg = boltSvg;
      var label = s.availableConnectors + '/' + s.totalConnectors;

      if (status === 'paused') {
        label = 'Tạm dừng';
        iconSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line></svg>';
      } else if (status === 'maintenance') {
        label = 'Bảo trì';
        iconSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>';
      }

      return '<div class="ev-marker-wrap' + selClass + '" id="pin-' + s.id + '">' +
        '<div class="ev-pill ' + status + '">' + iconSvg + '<span>' + label + '</span></div>' +
        '<div class="ev-arrow ' + status + '"></div>' +
      '</div>';
    }

    function renderStations() {
      // Clear existing
      Object.keys(markerMap).forEach(function(id) {
        map.removeLayer(markerMap[id]);
      });
      markerMap = {};

      stations.forEach(function(s) {
        if (!s.latitude || !s.longitude) return;
        var isSelected = s.id === selectedId;
        var icon = L.divIcon({
          className: '',
          html: createPinHtml(s, isSelected),
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        var m = L.marker([s.latitude, s.longitude], { icon: icon }).addTo(map);
        m.on('click', function(e) {
          L.DomEvent.stopPropagation(e);
          selectStation(s.id, true);
        });

        markerMap[s.id] = m;
      });
    }

    function renderUserLocation() {
      if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
      }
      if (!userCoords || !userCoords.latitude || !userCoords.longitude) return;

      var userIcon = L.divIcon({
        className: '',
        html: '<div class="user-radar-wrap"><div class="user-radar-ring"></div><div class="user-core-dot"></div></div>',
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      userMarker = L.marker([userCoords.latitude, userCoords.longitude], {
        icon: userIcon,
        zIndexOffset: 10000
      }).addTo(map);
    }

    function selectStation(stationId, notifyHost) {
      if (selectedId && markerMap[selectedId]) {
        var prevStation = stations.find(function(s) { return s.id === selectedId; });
        if (prevStation) {
          markerMap[selectedId].setIcon(L.divIcon({
            className: '',
            html: createPinHtml(prevStation, false),
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          }));
        }
      }

      selectedId = stationId;
      var curStation = stations.find(function(s) { return s.id === stationId; });
      if (curStation && markerMap[stationId]) {
        markerMap[stationId].setIcon(L.divIcon({
          className: '',
          html: createPinHtml(curStation, true),
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        }));
        map.flyTo([curStation.latitude, curStation.longitude], Math.max(map.getZoom(), 15), {
          duration: 1.0,
          easeLinearity: 0.25
        });
      }

      if (notifyHost) {
        sendToHost('SELECT_STATION', { stationId: stationId });
      }
    }

    renderStations();
    renderUserLocation();

    // Listen for messages from React Native / Parent Window
    function handleIncomingMessage(event) {
      try {
        var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data || !data.type) return;

        if (data.type === 'SELECT_STATION') {
          selectStation(data.stationId, false);
        } else if (data.type === 'NAVIGATE_TO_STATION') {
          if (data.stationId) {
            selectStation(data.stationId, false);
          }
          if (data.latitude && data.longitude) {
            if (routeLine) {
              map.removeLayer(routeLine);
              routeLine = null;
            }
            if (userCoords && userCoords.latitude && userCoords.longitude) {
              routeLine = L.polyline(
                [
                  [userCoords.latitude, userCoords.longitude],
                  [data.latitude, data.longitude]
                ],
                {
                  color: '#10B981',
                  weight: 4,
                  dashArray: '8, 8',
                  opacity: 0.9
                }
              ).addTo(map);

              var bounds = L.latLngBounds(
                [userCoords.latitude, userCoords.longitude],
                [data.latitude, data.longitude]
              );
              map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
            } else {
              map.flyTo([data.latitude, data.longitude], 16, { duration: 1.2 });
            }
          }
        } else if (data.type === 'FLY_TO_USER') {
          if (userCoords && userCoords.latitude) {
            map.flyTo([userCoords.latitude, userCoords.longitude], 15, { duration: 1.2 });
          }
        } else if (data.type === 'UPDATE_USER_COORDS') {
          userCoords = data.coords;
          renderUserLocation();
        } else if (data.type === 'UPDATE_STATIONS') {
          stations = data.stations || [];
          renderStations();
        } else if (data.type === 'SET_THEME') {
          isDark = !!data.isDark;
          if (isDark) {
            document.body.classList.add('dark-map');
          } else {
            document.body.classList.remove('dark-map');
          }
          document.body.style.background = isDark ? '#111514' : '#F8FAFC';
        }
      } catch (err) {}
    }

    window.addEventListener('message', handleIncomingMessage);
    document.addEventListener('message', handleIncomingMessage);
  </script>
</body>
</html>`;
}

export const RealStationMap = forwardRef<RealStationMapRef, RealStationMapProps>(
  function RealStationMap(
    {
      stations,
      selectedStationId,
      onSelectStation,
      userCoords,
      isDark = false,
      style,
    },
    ref,
  ) {
    const webViewRef = useRef<any>(null);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    const htmlContent = useMemo(
      () => buildLeafletHtml(stations, selectedStationId, userCoords, isDark),
      // We only recreate HTML on full initial mount or drastic change, other updates happen via messages
      [isDark],
    );

    // Send updates through postMessage when selection or stations change
    const postToMap = (data: any) => {
      const msg = JSON.stringify(data);
      if (Platform.OS === 'web') {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(msg, '*');
        }
      } else {
        if (webViewRef.current?.injectJavaScript) {
          webViewRef.current.injectJavaScript(
            `window.handleIncomingMessage({ data: ${JSON.stringify(msg)} }); true;`,
          );
        }
      }
    };

    useImperativeHandle(ref, () => ({
      recenterToUser: () => {
        postToMap({ type: 'FLY_TO_USER' });
      },
      flyToStation: (station: Station) => {
        postToMap({ type: 'SELECT_STATION', stationId: station.id });
      },
      navigateToStation: (station: Station) => {
        postToMap({
          type: 'NAVIGATE_TO_STATION',
          stationId: station.id,
          latitude: station.latitude,
          longitude: station.longitude,
        });
      },
    }));

    // Sync selected station
    useEffect(() => {
      if (selectedStationId) {
        postToMap({ type: 'SELECT_STATION', stationId: selectedStationId });
      }
    }, [selectedStationId]);

    // Sync user location updates
    useEffect(() => {
      if (userCoords) {
        postToMap({ type: 'UPDATE_USER_COORDS', coords: userCoords });
      }
    }, [userCoords]);

    // Sync stations updates
    useEffect(() => {
      if (stations && stations.length > 0) {
        postToMap({ type: 'UPDATE_STATIONS', stations });
      }
    }, [stations]);

    // Sync theme
    useEffect(() => {
      postToMap({ type: 'SET_THEME', isDark });
    }, [isDark]);

    // Handle messages from the map (e.g. user tapped a station pin)
    const handleMapMessage = (event: any) => {
      try {
        const rawData =
          Platform.OS === 'web'
            ? event.data
            : event.nativeEvent?.data;
        const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        if (data?.type === 'SELECT_STATION' && data.stationId) {
          const found = stations.find((s) => s.id === data.stationId);
          if (found && onSelectStation) {
            onSelectStation(found);
          }
        }
      } catch {
        // ignore parse error
      }
    };

    useEffect(() => {
      if (Platform.OS === 'web') {
        window.addEventListener('message', handleMapMessage);
        return () => window.removeEventListener('message', handleMapMessage);
      }
    }, [stations, onSelectStation]);

    if (Platform.OS === 'web') {
      return (
        <View style={[styles.container, style]}>
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block', margin: 0, padding: 0 } as any}
            title="ChargeOps Interactive Map"
          />
        </View>
      );
    }

    if (!NativeWebView) {
      return <View style={[styles.container, style]} />;
    }

    return (
      <View style={[styles.container, style]}>
        <NativeWebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          onMessage={handleMapMessage}
          style={styles.nativeWebview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          bounces={false}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  webIframe: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  nativeWebview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
