type UserRole = "ADMIN" | "RECRUITER" | "HIRING_MANAGER" | "INTERVIEWER" | "EMPLOYEE";

type Permission =
  | "jobs:create"
  | "jobs:edit"
  | "jobs:delete"
  | "jobs:view"
  | "candidates:view_all"
  | "candidates:view_assigned"
  | "candidates:add"
  | "candidates:move"
  | "candidates:archive"
  | "interviews:schedule"
  | "interviews:view"
  | "feedback:submit"
  | "feedback:view"
  | "insights:view"
  | "insights:export"
  | "users:manage"
  | "settings:manage"
  | "referrals:submit"
  | "referrals:view_all"
  | "referrals:rewards_manage";

const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    "jobs:create", "jobs:edit", "jobs:delete", "jobs:view",
    "candidates:view_all", "candidates:add", "candidates:move", "candidates:archive",
    "interviews:schedule", "interviews:view",
    "feedback:submit", "feedback:view",
    "insights:view", "insights:export",
    "users:manage", "settings:manage",
    "referrals:submit", "referrals:view_all", "referrals:rewards_manage",
  ],
  RECRUITER: [
    "jobs:create", "jobs:edit", "jobs:view",
    "candidates:view_all", "candidates:add", "candidates:move", "candidates:archive",
    "interviews:schedule", "interviews:view",
    "feedback:submit", "feedback:view",
    "insights:view", "insights:export",
    "referrals:submit", "referrals:view_all",
  ],
  HIRING_MANAGER: [
    "jobs:create", "jobs:edit", "jobs:view",
    "candidates:view_assigned", "candidates:add",
    "interviews:view",
    "feedback:submit", "feedback:view",
    "insights:view",
    "referrals:submit",
  ],
  INTERVIEWER: [
    "jobs:view",
    "candidates:view_assigned",
    "interviews:view",
    "feedback:submit",
    "referrals:submit",
  ],
  EMPLOYEE: [
    "referrals:submit",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function requirePermission(role: UserRole | undefined, permission: Permission): void {
  if (!role || !hasPermission(role, permission)) {
    throw new Error(`Forbidden: requires ${permission}`);
  }
}

export function canAccessRoute(role: UserRole | undefined, route: string): boolean {
  if (!role) return false;

  const routePermissions: Record<string, Permission> = {
    "/jobs": "jobs:view",
    "/candidates": "candidates:view_assigned",
    "/interviews": "interviews:view",
    "/feedback": "feedback:submit",
    "/insights": "insights:view",
    "/settings": "settings:manage",
    "/referrals": "referrals:view_all",
  };

  const requiredPermission = routePermissions[route];
  if (!requiredPermission) return true;
  return hasPermission(role, requiredPermission);
}
