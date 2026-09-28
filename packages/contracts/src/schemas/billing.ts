import { z } from 'zod';
import { ENTITLEMENT_TIERS, PRODUCT_IDS, type Entitlement } from '../domain';

export const productIdSchema = z.enum(PRODUCT_IDS, 'Choose a plan.');

export const entitlementSchema = z.object({
  tier: z.enum(ENTITLEMENT_TIERS),
  productId: productIdSchema.nullable(),
  trialEndsAt: z.iso.datetime().nullable(),
}) satisfies z.ZodType<Entitlement>;

export const mockPurchaseBodySchema = z.object({
  productId: productIdSchema,
});
export type MockPurchaseBody = z.infer<typeof mockPurchaseBodySchema>;
