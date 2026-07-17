import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export function resolveUserValue(user: Record<string, any> | undefined, data: string | undefined) {
  if (!data) {
    return user;
  }

  if (user?.[data] !== undefined) {
    return user[data];
  }

  if (data === 'sub' && user?.id !== undefined) {
    return user.id;
  }

  if (data === 'id' && user?.sub !== undefined) {
    return user.sub;
  }

  return undefined;
}

export const GetCurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return resolveUserValue(request.user, data);
  },
);
