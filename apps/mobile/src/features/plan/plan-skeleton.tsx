import { SkeletonGroup } from 'heroui-native';
import { View } from 'react-native';

export function PlanSkeleton() {
  return (
    <View className="flex-1 bg-background px-5 pt-safe-offset-4">
      <SkeletonGroup isLoading isSkeletonOnly className="gap-4">
        <SkeletonGroup.Item className="h-8 w-3/4 rounded-lg" />
        <SkeletonGroup.Item className="h-6 w-1/2 rounded-lg" />
        <SkeletonGroup.Item className="h-2 w-full rounded-full" />
        <SkeletonGroup.Item className="mt-4 h-32 w-full rounded-3xl" />
        <SkeletonGroup.Item className="h-32 w-full rounded-3xl" />
        <SkeletonGroup.Item className="h-32 w-full rounded-3xl" />
      </SkeletonGroup>
    </View>
  );
}
