/**
 * Calculate linear regression slope for a series of data points
 * Used to determine emission trends over time
 */
export interface RegressionResult {
  slope: number; // Change per year
  trend: 'steigend' | 'sinkend' | 'stabil'; // German: rising, falling, stable
  confidence: 'high' | 'low'; // Based on data availability
}

/**
 * Performs simple linear regression on time series data
 * @param years Array of years (x values)
 * @param values Array of emission values (y values)
 * @returns RegressionResult with slope and trend classification
 */
export function calculateTrend(years: number[], values: number[]): RegressionResult {
  if (years.length !== values.length || years.length < 2) {
    return { slope: 0, trend: 'stabil', confidence: 'low' };
  }

  const n = years.length;

  // Calculate means
  const meanX = years.reduce((sum, x) => sum + x, 0) / n;
  const meanY = values.reduce((sum, y) => sum + y, 0) / n;

  // Calculate slope using least squares method
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (years[i] - meanX) * (values[i] - meanY);
    denominator += (years[i] - meanX) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;

  // Classify trend based on percentage change per year
  // Calculate relative slope: what percentage of the mean value changes per year
  const relativeSlope = meanY !== 0 ? slope / meanY : 0;

  // Threshold: 0.5% change per year (0.005)
  // This means a country with stable emissions would fluctuate less than 0.5% per year
  const threshold = 0.005;

  let trend: 'steigend' | 'sinkend' | 'stabil';
  if (Math.abs(relativeSlope) < threshold) {
    trend = 'stabil';
  } else if (relativeSlope > 0) {
    trend = 'steigend';
  } else {
    trend = 'sinkend';
  }

  // Confidence is high if we have all 4 years of data
  const confidence = n >= 4 ? 'high' : 'low';

  return { slope, trend, confidence };
}