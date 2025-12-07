/**
 * Permission Management Hook
 * 
 * Provides Role-Based Access Control (RBAC) for RLHF and curation features.
 * Integrates with Supabase user_roles and role_permissions tables.
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type Permission = 
  | "rlhf_feedback"
  | "rlhf_view_insights"
  | "rlhf_view_dashboard"
  | "curate_documents"
  | "manage_users"
  | "admin";

export interface PermissionCheckResult {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  userRole: string | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to check user permissions based on their role
 */
export function usePermissions(userEmail?: string): PermissionCheckResult {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Set<Permission>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadPermissions() {
      if (!userEmail) {
        setLoading(false);
        return;
      }

      try {
        // Get user role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role_name")
          .eq("user_email", userEmail)
          .single();

        if (roleError) {
          console.warn("No role found for user:", userEmail);
          setLoading(false);
          return;
        }

        setUserRole(roleData.role_name);

        // Get permissions for this role
        const { data: permData, error: permError } = await supabase
          .from("role_permissions")
          .select("permission_name")
          .eq("role_name", roleData.role_name);

        if (permError) {
          throw permError;
        }

        const permSet = new Set<Permission>(
          permData.map((p) => p.permission_name as Permission)
        );
        setPermissions(permSet);
      } catch (err) {
        console.error("Error loading permissions:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [userEmail]);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return permissions.has(permission) || permissions.has("admin");
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (perms: Permission[]): boolean => {
      return perms.some((p) => hasPermission(p));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (perms: Permission[]): boolean => {
      return perms.every((p) => hasPermission(p));
    },
    [hasPermission]
  );

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userRole,
    loading,
    error,
  };
}

/**
 * Component wrapper for permission-based rendering
 */
interface PermissionGuardProps {
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
