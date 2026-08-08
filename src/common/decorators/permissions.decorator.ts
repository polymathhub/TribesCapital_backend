import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

// Usage: @Permissions({ resource: 'projects', action: 'delete' })
export const Permissions = (permission: { resource: string; action: string }) =>
  SetMetadata(PERMISSIONS_KEY, permission);
