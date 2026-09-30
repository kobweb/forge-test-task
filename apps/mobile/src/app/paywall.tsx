import { PRODUCT_IDS, type ProductId } from '@forge/contracts';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Chip, CloseButton, cn, LinkButton, RadioGroup, Typography, useToast } from 'heroui-native';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { FormAlert } from '@/components/form-alert';
import { Icon } from '@/components/icon';
import { SubmitButton } from '@/components/submit-button';
import { COACH_BENEFITS } from '@/content/labels';
import { usePurchase, useRestorePurchases } from '@/features/billing/api';
import { ProductOption } from '@/features/billing/product-option';
import { PRODUCTS } from '@/features/billing/products';
import { analytics, type PaywallSource } from '@/lib/analytics';

export default function PaywallScreen() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  const [productId, setProductId] = useState<ProductId>('forge_plus_yearly');
  const purchase = usePurchase();
  const restore = useRestorePurchases();
  const { toast } = useToast();
  const product = PRODUCTS.find((candidate) => candidate.id === productId) ?? PRODUCTS[0];
  const error = purchase.error ?? restore.error;

  useEffect(() => {
    analytics.track('paywall_viewed', { source: toPaywallSource(source) });
  }, [source]);

  const selectProduct = (value: string) => {
    const id = PRODUCT_IDS.find((candidate) => candidate === value);
    // HeroUI reports a tap on the already-selected card too: no change, no haptic.
    if (!id || id === productId) return;
    void Haptics.selectionAsync();
    setProductId(id);
    analytics.track('product_selected', { productId: id });
  };

  // Each action clears the other's stale error first, since the Alert shows whichever is set.
  const startTrial = () => {
    restore.reset();
    purchase.mutate(productId, {
      onSuccess: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.show({ variant: 'success', label: 'Welcome to Forge Plus' });
        router.back();
      },
    });
  };

  const restorePurchases = () => {
    purchase.reset();
    restore.mutate(undefined, {
      onSuccess: (entitlement) => {
        if (entitlement.tier === 'plus') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast.show({ variant: 'success', label: 'Purchases restored' });
          router.back();
        } else {
          toast.show({ label: 'No purchases to restore on this account.' });
        }
      },
    });
  };

  // `android:`-scoped classes were observed to apply on iOS with Uniwind 1.12.0 in Expo Go, so the
  // platform check is done at runtime: Android's edge-to-edge modal needs the status-bar padding,
  // the iOS sheet does not.
  return (
    <View className={cn('flex-1 bg-background', Platform.OS === 'android' && 'pt-safe')}>
      {/* The iOS sheet sits on a dark backdrop, where the root's dark status-bar text vanishes;
          the entry pops off React Native's StatusBar stack when the modal unmounts. */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      <ScrollView contentContainerClassName="gap-6 px-6 pb-6 pt-4">
        <View className="flex-row justify-end">
          <CloseButton onPress={() => router.back()} accessibilityLabel="Close" />
        </View>
        <View className="gap-2">
          <Typography.Heading type="h2">Forge Plus</Typography.Heading>
          <Typography type="body" color="muted">
            Your coach, on call for every session.
          </Typography>
        </View>
        <View className="gap-3">
          {COACH_BENEFITS.map((benefit) => (
            <View key={benefit} className="flex-row items-center gap-3">
              <Icon name="checkmark-circle" size={20} className="text-accent" />
              <Typography type="body-sm" className="flex-1">
                {benefit}
              </Typography>
            </View>
          ))}
        </View>
        <RadioGroup value={productId} onValueChange={selectProduct} className="gap-3">
          {PRODUCTS.map((option) => (
            <ProductOption key={option.id} product={option} isSelected={option.id === productId} />
          ))}
        </RadioGroup>
      </ScrollView>

      {/* The alert lives in the footer, next to the action it belongs to: at the end of the
          scroll content it sat under the footer on an iPhone 16 and needed a scroll to read. */}
      <View className="gap-3 border-t border-separator px-6 pb-safe-offset-3 pt-4">
        {error ? <FormAlert message={error.message} /> : null}
        <SubmitButton
          label="Start 7-day trial"
          isPending={purchase.isPending}
          isDisabled={restore.isPending}
          onPress={startTrial}
        />
        <Typography type="body-xs" color="muted" align="center">
          {`7 days free, then ${product.price}. Cancel anytime.`}
        </Typography>
        <LinkButton onPress={restorePurchases} isDisabled={restore.isPending || purchase.isPending}>
          Restore purchases
        </LinkButton>
        <Chip size="sm" variant="soft" color="default" className="self-center">
          Sandbox · no real charge
        </Chip>
      </View>
    </View>
  );
}

// The in-app entry points say where they are; a typed or shared link does not.
function toPaywallSource(source: string | undefined): PaywallSource {
  return source === 'coach_teaser' || source === 'settings' ? source : 'direct';
}
