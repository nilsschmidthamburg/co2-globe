import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GlobeViz } from './components/GlobeViz';
import { ControlPanel } from './components/ControlPanel';
import { Tooltip } from './components/Tooltip';
import { Legend } from './components/Legend';
import { co2Data, getYearRange, CO2Data } from './lib/co2-data';
import { Loader2 } from 'lucide-react';

function App() {
  // State
  const [data, setData] = useState<CO2Data[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearRange] = useState(getYearRange());
  const [currentYear, setCurrentYear] = useState(yearRange[1]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<'country' | 'continent'>('country');
  const [dataMode, setDataMode] = useState<'absolute' | 'perCapita'>('absolute');

  // Tooltip State
  const [hoveredCountry, setHoveredCountry] = useState<{ id: string; name: string } | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Load Data
  useEffect(() => {
    // Simulate async load
    setTimeout(() => {
      setData(co2Data);
      setLoading(false);
    }, 800);
  }, []);

  // Reset to start year when resuming from end
  useEffect(() => {
    if (isPlaying && currentYear >= yearRange[1]) {
      setCurrentYear(yearRange[0]);
    }
  }, [isPlaying, currentYear, yearRange]);

  // Playback Loop
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentYear(prev => {
          if (prev >= yearRange[1]) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 300); // 300ms per year
    }
    return () => clearInterval(interval);
  }, [isPlaying, yearRange]);

  // Spacebar to toggle playback
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault(); // Prevent page scroll
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Arrow keys for year changes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'ArrowRight') {
        setCurrentYear(prev => Math.min(prev + 1, yearRange[1]));
      }
      if (e.code === 'ArrowDown' || e.code === 'ArrowLeft') {
        setCurrentYear(prev => Math.max(prev - 1, yearRange[0]));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [yearRange]);

  // Compute total emissions for current year
  const totalEmissions = useMemo(() => {
    return data
      .filter(d => d.type === 'country')
      .reduce((sum, country) => {
        const yearData = country.years[currentYear];
        return sum + (yearData?.absolute || 0);
      }, 0);
  }, [data, currentYear]);

  // Compute current year data for hovered country including historical data for trend calculation
  const tooltipData = useMemo(() => {
    // If we have a hovered region (from region mode), calculate data dynamically for current year
    if (hoveredRegion) {
      // Calculate current year emissions for this region
      let currentAbsolute = 0;
      let currentPerCapita = 0;
      let countryCount = 0;

      data.forEach(countryData => {
        if (countryData._region === hoveredRegion) {
          const yearData = countryData.years[currentYear];
          if (yearData && !yearData.uncertainty) {
            currentAbsolute += yearData.absolute;
            currentPerCapita += yearData.perCapita;
            countryCount++;
          }
        }
      });

      // Calculate average perCapita
      if (countryCount > 0) {
        currentPerCapita = currentPerCapita / countryCount;
      }

      // Calculate historical emissions for this region (last 4 years)
      const historicalYears: number[] = [];
      const historicalValues: number[] = [];

      for (let i = 3; i >= 0; i--) {
        const year = currentYear - i;
        if (year < yearRange[0]) continue;

        // Sum up all countries in this region for the historical year
        let regionTotal = 0;
        data.forEach(countryData => {
          if (countryData._region === hoveredRegion) {
            const yearData = countryData.years[year];
            if (yearData && !yearData.uncertainty) {
              regionTotal += yearData.absolute;
            }
          }
        });

        if (regionTotal > 0) {
          historicalYears.push(year);
          historicalValues.push(regionTotal);
        }
      }

      return {
        absolute: currentAbsolute,
        perCapita: currentPerCapita,
        uncertainty: false,
        region: hoveredRegion,
        isRegion: true,
        historicalYears,
        historicalValues
      };
    }

    // Otherwise, compute country data as before
    if (!hoveredCountry) return null;

    const countryData = data.find(d => d.id === hoveredCountry.id);
    if (!countryData) {
      return { country: hoveredCountry.name, missing: true };
    }

    const yearData = countryData.years[currentYear];

    // Collect last 4 years of data for trend calculation
    const historicalYears: number[] = [];
    const historicalValues: number[] = [];

    for (let i = 3; i >= 0; i--) {
      const year = currentYear - i;
      if (year >= yearRange[0] && countryData.years[year] && !countryData.years[year].uncertainty) {
        historicalYears.push(year);
        historicalValues.push(countryData.years[year].absolute);
      }
    }

    return {
      ...yearData,
      country: hoveredCountry.name,
      historicalYears,
      historicalValues
    };
  }, [hoveredCountry, hoveredRegion, data, currentYear, yearRange]);

  // Handlers
  const handleHover = useCallback((data: any, _x: number, _y: number) => {
    if (data) {
      if (data.isRegion) {
        // Store only the region name for region mode
        setHoveredRegion(data.region);
        setHoveredCountry(null);
      } else {
        // Store country data for country mode
        setHoveredCountry({ id: data.id, name: data.country });
        setHoveredRegion(null);
      }
    } else {
      setHoveredCountry(null);
      setHoveredRegion(null);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
        <h1 className="text-2xl font-bold tracking-wider">CO₂ GLOBE</h1>
        <p className="text-slate-400">Lade Klimadaten...</p>
      </div>
    );
  }

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-slate-950 font-sans"
      onMouseMove={handleMouseMove}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 p-6 z-10 pointer-events-none">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 tracking-tighter drop-shadow-lg">
          CO₂ GLOBE
        </h1>
        <p className="text-slate-300 text-sm font-medium mt-1 max-w-xs drop-shadow-md">
          Interaktive Visualisierung der globalen CO₂-Emissionen (1970-2024)
        </p>
      </div>

      {/* Data Source Attribution */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
        <div className="bg-slate-900/80 backdrop-blur-sm p-3 rounded-lg border border-slate-800 text-xs text-slate-400 shadow-xl max-w-sm">
          <div className="mb-1">
            <span className="font-semibold text-slate-300">Datenquelle:</span>{' '}
            <a
              href="https://edgar.jrc.ec.europa.eu/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
            >
              EDGAR
            </a>{' '}
            (Emissions Database for Global Atmospheric Research)
          </div>
          <div className="text-[10px] text-slate-500">
            © European Commission, JRC | Lizenz:{' '}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 hover:underline"
            >
              CC BY 4.0
            </a>
          </div>
        </div>
      </div>

      {/* 3D Viz */}
      <GlobeViz
        data={data}
        year={currentYear}
        viewMode={viewMode}
        dataMode={dataMode}
        onHover={handleHover}
      />

      {/* Legend */}
      <Legend dataMode={dataMode} data={data} year={currentYear} />

      {/* Controls */}
      <ControlPanel
        year={currentYear}
        setYear={setCurrentYear}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        viewMode={viewMode}
        setViewMode={setViewMode}
        dataMode={dataMode}
        setDataMode={setDataMode}
        yearRange={yearRange}
        totalEmissions={totalEmissions}
      />

      {/* Tooltip */}
      <Tooltip
        visible={!!tooltipData}
        data={tooltipData}
        x={mousePos.x}
        y={mousePos.y}
        dataMode={dataMode}
      />
    </div>
  );
}

export default App;
