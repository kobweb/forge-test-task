import { cn, Typography } from 'heroui-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

interface FormScreenProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** True when a native header already sits above the screen. */
  hasHeader?: boolean;
}

/** Scrollable, keyboard-aware form layout: the focused field is never hidden by the keyboard. */
export function FormScreen({
  title,
  subtitle,
  children,
  footer,
  hasHeader = false,
}: FormScreenProps) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      className="flex-1 bg-background"
      contentContainerClassName={cn(
        'grow gap-8 px-6 pb-safe-offset-6',
        hasHeader ? 'pt-6' : 'pt-safe-offset-10',
      )}
    >
      {title ? (
        <View className="gap-2">
          <Typography.Heading type="h2">{title}</Typography.Heading>
          {subtitle ? (
            <Typography type="body" color="muted">
              {subtitle}
            </Typography>
          ) : null}
        </View>
      ) : null}
      <View className="gap-5">{children}</View>
      {footer ? <View className="mt-auto items-center">{footer}</View> : null}
    </KeyboardAwareScrollView>
  );
}
