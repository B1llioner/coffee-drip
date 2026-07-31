import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "@algi/database";

export const ADMIN_ROLES = "admin_roles";
export const AdminRoles = (...roles: UserRole[]) => SetMetadata(ADMIN_ROLES, roles);
