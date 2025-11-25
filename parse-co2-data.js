#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, 'co2.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvContent.split('\n').filter(line => line.trim());
const header = lines[0].split(';');

// Extract year columns (Y_1970, Y_1971, ... Y_2024)
const yearColumns = header.slice(3).map(col => parseInt(col.replace('Y_', '')));

// Parse data rows
const countries = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const values = line.split(';');

  if (values.length < 4) continue; // Skip malformed lines

  const region = values[0];
  const countryCode = values[1];
  const countryName = values[2];
  const yearData = values.slice(3);

  // Convert year data (handle European decimal format: comma to dot)
  const years = {};
  yearColumns.forEach((year, idx) => {
    if (yearData[idx]) {
      const value = parseFloat(yearData[idx].replace(',', '.'));
      years[year] = {
        absolute: isNaN(value) ? 0 : value / 1000, // Convert to Gigatonnes
        perCapita: 0, // Will be calculated later if we have population data
        uncertainty: isNaN(value) || value === 0
      };
    }
  });

  countries.push({
    region,
    countryCode,
    countryName,
    years
  });
}

console.log(`Parsed ${countries.length} countries`);
console.log(`Year range: ${yearColumns[0]} - ${yearColumns[yearColumns.length - 1]}`);

// Generate TypeScript file
const tsContent = `// Generated from co2.csv
// CO2 emissions data by country (1970-2024)
// Source: EDGAR (Emissions Database for Global Atmospheric Research)

import type { CO2Data } from '../lib/co2-data';

export const realCO2Data: CO2Data[] = ${JSON.stringify(
  countries.map(c => ({
    id: c.countryCode,
    name: c.countryName,
    type: 'country',
    years: c.years,
    // Store region for continent grouping
    _region: c.region
  })),
  null,
  2
)};

// Region/continent groupings extracted from the data
export const regionGroupings = {
${Array.from(new Set(countries.map(c => c.region)))
  .map(region => {
    const countriesInRegion = countries.filter(c => c.region === region).map(c => `'${c.countryCode}'`);
    return `  '${region}': [${countriesInRegion.join(', ')}]`;
  })
  .join(',\n')}
};
`;

// Write to src/data/co2-real-data.ts
const outputPath = path.join(__dirname, 'src', 'data', 'co2-real-data.ts');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, tsContent);

console.log(`✅ Generated ${outputPath}`);
console.log(`✅ File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);