import { Button, Typography } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { Icon, type IconName } from '@/components/icon';
import { SubmitButton } from '@/components/submit-button';

export interface PermissionStepContent {
  icon: IconName;
  title: string;
  body: string;
  reasons: { icon: IconName; text: string }[];
  primaryLabel: string;
  /** Absent on the tracking step: a screen shown before the ATT alert may offer one action only. */
  secondaryLabel?: string;
}

interface PermissionStepProps extends PermissionStepContent {
  progress: string;
  isPending: boolean;
  onPrimary: () => void;
  onSecondary: () => void;
}

/** One permission ask: what it is, why, and the choice. The same layout for every step. */
export function PermissionStep({
  icon,
  title,
  body,
  reasons,
  primaryLabel,
  secondaryLabel,
  progress,
  isPending,
  onPrimary,
  onSecondary,
}: PermissionStepProps) {
  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="grow justify-center gap-8 px-6 pb-6 pt-safe-offset-6">
        <View className="items-center gap-4">
          <Typography type="body-xs" color="muted" className="uppercase tracking-wider">
            {progress}
          </Typography>
          <View className="size-16 items-center justify-center rounded-full bg-accent-soft">
            <Icon name={icon} size={30} className="text-accent-soft-foreground" />
          </View>
          <View className="items-center gap-2">
            <Typography.Heading type="h3" align="center">
              {title}
            </Typography.Heading>
            <Typography type="body" color="muted" align="center">
              {body}
            </Typography>
          </View>
        </View>
        <View className="gap-3">
          {reasons.map((reason) => (
            <View key={reason.text} className="flex-row items-center gap-3">
              <Icon name={reason.icon} size={20} className="text-accent" />
              <Typography type="body-sm" className="flex-1">
                {reason.text}
              </Typography>
            </View>
          ))}
        </View>
      </ScrollView>
      <View className="gap-3 px-6 pb-safe-offset-4 pt-3">
        <SubmitButton label={primaryLabel} isPending={isPending} onPress={onPrimary} />
        {secondaryLabel ? (
          <Button variant="tertiary" isDisabled={isPending} onPress={onSecondary}>
            {secondaryLabel}
          </Button>
        ) : null}
      </View>
    </View>
  );
}
