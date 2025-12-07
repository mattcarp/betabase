/**
 * Permissions Helper Library
 *
 * Provides utilities for checking user permissions and roles
 * Part of the Advanced RLHF RAG Implementation - RBAC System
 */

import { supabase, supabaseAdmin } from "./supabase";

export type UserRole = "admin" | "curator" | "viewer";

export type Permission = "rlhf_feedback" | "view_analytics" | "manage_vectors" | "manage_users";

export interface UserRoleRecord {
  id: string;
  email: string;
  role: UserRole;
  organization: string;
  division?: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermissionRecord {
  role: UserRole;
  permission: Permission;
  description?: string;
  created_at: string;
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(email: string, permission: Permission): Promise<boolean> {
  try {
    const client = supabaseAdmin ?? supabase;

    const { data, error } = await client.rpc("has_permission", {
      user_email: email,
      required_permission: permission,
    });

    if (error) {
      console.error("Error checking permission:", error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error("Permission check failed:", error);
    return false;
  }
}

/**
 * Get user's role
 */
export async function getUserRole(email: string): Promise<UserRole | null> {
  try {
    const client = supabaseAdmin ?? supabase;

    const { data, error } = await client.rpc("get_user_role", {
      user_email: email,
    });

    if (error) {
      console.error("Error getting user role:", error);
      return null;
    }

    return data as UserRole | null;
  } catch (error) {
    console.error("Get user role failed:", error);
    return null;
  }
}

/**
 * Get all permissions for a role
 */
export async function getRolePermissions(role: UserRole): Promise<RolePermissionRecord[]> {
  try {
    const client = supabaseAdmin ?? supabase;

    const { data, error } = await client.rpc("get_role_permissions", {
      user_role: role,
    });

    if (error) {
      console.error("Error getting role permissions:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Get role permissions failed:", error);
    return [];
  }
}

/**
 * Get user's full role record
 */
export async function getUserRoleRecord(email: string): Promise<UserRoleRecord | null> {
  try {
    const client = supabaseAdmin ?? supabase;

    const { data, error } = await client.from("user_roles").select("*").eq("email", email).single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      console.error("Error getting user role record:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Get user role record failed:", error);
    return null;
  }
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(email: string, permissions: Permission[]): Promise<boolean> {
  const results = await Promise.all(
    permissions.map((permission) => hasPermission(email, permission))
  );
  return results.some((result) => result === true);
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  email: string,
  permissions: Permission[]
): Promise<boolean> {
  const results = await Promise.all(
    permissions.map((permission) => hasPermission(email, permission))
  );
  return results.every((result) => result === true);
}

/**
 * Assign role to user (admin only)
 */
export async function assignUserRole(
  email: string,
  role: UserRole,
  organization: string = "sony-music",
  division?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabaseAdmin) {
      return {
        success: false,
        error: "Admin client not available",
      };
    }

    const { error } = await supabaseAdmin.from("user_roles").upsert(
      {
        email,
        role,
        organization,
        division,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "email",
      }
    );

    if (error) {
      console.error("Error assigning user role:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Assign user role failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Remove user role (admin only)
 */
export async function removeUserRole(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabaseAdmin) {
      return {
        success: false,
        error: "Admin client not available",
      };
    }

    const { error } = await supabaseAdmin.from("user_roles").delete().eq("email", email);

    if (error) {
      console.error("Error removing user role:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Remove user role failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all users with their roles (admin only)
 */
export async function getAllUsers(): Promise<UserRoleRecord[]> {
  try {
    const client = supabaseAdmin ?? supabase;

    const { data, error } = await client
      .from("user_roles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting all users:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Get all users failed:", error);
    return [];
  }
}
