import { useTesterStore } from './use-tester-store';
import { useProgrammerStore } from './use-programmer-store';

export interface RoleTab {
  id: string;
  label: string;
  icon: string;
  role: 'tech-support' | 'tester' | 'programmer';
}

// Define all possible tabs with their role requirements
const ALL_TABS: RoleTab[] = [
  { id: 'chat', label: 'Chat', icon: 'MessageSquare', role: 'tech-support' },
  { id: 'test', label: 'Test', icon: 'Bug', role: 'tester' },
  { id: 'fix', label: 'Fix', icon: 'Code', role: 'programmer' },
];

/**
 * Hook to derive visible tabs based on enabled roles.
 * 
 * - Chat tab is always visible (Tech Support Staff is always on)
 * - Test tab is visible when Tester role is enabled
 * - Fix tab is visible when Programmer role is enabled
 */
export function useRoleTabs(): RoleTab[] {
  const { isTesterModeEnabled } = useTesterStore();
  const { isProgrammerModeEnabled } = useProgrammerStore();

  // Tech Support Staff is always on, so Chat tab is always included
  const visibleTabs = ALL_TABS.filter((tab) => {
    switch (tab.role) {
      case 'tech-support':
        return true; // Always visible
      case 'tester':
        return isTesterModeEnabled;
      case 'programmer':
        return isProgrammerModeEnabled;
      default:
        return false;
    }
  });

  return visibleTabs;
}

/**
 * Hook to check if a specific role is enabled.
 * Useful for conditional rendering based on roles.
 */
export function useIsRoleEnabled(role: 'tech-support' | 'tester' | 'programmer'): boolean {
  const { isTesterModeEnabled } = useTesterStore();
  const { isProgrammerModeEnabled } = useProgrammerStore();

  switch (role) {
    case 'tech-support':
      return true; // Always enabled
    case 'tester':
      return isTesterModeEnabled;
    case 'programmer':
      return isProgrammerModeEnabled;
    default:
      return false;
  }
}
