import { useTranslation } from 'react-i18next';

export const CONNECTOR_TYPES = ['CCS2', 'CHADEMO', 'TYPE2', 'GBT'] as const;

export function useConnectorTypeOptions() {
  const { t } = useTranslation('admin');
  return CONNECTOR_TYPES.map((value) => ({
    value,
    label: t(`provisioning.connectorTypes.${value}`),
  }));
}

export const POWERS = [11, 22, 50, 60, 120, 150, 180, 240, 360].map((p) => ({
  value: String(p),
  label: `${p} kW`,
}));
