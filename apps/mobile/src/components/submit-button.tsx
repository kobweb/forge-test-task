import { Button, Spinner, useThemeColor } from 'heroui-native';

interface SubmitButtonProps {
  label: string;
  onPress: () => void;
  isPending?: boolean;
  isDisabled?: boolean;
  variant?: 'primary' | 'danger';
}

/** The screen's primary action. While pending it shows a spinner and ignores further presses. */
export function SubmitButton({
  label,
  onPress,
  isPending = false,
  isDisabled = false,
  variant = 'primary',
}: SubmitButtonProps) {
  const spinnerColor = useThemeColor(
    variant === 'danger' ? 'danger-foreground' : 'accent-foreground',
  );
  return (
    <Button
      size="lg"
      variant={variant}
      isDisabled={isDisabled}
      onPress={isPending ? undefined : onPress}
      accessibilityState={{ busy: isPending, disabled: isDisabled }}
    >
      {isPending ? (
        <Spinner size="sm" color={spinnerColor} />
      ) : (
        <Button.Label>{label}</Button.Label>
      )}
    </Button>
  );
}
