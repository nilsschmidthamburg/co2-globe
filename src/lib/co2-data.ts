// Real CO2 emissions data (1970-2024)
// Source: EDGAR (Emissions Database for Global Atmospheric Research)

export interface CO2Data {
  id: string; // ISO 3 code or Continent ID
  name: string;
  type: 'country' | 'continent';
  years: {
    [year: number]: {
      absolute: number; // in Gigatonnes
      perCapita: number; // in Tonnes
      uncertainty: boolean; // if data is missing/uncertain
    };
  };
  _region?: string; // Optional region/continent grouping for continent view
}

import { realCO2Data, regionGroupings } from '@/data/co2-real-data';

const START_YEAR = 1970;
const END_YEAR = 2024;

// Export real CO2 data
export const co2Data: CO2Data[] = realCO2Data;

// Export region groupings for continent view mode
export const regions = regionGroupings;

// Get data for a specific year
export const getDataForYear = (data: CO2Data[], year: number) => {
  return data.map(d => ({
    ...d,
    value: d.years[year],
  }));
};

// Get the year range
export const getYearRange = () => [START_YEAR, END_YEAR] as const;
