import { router } from 'expo-router';
import { Typography } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { Icon } from '@/components/icon';
import { SubmitButton } from '@/components/submit-button';
import { COACH_BENEFITS } from '@/content/labels';

/** What a free user sees on the Coach tab: what Plus unlocks, and one way in. */
export function CoachTeaser() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow justify-center gap-8 px-6 py-safe-offset-6"
    >
      <View className="items-center gap-4">
        <View className="size-16 items-center justify-center rounded-full bg-accent-soft">
          <Icon name="sparkles" size={30} className="text-accent-soft-foreground" />
        </View>
        <View className="items-center gap-2">
          <Typography.Heading type="h3" align="center">
            Meet your coach
          </Typography.Heading>
          <Typography type="body" color="muted" align="center">
            Ask about your next session, warm-ups or fitting training into a busy day. Your coach
            knows your goals and your progress.
          </Typography>
        </View>
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
      <SubmitButton label="Unlock Coach" onPress={() => router.push('/paywall')} />
    </ScrollView>
  );
}
