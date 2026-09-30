import { cn, Typography } from 'heroui-native';
import { useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';

interface FormScreenProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** True when a native header already sits above the screen. */
  hasHeader?: boolean;
}

// Helper line + gap + 56 pt submit button below the focused field's caret, plus a 24 pt margin.
const KEYBOARD_BOTTOM_OFFSET = 144;

/**
 * Scrollable, keyboard-aware form layout: the focused field is never hidden by the keyboard.
 *
 * A FormAlert, an inline error or anything else whose appearance moves the focused field must
 * render inside `children`: the fields container's `onLayout` is what re-runs
 * `assureFocusedInputVisible()`, and content placed in `footer` or beside the title is not
 * watched.
 */
export function FormScreen({
  title,
  subtitle,
  children,
  footer,
  hasHeader = false,
}: FormScreenProps) {
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  return (
    <KeyboardAwareScrollView
      ref={scrollRef}
      bottomOffset={KEYBOARD_BOTTOM_OFFSET}
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
      {/* A form Alert or an inline error re-lays out the fields under an open keyboard. */}
      <View className="gap-5" onLayout={() => scrollRef.current?.assureFocusedInputVisible()}>
        {children}
      </View>
      {footer ? <View className="mt-auto items-center">{footer}</View> : null}
    </KeyboardAwareScrollView>
  );
}
