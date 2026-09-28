export const routes = {
  auth: { signup: '/auth/signup', login: '/auth/login' },
  me: '/me',
  plan: {
    get: '/plan',
    complete: (id: string) => `/plan/sessions/${id}/complete`,
    reset: '/plan/reset',
  },
  coach: { messages: '/coach/messages' },
  billing: {
    entitlement: '/billing/entitlement',
    mockPurchase: '/billing/mock-purchase',
    mockRestore: '/billing/mock-restore',
  },
} as const;
