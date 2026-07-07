import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetCurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!data) return user;

    if (user?.[data] !== undefined) return user[data];
    if (data === 'id' && user?.sub !== undefined) return user.sub;
    if (data === 'sub' && user?.id !== undefined) return user.id;

    return undefined;
  },
);
