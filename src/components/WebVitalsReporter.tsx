'use client';

/**
 * Web Vitals Reporter Component
 *
 * Client component that reports Web Vitals metrics to the API endpoint
 */

import { useReportWebVitals } from 'next/web-vitals';
import { reportWebVitals } from '../lib/web-vitals';

export function WebVitalsReporter() {
  useReportWebVitals(reportWebVitals);
  return null;
}
