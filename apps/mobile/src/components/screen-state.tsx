import { Button, Typography } from 'heroui-native';
import { View } from 'react-native';
import { Icon, type IconName } from './icon';

interface ScreenStateProps {
  icon: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Full-screen empty / error / not-found state with at most one action. */
export function ScreenState({ icon, title, body, actionLabel, onAction }: ScreenStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-5 bg-background px-8">
      <View className="size-14 items-center justify-center rounded-full bg-accent-soft">
        <Icon name={icon} size={26} className="text-accent-soft-foreground" />
      </View>
      <View className="items-center gap-1.5">
        <Typography type="h5" align="center">
          {title}
        </Typography>
        {body ? (
          <Typography type="body-sm" color="muted" align="center">
            {body}
          </Typography>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Button variant="secondary" onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
