import React, { useMemo } from 'react';
import { interpolateReds, interpolateBlues } from 'd3-scale-chromatic';
import { CO2Data } from '../lib/co2-data';

interface LegendProps {
  dataMode: 'absolute' | 'perCapita';
  data: CO2Data[];
  year: number;
}

export function Legend({ dataMode, data, year }: LegendProps) {
  const minValue = dataMode === 'absolute' ? 1 : 1;
  const maxValue = useMemo(() => {
    if (dataMode === 'absolute') {
      return 14000;
    } else {
      let max = 0;
      data.forEach(d => {
        const val = d.years[year]?.perCapita || 0;
        if (val > max) max = val;
      });
      return max;
    }
  }, [dataMode, data, year]);

  const formatValue = (val: number) => {
    if (dataMode === 'absolute') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
      return val.toFixed(0);
    } else {
      return val.toFixed(2);
    }
  };

  // Generate gradient stops from D3 color scales
  const gradientStops = useMemo(() => {
    const interpolator = dataMode === 'absolute' ? interpolateReds : interpolateBlues;
    const stops = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      stops.push(`${interpolator(t)} ${t * 100}%`);
    }
    return stops.join(', ');
  }, [dataMode]);

  return (
    <div className="absolute right-0 top-120 z-50 pointer-events-none p-4">
      <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg p-4 border border-slate-700 shadow-2xl min-w-[120px]">
        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
          {dataMode === 'absolute' ? 'GT CO₂' : 'Tonnes/Capita'}
        </div>

        <div className="flex items-stretch gap-4">
          {/* Gradient bar */}
          <div
            className="w-10 h-72 rounded border border-slate-600 flex-shrink-0"
            style={{
              height: '14rem',
              backgroundImage: `linear-gradient(to top, ${gradientStops})`,
            }}
          ></div>

          {/* Value labels */}
          <div className="flex flex-col justify-between h-56 py-2">
            <div className="text-sm text-slate-100 font-mono font-bold whitespace-nowrap">
              {formatValue(maxValue)}
            </div>
            <div className="text-sm text-slate-100 font-mono font-bold whitespace-nowrap">
              {formatValue(minValue)}
            </div>
          </div>
        </div>

        {/* Scale info */}
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="text-xs text-slate-400 italic">Log. Skala</div>
        </div>
      </div>
    </div>
  );
}
