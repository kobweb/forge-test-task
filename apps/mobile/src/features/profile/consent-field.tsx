import { Checkbox, ControlField, FieldError, Typography } from 'heroui-native';
import { View } from 'react-native';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

interface ConsentFieldProps<TValues extends FieldValues, TOutput> {
  control: Control<TValues, unknown, TOutput>;
  name: FieldPath<TValues>;
}

export function ConsentField<TValues extends FieldValues, TOutput>({
  control,
  name,
}: ConsentFieldProps<TValues, TOutput>) {
  const { field, fieldState } = useController({ control, name });
  const isSelected = field.value === true;
  return (
    <View className="gap-1.5">
      <ControlField
        isSelected={isSelected}
        onSelectedChange={field.onChange}
        isInvalid={fieldState.invalid}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        className="items-start"
      >
        {/* The same box as the goal cards above it, so onboarding shows one checkbox look. */}
        <ControlField.Indicator>
          <Checkbox variant="secondary" />
        </ControlField.Indicator>
        <Typography type="body-sm" className="flex-1">
          I agree that Forge stores my profile, progress and coach messages to personalise my
          training. I can delete all of it in Settings.
        </Typography>
      </ControlField>
      <FieldError isInvalid={fieldState.invalid}>{fieldState.error?.message}</FieldError>
    </View>
  );
}
