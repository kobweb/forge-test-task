import { SkeletonGroup } from 'heroui-native';
import { View } from 'react-native';

export function SettingsSkeleton() {
  return (
    <View className="flex-1 bg-background px-5 pt-safe-offset-4">
      <SkeletonGroup isLoading isSkeletonOnly className="gap-4">
        <SkeletonGroup.Item className="h-9 w-1/3 rounded-lg" />
        <SkeletonGroup.Item className="h-20 w-full rounded-3xl" />
        <SkeletonGroup.Item className="h-32 w-full rounded-3xl" />
        <SkeletonGroup.Item className="h-16 w-full rounded-3xl" />
      </SkeletonGroup>
    </View>
  );
}
