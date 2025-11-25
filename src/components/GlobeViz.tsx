import React, { useEffect, useState, useMemo, useRef } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import * as d3 from 'd3-scale';
import { interpolateReds, interpolateBlues } from 'd3-scale-chromatic';
import { color } from 'd3-color';
import { CO2Data, regions } from '../lib/co2-data';
import { translateCountryName } from '../lib/country-translations';

// Suppress Three.js warnings about multiple instances
const originalWarn = console.warn;
const originalError = console.error;

function shouldSuppress(args: any[]) {
  const msg = args.join(' ');
  return msg.includes('Multiple instances of Three.js being imported');
}

console.warn = (...args) => {
  if (shouldSuppress(args)) return;
  originalWarn(...args);
};

console.error = (...args) => {
  if (shouldSuppress(args)) return;
  originalError(...args);
};

interface GlobeVizProps {
  data: CO2Data[];
  year: number;
  viewMode: 'country' | 'continent';
  dataMode: 'absolute' | 'perCapita';
  onHover: (data: any | null, x: number, y: number) => void;
  isPlaying: boolean;
}

export function GlobeViz({ data, year, viewMode, dataMode, onHover, isPlaying }: GlobeVizProps) {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [countries, setCountries] = useState<any>({ features: [] });
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Set initial viewpoint and enable autorotation
  useEffect(() => {
    if (!globeEl.current) return;

    // Set initial point of view
    globeEl.current.pointOfView({ lat: 32, lng: 8, altitude: 1.8 }, 0);

    const controls = globeEl.current.controls();
    if (controls) {
      // Enable autorotation
      controls.autoRotate = true;
      controls.autoRotateSpeed = -0.5; // Adjust speed (positive = counter-clockwise)

      // Stop autorotation on user interaction
      const stopAutoRotate = () => {
        if (controls.autoRotate) {
          controls.autoRotate = false;
        }
      };

      controls.addEventListener('start', stopAutoRotate);

      return () => {
        controls.removeEventListener('start', stopAutoRotate);
      };
    }
  }, [countries]); // Run after countries are loaded to ensure globe is ready

  // Restart autorotation when playback starts
  useEffect(() => {
    if (!globeEl.current || !isPlaying) return;

    const controls = globeEl.current.controls();
    if (controls && !controls.autoRotate) {
      controls.autoRotate = true;
    }
  }, [isPlaying]);

  // Load Medium Res GeoJSON (50m - balanced detail and performance)
  useEffect(() => {
    fetch(
      'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson'
    )
      //fetch('https://naciscdn.org/naturalearth/50m/cultural/ne_50m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => {
        setCountries(data);
      })
      .catch(err => console.error('Failed to load GeoJSON', err));

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Country code mapping for GeoJSON mismatches
  // Some GeoJSON datasets use different codes than ISO 3166-1 alpha-3
  const codeMapping: Record<string, string> = {
    '-99': 'FRA', // France (Natural Earth uses -99 for sovereignty disputes)
    SJM: 'NOR', // Svalbard and Jan Mayen -> Norway
    SSD: 'SDN', // South Sudan -> Sudan (South Sudan independent since 2011, data combined)
    SRB: 'SCG', // Serbia -> Serbia and Montenegro (data has them combined)
    MNE: 'SCG', // Montenegro -> Serbia and Montenegro (data has them combined)
  };

  // Create a map for quick data lookup
  const dataMap = useMemo(() => {
    const map = new Map();
    data.forEach(d => {
      map.set(d.id, d);
    });
    return map;
  }, [data]);

  // Create reverse lookup: country code -> region name
  const countryToRegion = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(regions).forEach(([regionName, countryCodes]) => {
      countryCodes.forEach((code: string) => {
        map.set(code, regionName);
      });
    });
    return map;
  }, []);

  // Aggregate emissions by region for continent view mode
  const regionData = useMemo(() => {
    const regionMap = new Map<string, { absolute: number; perCapita: number; count: number }>();

    data.forEach(countryData => {
      const region = countryToRegion.get(countryData.id);
      if (!region) return;

      const yearData = countryData.years[year];
      if (!yearData || yearData.uncertainty) return;

      const existing = regionMap.get(region) || { absolute: 0, perCapita: 0, count: 0 };
      regionMap.set(region, {
        absolute: existing.absolute + yearData.absolute,
        perCapita: existing.perCapita + yearData.perCapita,
        count: existing.count + 1,
      });
    });

    // Calculate average perCapita for each region
    regionMap.forEach(value => {
      if (value.count > 0) {
        value.perCapita = value.perCapita / value.count;
      }
    });

    return regionMap;
  }, [data, year, countryToRegion]);

  // Color Scales with logarithmic scaling
  const colorScale = useMemo(() => {
    // Hard minimum thresholds below which countries appear white
    // For absolute: 0.01 GT
    // For perCapita: 0.1 tonnes per capita
    const logMin = dataMode === 'absolute' ? 10 : 0.1;
    const logMax =
      dataMode === 'absolute'
        ? 14000
        : (() => {
            let maxVal = 0;
            data.forEach(d => {
              const val = d.years[year].perCapita;
              if (val > maxVal) maxVal = val;
            });
            return maxVal;
          })();

    return d3
      .scaleSequentialLog(dataMode === 'absolute' ? interpolateReds : interpolateBlues)
      .domain([logMin, logMax]);
  }, [data, year, dataMode]);

  const getPolygonData = (d: any) => {
    let countryCode = d.properties.ISO_A3;

    // Apply country code mapping if needed
    if (codeMapping[countryCode]) {
      countryCode = codeMapping[countryCode];
    }

    const countryData = dataMap.get(countryCode);

    if (!countryData) {
      return null;
    }

    const yearData = countryData.years[year];
    return { ...yearData, name: countryData.name, id: countryData.id };
  };

  // Memoize filtered polygons to prevent unnecessary updates
  const polygonsData = useMemo(() => {
    if (!countries?.features) return [];
    return countries.features.filter((d: any) => d.properties.ISO_A3 !== 'ATA'); // No Antarctica
  }, [countries]);

  const withOpacity = (c: string, opacity: number) => {
    const col = color(c);
    if (col) {
      col.opacity = opacity;
      return col.formatRgb();
    }
    return c;
  };

  return (
    <div className="absolute inset-0 z-0 bg-slate-950">
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="images/co2-globe.iml.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        polygonsData={polygonsData}
        polygonAltitude={0.01}
        polygonCapColor={(d: any) => {
          const datum = getPolygonData(d);
          if (!datum) return 'rgba(100, 100, 100, 0.3)';

          if (datum.uncertainty) return withOpacity('#555555', 0.7);

          let finalColor = '#333';

          if (viewMode === 'continent') {
            // Get the country code with mapping applied
            let countryCode = d.properties.ISO_A3;
            if (codeMapping[countryCode]) {
              countryCode = codeMapping[countryCode];
            }

            // Find which region this country belongs to
            const regionName = countryToRegion.get(countryCode);

            if (regionName) {
              // Get aggregated data for this region
              const regionEmissions = regionData.get(regionName);

              if (regionEmissions) {
                const regionValue =
                  dataMode === 'absolute' ? regionEmissions.absolute : regionEmissions.perCapita;

                // Apply threshold check for region data
                const threshold = dataMode === 'absolute' ? 10 : 0.1;
                if (regionValue < threshold) {
                  finalColor = '#ffffff';
                } else {
                  finalColor = colorScale(regionValue);
                }
              }
            }
          } else {
            const value = dataMode === 'absolute' ? datum.absolute : datum.perCapita;

            // Hard minimum thresholds - show white for countries below threshold
            const threshold = dataMode === 'absolute' ? 10 : 0.1;
            if (value < threshold) {
              finalColor = '#ffffff';
            } else {
              finalColor = colorScale(value);
            }
          }
          return withOpacity(finalColor, 0.7);
        }}
        polygonSideColor={() => 'rgba(0, 0, 0, 0.5)'}
        polygonStrokeColor={() => '#111'}
        polygonLabel={() => ''}
        onPolygonHover={(d: any) => {
          if (d) {
            const datum = getPolygonData(d);

            // In continent mode, return aggregated region data instead of country data
            if (viewMode === 'continent') {
              let countryCode = d.properties.ISO_A3;
              if (codeMapping[countryCode]) {
                countryCode = codeMapping[countryCode];
              }

              const regionName = countryToRegion.get(countryCode);

              if (regionName) {
                const regionEmissions = regionData.get(regionName);

                if (regionEmissions) {
                  onHover(
                    {
                      absolute: regionEmissions.absolute,
                      perCapita: regionEmissions.perCapita,
                      uncertainty: false,
                      region: regionName,
                      isRegion: true,
                    },
                    0,
                    0
                  );
                  return;
                }
              }
            }

            // In country mode, return individual country data
            onHover(
              datum
                ? { ...datum, country: translateCountryName(d.properties.NAME), isRegion: false }
                : { country: translateCountryName(d.properties.NAME), missing: true, isRegion: false },
              0,
              0
            );
          } else {
            onHover(null, 0, 0);
          }
        }}
        atmosphereColor="#3a228a"
        atmosphereAltitude={0.15}
      />
    </div>
  );
}
