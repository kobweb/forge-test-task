import { zodResolver } from '@hookform/resolvers/zod';
import { onboardingBodySchema } from '@forge/contracts';
import { router } from 'expo-router';
import { useToast } from 'heroui-native';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { FormAlert } from '@/components/form-alert';
import { FormScreen } from '@/components/form-screen';
import { FormTextField } from '@/components/form-text-field';
import { SubmitButton } from '@/components/submit-button';
import { useMe, useUpdateMe } from '@/features/me/api';
import { GoalsField } from '@/features/profile/goals-field';

// Same rules as onboarding, minus consent (which is given once).
const profileSchema = onboardingBodySchema.pick({ displayName: true, goals: true });
type ProfileForm = z.input<typeof profileSchema>;
type ProfileBody = z.output<typeof profileSchema>;

export default function ProfileScreen() {
  const me = useMe();
  const updateMe = useUpdateMe();
  const { toast } = useToast();
  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = useForm<ProfileForm, unknown, ProfileBody>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: me.data?.displayName ?? '', goals: me.data?.goals ?? [] },
  });
  const submit = handleSubmit((body) =>
    updateMe.mutate(body, {
      onSuccess: () => {
        toast.show({ variant: 'success', label: 'Profile updated' });
        router.back();
      },
    }),
  );

  return (
    <FormScreen hasHeader>
      {updateMe.error ? <FormAlert message={updateMe.error.message} /> : null}
      <FormTextField
        control={control}
        name="displayName"
        label="Name"
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="done"
      />
      <GoalsField control={control} name="goals" />
      <SubmitButton
        label="Save changes"
        isDisabled={!isDirty}
        isPending={updateMe.isPending}
        onPress={() => void submit()}
      />
    </FormScreen>
  );
}
