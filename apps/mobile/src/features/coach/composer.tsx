import { Button, Input } from 'heroui-native';
import { View } from 'react-native';
import { Icon } from '@/components/icon';

interface ComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
}

export function Composer({ value, onChangeText, onSend, isSending }: ComposerProps) {
  const canSend = value.trim().length > 0 && !isSending;
  return (
    <View className="flex-row items-end gap-2 border-t border-separator bg-background px-4 py-3">
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder="Message your coach"
        multiline
        maxLength={500}
        className="max-h-32 flex-1"
        accessibilityLabel="Message"
      />
      <Button isIconOnly onPress={onSend} isDisabled={!canSend} accessibilityLabel="Send message">
        <Icon name="arrow-up" size={20} className="text-accent-foreground" />
      </Button>
    </View>
  );
}
