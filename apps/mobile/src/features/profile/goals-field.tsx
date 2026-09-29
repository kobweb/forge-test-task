import { GOALS, type Goal } from '@forge/contracts';
import * as Haptics from 'expo-haptics';
import { cn, ControlField, Description, FieldError, Label } from 'heroui-native';
import { View } from 'react-native';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { GOAL_LABELS } from '@/content/labels';

interface GoalsFieldProps<TValues extends FieldValues, TOutput> {
  control: Control<TValues, unknown, TOutput>;
  name: FieldPath<TValues>;
}

/** Multi-select goals as tappable cards. The contracts schema requires at least one. */
export function GoalsField<TValues extends FieldValues, TOutput>({
  control,
  name,
}: GoalsFieldProps<TValues, TOutput>) {
  const { field, fieldState } = useController({ control, name });
  const selected: Goal[] = Array.isArray(field.value) ? (field.value as Goal[]) : [];

  const toggle = (goal: Goal) => {
    void Haptics.selectionAsync();
    field.onChange(
      selected.includes(goal) ? selected.filter((item) => item !== goal) : [...selected, goal],
    );
  };

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Label>What are you training for?</Label>
        <Description>Pick as many as you like.</Description>
      </View>
      {GOALS.map((goal) => {
        const isSelected = selected.includes(goal);
        return (
          <ControlField
            key={goal}
            isSelected={isSelected}
            onSelectedChange={() => toggle(goal)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            className={cn(
              'rounded-3xl border-2 bg-surface p-4',
              isSelected ? 'border-accent' : 'border-transparent',
            )}
          >
            <View className="flex-1 gap-0.5">
              <Label>{GOAL_LABELS[goal].title}</Label>
              <Description>{GOAL_LABELS[goal].description}</Description>
            </View>
            <ControlField.Indicator variant="checkbox" />
          </ControlField>
        );
      })}
      <FieldError isInvalid={fieldState.invalid}>{fieldState.error?.message}</FieldError>
    </View>
  );
}
