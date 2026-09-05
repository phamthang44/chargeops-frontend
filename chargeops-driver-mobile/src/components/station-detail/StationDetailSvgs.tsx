import React from 'react';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

interface SvgIconProps {
  size?: number;
  color?: string;
}

/**
 * Modern EV Charging Plug (Phích cắm sạc) SVG icon.
 * Replaces generic lightning bolt icon for selecting charging connectors.
 */
export function EvPlugIcon({ size = 20, color = '#059669' }: SvgIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Plug head / prongs */}
      <Rect x="8" y="2" width="2" height="4" rx="1" fill={color} />
      <Rect x="14" y="2" width="2" height="4" rx="1" fill={color} />
      {/* Plug body */}
      <Path
        d="M6 6C6 4.89543 6.89543 4 8 4H16C17.1046 4 18 4.89543 18 6V12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12V6Z"
        fill={color}
        fillOpacity={0.16}
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Plug Grip Ridge lines */}
      <Line x1="9" y1="8.5" x2="15" y2="8.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="9" y1="11.5" x2="15" y2="11.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      {/* Cable cord */}
      <Path
        d="M12 18V22"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Bento Metric 1: Available Ports / Charging Pillar SVG.
 * Replaces lack of icon / emoji with a dedicated charging station vector.
 */
export function PortMetricSvg({ size = 28, color = '#059669' }: SvgIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Soft background glow circle */}
      <Circle cx="16" cy="16" r="14" fill={color} fillOpacity={0.12} />
      {/* Station body */}
      <Rect x="9" y="8" width="11" height="17" rx="2.5" stroke={color} strokeWidth="1.8" fill="#FFFFFF" fillOpacity={0.4} />
      {/* Screen display */}
      <Rect x="11.5" y="11" width="6" height="4" rx="1" fill={color} />
      {/* Charging gun attached */}
      <Path
        d="M20 12H22C23.1046 12 24 12.8954 24 14V19C24 20.1046 23.1046 21 22 21H20"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Station base */}
      <Line x1="7" y1="26" x2="22" y2="26" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Bento Metric 2: Max Power / Charging Speed (kW) SVG.
 * Clean speedometer / power gauge vector.
 */
export function PowerMetricSvg({ size = 28, color = '#0284C7' }: SvgIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Soft background glow circle */}
      <Circle cx="16" cy="16" r="14" fill={color} fillOpacity={0.12} />
      {/* Gauge arc */}
      <Path
        d="M8.5 21C6.9 19 6 16.5 6 14C6 8.5 10.5 4 16 4C21.5 4 26 8.5 26 14C26 16.5 25.1 19 23.5 21"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Gauge center hub */}
      <Circle cx="16" cy="17" r="2.8" fill={color} />
      {/* Gauge needle pointing up-right to high power */}
      <Path
        d="M16 17L21.5 9.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Power ticks */}
      <Line x1="16" y1="6" x2="16" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="9.5" y1="9" x2="11" y2="10.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="22.5" y1="9" x2="21" y2="10.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Bento Metric 3: Minimum Rate / VND Price SVG.
 * Modern currency coin / price tag vector with ₫ symbol.
 */
export function PriceMetricSvg({ size = 28, color = '#D97706' }: SvgIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Soft background glow circle */}
      <Circle cx="16" cy="16" r="14" fill={color} fillOpacity={0.12} />
      {/* Outer Coin Ring */}
      <Circle cx="16" cy="16" r="9.5" stroke={color} strokeWidth="2" />
      {/* Coin inner ring */}
      <Circle cx="16" cy="16" r="7.5" stroke={color} strokeWidth="0.8" strokeDasharray="1.5 1.5" />
      {/* VND 'đ' / Currency mark */}
      <Path
        d="M14 11V21M14 21H18M11.5 14H16.5M14 14C16.2091 14 18 15.3431 18 17C18 18.6569 16.2091 20 14 20"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Refund Policy Shield Icon with Checkmark.
 * Matches the orange shield checkmark in the user reference image.
 */
export function RefundShieldSvg({ size = 28, color = '#EA580C' }: SvgIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Soft rounded shield outline */}
      <Path
        d="M14 3.5L6 6.8V13.6C6 18.5 9.4 23 14 24.5C18.6 23 22 18.5 22 13.6V6.8L14 3.5Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
        fillOpacity={0.08}
      />
      {/* Checkmark inside */}
      <Path
        d="M10.2 13.8L12.7 16.3L17.8 11.2"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
