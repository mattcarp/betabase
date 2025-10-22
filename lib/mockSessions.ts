/**
 * Mock Session Data for Development
 */

import { Session } from '../types/session';

export const mockSessions: Session[] = [
  {
    id: 'session-001',
    name: 'Login Flow Test - Chrome Desktop',
    aut: 'SIAM Web Application',
    duration: 245, // seconds
    interactionCount: 18,
    testerName: 'Sarah Johnson',
    date: new Date('2025-10-20T14:30:00'),
    status: 'completed',
    notes: 'Successful login flow test with magic link authentication',
    tags: ['authentication', 'smoke-test'],
  },
  {
    id: 'session-002',
    name: 'Chat Interface Interaction Test',
    aut: 'SIAM Chat Module',
    duration: 420,
    interactionCount: 45,
    testerName: 'Mike Chen',
    date: new Date('2025-10-21T09:15:00'),
    status: 'has-issues',
    notes: 'Found issues with message rendering on long conversations',
    tags: ['chat', 'ui', 'regression'],
  },
  {
    id: 'session-003',
    name: 'Dashboard Navigation - Mobile',
    aut: 'SIAM Dashboard',
    duration: 180,
    interactionCount: 22,
    testerName: 'Emily Rodriguez',
    date: new Date('2025-10-21T11:45:00'),
    status: 'completed',
    tags: ['mobile', 'navigation'],
  },
  {
    id: 'session-004',
    name: 'File Upload Workflow',
    aut: 'Knowledge Base Manager',
    duration: 315,
    interactionCount: 31,
    testerName: 'Sarah Johnson',
    date: new Date('2025-10-22T08:00:00'),
    status: 'in-progress',
    notes: 'Currently testing large file upload scenarios',
    tags: ['file-upload', 'knowledge-base'],
  },
  {
    id: 'session-005',
    name: 'Settings Panel Configuration',
    aut: 'SIAM Settings',
    duration: 156,
    interactionCount: 14,
    testerName: 'Alex Kim',
    date: new Date('2025-10-22T10:20:00'),
    status: 'completed',
    tags: ['settings', 'configuration'],
  },
  {
    id: 'session-006',
    name: 'Dark Theme Visual Regression',
    aut: 'SIAM Web Application',
    duration: 390,
    interactionCount: 52,
    testerName: 'Mike Chen',
    date: new Date('2025-10-22T13:30:00'),
    status: 'has-issues',
    notes: 'Some UI elements have incorrect contrast ratios in dark theme',
    tags: ['visual', 'accessibility', 'theme'],
  },
  {
    id: 'session-007',
    name: 'API Response Time Test',
    aut: 'AOMA Integration',
    duration: 280,
    interactionCount: 38,
    testerName: 'Emily Rodriguez',
    date: new Date('2025-10-22T15:00:00'),
    status: 'completed',
    tags: ['api', 'performance'],
  },
  {
    id: 'session-008',
    name: 'Cross-Browser Compatibility Check',
    aut: 'SIAM Web Application',
    duration: 510,
    interactionCount: 67,
    testerName: 'Alex Kim',
    date: new Date('2025-10-22T16:15:00'),
    status: 'in-progress',
    notes: 'Testing across Chrome, Firefox, Safari, and Edge',
    tags: ['cross-browser', 'compatibility'],
  },
];

/**
 * Get unique list of testers
 */
export function getUniqueTesters(): string[] {
  return Array.from(new Set(mockSessions.map((s) => s.testerName))).sort();
}

/**
 * Get unique list of AUTs (Applications Under Test)
 */
export function getUniqueAUTs(): string[] {
  return Array.from(new Set(mockSessions.map((s) => s.aut))).sort();
}

/**
 * Format duration in seconds to readable string
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format date to relative time (e.g., "2 hours ago", "yesterday")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays === 1) return 'yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString();
}
