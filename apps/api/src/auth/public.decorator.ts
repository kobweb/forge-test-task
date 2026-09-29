import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'forge:isPublic';

/** Opts a route out of the global JwtAuthGuard. Only /auth/* uses it. */
export const Public = () => SetMetadata(IS_PUBLIC, true);
