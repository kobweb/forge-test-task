import * as Haptics from 'expo-haptics';
import { Avatar, Chip, SkeletonGroup, Typography } from 'heroui-native';
import { useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { FormAlert } from '@/components/form-alert';
import { Icon } from '@/components/icon';
import { ScreenState } from '@/components/screen-state';
import { SUGGESTED_PROMPTS } from '@/content/labels';
import { useMe } from '@/features/me/api';
import { useCoachMessages, useSendCoachMessage } from './api';
import { Composer } from './composer';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';

export function CoachChat() {
  const me = useMe();
  const history = useCoachMessages();
  const send = useSendCoachMessage();
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    setSendError(null);
    setDraft('');
    send.mutate(trimmed, {
      onError: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Restore the failed text unless the user has already typed something new meanwhile.
        setDraft((current) => (current.trim() ? current : trimmed));
        setSendError('Message not sent. Check your connection and try again.');
      },
    });
  };

  if (history.isPending) return <ChatSkeleton />;
  if (!history.data) {
    return (
      <ScreenState
        icon="cloud-offline-outline"
        title="Can't load your conversation"
        body="Check your connection and try again."
        actionLabel="Try again"
        onAction={() => void history.refetch()}
        isActionPending={history.isFetching}
      />
    );
  }

  const messages = history.data;
  const newestFirst = [...messages].reverse();

  return (
    <View className="flex-1 bg-background pt-safe">
      <View className="gap-0.5 border-b border-separator px-5 pb-3 pt-2">
        <Typography.Heading type="h4">Coach</Typography.Heading>
        <Typography type="body-sm" color="muted">
          Knows your goals and where you are in the plan.
        </Typography>
      </View>
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        {messages.length === 0 ? (
          <EmptyConversation name={me.data?.displayName ?? 'there'} onPick={submit} />
        ) : (
          <FlatList
            inverted
            data={newestFirst}
            keyExtractor={(message) => message.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            ListHeaderComponent={send.isPending ? <TypingIndicator /> : null}
            contentContainerClassName="gap-3 px-5 py-4"
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          />
        )}
        {sendError ? (
          <View className="px-5 pb-3">
            <FormAlert message={sendError} />
          </View>
        ) : null}
        <Composer
          value={draft}
          onChangeText={setDraft}
          onSend={() => submit(draft)}
          isSending={send.isPending}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

function EmptyConversation({ name, onPick }: { name: string; onPick: (prompt: string) => void }) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="grow justify-center gap-6 px-6 py-8"
      keyboardShouldPersistTaps="handled"
    >
      <View className="items-center gap-3">
        <Avatar size="lg" variant="soft" alt="Forge coach">
          <Avatar.Fallback>
            <Icon name="sparkles" size={24} className="text-accent" />
          </Avatar.Fallback>
        </Avatar>
        <Typography type="h5" align="center">
          {`Hi ${name}, I'm your Forge coach.`}
        </Typography>
        <Typography type="body-sm" color="muted" align="center">
          Ask me anything about your plan.
        </Typography>
      </View>
      <View className="flex-row flex-wrap justify-center gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <Chip
            key={prompt}
            variant="secondary"
            color="default"
            accessibilityRole="button"
            onPress={() => onPick(prompt)}
          >
            {prompt}
          </Chip>
        ))}
      </View>
    </ScrollView>
  );
}

export function ChatSkeleton() {
  return (
    <View className="flex-1 bg-background px-5 pt-safe-offset-4">
      <SkeletonGroup isLoading isSkeletonOnly className="gap-4">
        <SkeletonGroup.Item className="h-7 w-1/3 rounded-lg" />
        <SkeletonGroup.Item className="h-14 w-3/4 self-end rounded-3xl" />
        <SkeletonGroup.Item className="h-20 w-4/5 rounded-3xl" />
        <SkeletonGroup.Item className="h-14 w-2/3 self-end rounded-3xl" />
      </SkeletonGroup>
    </View>
  );
}
