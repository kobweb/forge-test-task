import { router } from 'expo-router';
import { Avatar, ListGroup, Separator, SkeletonGroup, Typography } from 'heroui-native';
import { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { Icon } from '@/components/icon';
import { GOAL_LABELS } from '@/content/labels';
import { useEntitlement } from '@/features/billing/api';
import { useMe } from '@/features/me/api';
import { AnalyticsRow, NotificationsRow, TrackingRow } from '@/features/privacy/privacy-rows';
import { DeleteAccountDialog } from '@/features/settings/delete-account-dialog';
import { SettingsSkeleton } from '@/features/settings/settings-skeleton';
import { APP_VERSION } from '@/lib/config';
import { formatDate, initials } from '@/lib/format';
import { signOut } from '@/lib/session';

export default function SettingsScreen() {
  const me = useMe();
  const entitlement = useEntitlement();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (!me.data) return <SettingsSkeleton />;
  const user = me.data;

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 px-5 pb-10 pt-safe-offset-4"
      >
        <Typography.Heading type="h2">Settings</Typography.Heading>

        <View className="flex-row items-center gap-4">
          <Avatar size="lg" variant="soft" alt={user.displayName ?? user.email}>
            <Avatar.Fallback>{initials(user.displayName, user.email)}</Avatar.Fallback>
          </Avatar>
          <View className="flex-1 gap-0.5">
            <Typography type="h5" numberOfLines={1}>
              {user.displayName ?? 'Forge member'}
            </Typography>
            <Typography type="body-sm" color="muted" numberOfLines={1}>
              {user.email}
            </Typography>
          </View>
        </View>

        <Section title="Profile">
          <ListGroup>
            <ListGroup.Item accessibilityRole="button" onPress={() => router.push('/profile')}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Name</ListGroup.ItemTitle>
                <ListGroup.ItemDescription numberOfLines={1}>
                  {user.displayName}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item accessibilityRole="button" onPress={() => router.push('/profile')}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Goals</ListGroup.ItemTitle>
                <ListGroup.ItemDescription numberOfLines={1}>
                  {user.goals.map((goal) => GOAL_LABELS[goal].title).join(', ')}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </ListGroup>
        </Section>

        <Section title="Privacy">
          <ListGroup>
            <ListGroup.Item>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Data consent</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {user.consentAcceptedAt
                    ? `Accepted ${formatDate(user.consentAcceptedAt)}`
                    : 'Not given'}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Icon name="shield-checkmark-outline" size={20} className="text-muted" />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <NotificationsRow />
            {Platform.OS === 'ios' ? (
              <>
                <Separator className="mx-4" />
                <TrackingRow />
              </>
            ) : null}
            <Separator className="mx-4" />
            <AnalyticsRow />
          </ListGroup>
        </Section>

        <Section title="Membership">
          <ListGroup>
            <MembershipRow entitlement={entitlement} />
          </ListGroup>
        </Section>

        <Section title="Account">
          <ListGroup>
            <ListGroup.Item accessibilityRole="button" onPress={() => void signOut()}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Log out</ListGroup.ItemTitle>
              </ListGroup.ItemContent>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item accessibilityRole="button" onPress={() => setIsDeleteOpen(true)}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle className="text-danger">
                  Delete account & data
                </ListGroup.ItemTitle>
              </ListGroup.ItemContent>
            </ListGroup.Item>
          </ListGroup>
        </Section>

        <Typography type="body-xs" color="muted" align="center">
          {`Forge ${APP_VERSION}`}
        </Typography>
      </ScrollView>
      <DeleteAccountDialog isOpen={isDeleteOpen} onOpenChange={setIsDeleteOpen} />
    </>
  );
}

// The entitlement is neither persisted nor placeholdered, so until it is known the row shows a
// skeleton (also while a retry is in flight) and, once it has failed, a tap-to-retry row: a Plus
// user who launches offline must never be shown "Free" and sent to the paywall.
function MembershipRow({ entitlement }: { entitlement: ReturnType<typeof useEntitlement> }) {
  if (entitlement.data) {
    if (entitlement.data.tier === 'plus') {
      return (
        <ListGroup.Item>
          <ListGroup.ItemContent>
            <ListGroup.ItemTitle>Forge Plus</ListGroup.ItemTitle>
            <ListGroup.ItemDescription>
              {entitlement.data.trialEndsAt
                ? `Trial ends ${formatDate(entitlement.data.trialEndsAt, { withYear: false })}`
                : 'Active'}
            </ListGroup.ItemDescription>
          </ListGroup.ItemContent>
          <ListGroup.ItemSuffix>
            <Icon name="sparkles" size={20} className="text-accent" />
          </ListGroup.ItemSuffix>
        </ListGroup.Item>
      );
    }
    return (
      <ListGroup.Item accessibilityRole="button" onPress={() => router.push('/paywall')}>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle>Free</ListGroup.ItemTitle>
          <ListGroup.ItemDescription>See Forge Plus</ListGroup.ItemDescription>
        </ListGroup.ItemContent>
        <ListGroup.ItemSuffix />
      </ListGroup.Item>
    );
  }
  if (entitlement.isError && !entitlement.isFetching) {
    return (
      <ListGroup.Item accessibilityRole="button" onPress={() => void entitlement.refetch()}>
        <ListGroup.ItemContent>
          <ListGroup.ItemTitle>{"Couldn't load membership"}</ListGroup.ItemTitle>
          <ListGroup.ItemDescription>Tap to try again</ListGroup.ItemDescription>
        </ListGroup.ItemContent>
        <ListGroup.ItemSuffix>
          <Icon name="refresh-outline" size={20} className="text-muted" />
        </ListGroup.ItemSuffix>
      </ListGroup.Item>
    );
  }
  return (
    <ListGroup.Item accessible accessibilityLabel="Checking membership">
      <ListGroup.ItemContent>
        <SkeletonGroup isLoading isSkeletonOnly className="gap-2">
          <SkeletonGroup.Item className="h-5 w-1/3 rounded-md" />
          <SkeletonGroup.Item className="h-4 w-1/2 rounded-md" />
        </SkeletonGroup>
      </ListGroup.ItemContent>
    </ListGroup.Item>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Typography type="body-xs" color="muted" className="px-1 uppercase tracking-wider">
        {title}
      </Typography>
      {children}
    </View>
  );
}
