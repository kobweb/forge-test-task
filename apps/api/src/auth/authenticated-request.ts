export interface AuthenticatedRequest {
  headers: { authorization?: string };
  /** Set by JwtAuthGuard once the bearer token is verified and its user still exists. */
  userId?: string;
}
