/**
 * usePermissions Hook
 * 
 * React hook for checking user permissions and roles
 * Part of the Advanced RLHF RAG Implementation - RBAC System
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  hasPermission as checkPermission,
  getUserRole as fetchUserRole,
  getUserRoleRecord,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  type UserRole,
  type Permission,
  type UserRoleRecord,
} from "../lib/permissions";

export interface UsePermissionsResult {
  userRole: UserRole | null;
  userRoleRecord: UserRoleRecord | null;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  isAdmin: boolean;
  isCurator: boolean;
  isViewer: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to check user permissions
 * @param userEmail - Email of the user to check permissions for
 */
export function usePermissions(userEmail?: string): UsePermissionsResult {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userRoleRecord, setUserRoleRecord] = useState<UserRoleRecord | null>(null);
  const [permissions, setPermissions] = useState<Set<Permission>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user role and permissions
  const fetchPermissions = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch role
      const role = await fetchUserRole(email);
      setUserRole(role);

      // Fetch full role record
      const record = await getUserRoleRecord(email);
      setUserRoleRecord(record);

      // Fetch all possible permissions and check each one
      if (role) {
        const allPermissions: Permission[] = [
          "rlhf_feedback",
          "view_analytics",
          "manage_vectors",
          "manage_users",
        ];

        const permissionResults = await Promise.all(
          allPermissions.map(async (permission) => ({
            permission,
            hasAccess: await checkPermission(email, permission),
          }))
        );

        const userPermissions = new Set<Permission>(
          permissionResults
            .filter((result) => result.hasAccess)
            .map((result) => result.permission)
        );

        setPermissions(userPermissions);
      } else {
        setPermissions(new Set());
      }
    } catch (err) {
      console.error("Error fetching permissions:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (userEmail) {
      fetchPermissions(userEmail);
    } else {
      setLoading(false);
    }
  }, [userEmail, fetchPermissions]);

  // Permission check functions
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return permissions.has(permission);
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (permissionsToCheck: Permission[]): boolean => {
      return permissionsToCheck.some((permission) => permissions.has(permission));
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (permissionsToCheck: Permission[]): boolean => {
      return permissionsToCheck.every((permission) => permissions.has(permission));
    },
    [permissions]
  );

  // Role shortcuts
  const isAdmin = userRole === "admin";
  const isCurator = userRole === "curator";
  const isViewer = userRole === "viewer";

  // Refresh function
  const refresh = useCallback(async () => {
    if (userEmail) {
      await fetchPermissions(userEmail);
    }
  }, [userEmail, fetchPermissions]);

  return {
    userRole,
    userRoleRecord,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isCurator,
    isViewer,
    loading,
    error,
    refresh,
  };
}

/**
 * Permission Guard Component
 * Wraps children and only renders if user has required permission
 */
export interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  anyOf?: Permission[];
  allOf?: Permission[];
  userEmail?: string;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  permission,
  anyOf,
  allOf,
  userEmail,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions(userEmail);

  if (loading) {
    return null;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check any of permissions
  if (anyOf && !hasAnyPermission(anyOf)) {
    return <>{fallback}</>;
  }

  // Check all of permissions
  if (allOf && !hasAllPermissions(allOf)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

