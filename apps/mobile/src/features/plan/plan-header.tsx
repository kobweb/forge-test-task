import type { Goal } from '@forge/contracts';
import { Chip, cn, Typography } from 'heroui-native';
import { View } from 'react-native';
import { GOAL_LABELS } from '@/content/labels';
import { greeting } from '@/lib/format';

interface PlanHeaderProps {
  displayName: string;
  goals: Goal[];
  completedCount: number;
  totalCount: number;
}

export function PlanHeader({ displayName, goals, completedCount, totalCount }: PlanHeaderProps) {
  return (
    <View className="gap-5">
      <View className="gap-3">
        <Typography.Heading type="h3" numberOfLines={2}>
          {`${greeting(new Date())}, ${displayName}`}
        </Typography.Heading>
        <View className="flex-row flex-wrap gap-2">
          {goals.map((goal) => (
            <Chip key={goal} size="sm" variant="soft">
              {GOAL_LABELS[goal].title}
            </Chip>
          ))}
        </View>
      </View>
      <View className="gap-2">
        <Typography type="body-sm" color="muted">
          {`${completedCount} of ${totalCount} complete`}
        </Typography>
        <View
          accessible
          className="flex-row gap-1.5"
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: totalCount, now: completedCount }}
        >
          {Array.from({ length: totalCount }, (_, index) => (
            <View
              key={index}
              className={cn(
                'h-1.5 flex-1 rounded-full',
                index < completedCount ? 'bg-accent' : 'bg-default',
              )}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
