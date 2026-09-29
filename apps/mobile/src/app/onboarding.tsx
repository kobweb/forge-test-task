import { zodResolver } from '@hookform/resolvers/zod';
import { onboardingBodySchema, type OnboardingBody } from '@forge/contracts';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { FormAlert } from '@/components/form-alert';
import { FormScreen } from '@/components/form-screen';
import { FormTextField } from '@/components/form-text-field';
import { SubmitButton } from '@/components/submit-button';
import { useUpdateMe } from '@/features/me/api';
import { ConsentField } from '@/features/profile/consent-field';
import { GoalsField } from '@/features/profile/goals-field';

type OnboardingForm = z.input<typeof onboardingBodySchema>;

export default function OnboardingScreen() {
  const updateMe = useUpdateMe();
  const { control, handleSubmit } = useForm<OnboardingForm, unknown, OnboardingBody>({
    resolver: zodResolver(onboardingBodySchema),
    defaultValues: { displayName: '', goals: [], acceptConsent: false },
  });
  // On success the cached profile says onboarded, and the route guard moves on to the plan.
  const submit = handleSubmit((body) => updateMe.mutate(body));

  return (
    <FormScreen title="Make it yours" subtitle="Three quick things before your first session.">
      {updateMe.error ? <FormAlert message={updateMe.error.message} /> : null}
      <FormTextField
        control={control}
        name="displayName"
        label="What should we call you?"
        placeholder="Your first name"
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="done"
      />
      <GoalsField control={control} name="goals" />
      <ConsentField control={control} name="acceptConsent" />
      <SubmitButton
        label="Start training"
        isPending={updateMe.isPending}
        onPress={() => void submit()}
      />
    </FormScreen>
  );
}
