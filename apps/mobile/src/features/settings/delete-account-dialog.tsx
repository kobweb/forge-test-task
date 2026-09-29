import { Button, Dialog } from 'heroui-native';
import { View } from 'react-native';
import { FormAlert } from '@/components/form-alert';
import { SubmitButton } from '@/components/submit-button';
import { useDeleteAccount } from '@/features/me/api';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function DeleteAccountDialog({ isOpen, onOpenChange }: DeleteAccountDialogProps) {
  // On success the hook signs out: the guard leaves Settings and a toast confirms the deletion.
  const deleteAccount = useDeleteAccount();
  // The dialog stays mounted, so a failed attempt's alert is cleared whenever it closes.
  const handleOpenChange = (open: boolean) => {
    if (!open) deleteAccount.reset();
    onOpenChange(open);
  };
  return (
    <Dialog isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <View className="mb-5 gap-1.5">
            <Dialog.Title>Delete your account?</Dialog.Title>
            <Dialog.Description>
              {
                "This permanently deletes your profile, plan progress, coach history and membership. This can't be undone."
              }
            </Dialog.Description>
          </View>
          {deleteAccount.error ? (
            <View className="mb-4">
              <FormAlert message={deleteAccount.error.message} />
            </View>
          ) : null}
          <View className="gap-3">
            <SubmitButton
              label="Delete everything"
              variant="danger"
              isPending={deleteAccount.isPending}
              onPress={() => deleteAccount.mutate()}
            />
            <Button
              variant="tertiary"
              isDisabled={deleteAccount.isPending}
              onPress={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
