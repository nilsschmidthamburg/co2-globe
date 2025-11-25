import React from 'react';
import { Card } from './ui/card';
import { calculateTrend } from '@/lib/regression';
import { translateRegionName } from '@/lib/country-translations';

interface TooltipProps {
  x: number;
  y: number;
  data: any;
  visible: boolean;
  dataMode: 'absolute' | 'perCapita';
}

export function Tooltip({ x, y, data, visible, dataMode }: TooltipProps) {
  if (!visible || !data) return null;

  // Display region name in continent mode, country name in country mode
  const displayName = data.isRegion ? translateRegionName(data.region) : data.country;

  // Calculate trend using linear regression over last 4 years
  const trendResult = data.historicalYears && data.historicalValues
    ? calculateTrend(data.historicalYears, data.historicalValues)
    : null;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: x + 20,
        top: y - 20,
      }}
    >
      <Card className="bg-slate-900/95 border-slate-700 text-slate-100 p-3 shadow-xl backdrop-blur w-64">
        <h3 className="font-bold text-lg mb-1 border-b border-slate-700 pb-1">{displayName}</h3>

        {data.missing ? (
          <div className="text-sm text-slate-400 italic">Keine Daten verfügbar</div>
        ) : (
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400 uppercase font-semibold">Emissionen</span>
              <span className="text-xl font-mono font-bold text-white">
                {dataMode === 'absolute'
                  ? data.absolute < 1
                    ? '< 1 Gt'
                    : `${Math.round(data.absolute).toLocaleString('de-DE')} Gt`
                  : data.perCapita < 1
                    ? '< 1 t'
                    : `${Math.round(data.perCapita).toLocaleString('de-DE')} t`}
              </span>
            </div>

            {trendResult && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">
                  Trend (4J-Regression)
                  {trendResult.confidence === 'low' && ' ⚠️'}
                </span>
                <span
                  className={
                    trendResult.trend === 'steigend'
                      ? 'text-red-400'
                      : trendResult.trend === 'sinkend'
                        ? 'text-green-400'
                        : 'text-yellow-400'
                  }
                >
                  {trendResult.trend === 'steigend' && '↗ Steigend'}
                  {trendResult.trend === 'sinkend' && '↘ Sinkend'}
                  {trendResult.trend === 'stabil' && '→ Stabil'}
                </span>
              </div>
            )}

            {data.uncertainty && (
              <div className="text-[10px] text-yellow-500/80 flex items-center gap-1 mt-1 pt-1 border-t border-slate-800">
                ⚠️ Unsichere Datenlage
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
