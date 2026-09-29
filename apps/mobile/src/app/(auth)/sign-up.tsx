import { zodResolver } from '@hookform/resolvers/zod';
import { signupBodySchema, type SignupBody } from '@forge/contracts';
import { router } from 'expo-router';
import { LinkButton } from 'heroui-native';
import { useRef } from 'react';
import type { TextInput } from 'react-native';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { FormAlert } from '@/components/form-alert';
import { FormPasswordField } from '@/components/form-password-field';
import { FormScreen } from '@/components/form-screen';
import { FormTextField } from '@/components/form-text-field';
import { SubmitButton } from '@/components/submit-button';
import { useSignUp } from '@/features/auth/api';

type SignupForm = z.input<typeof signupBodySchema>;

export default function SignUpScreen() {
  const signUp = useSignUp();
  const passwordRef = useRef<TextInput>(null);
  const { control, handleSubmit, setError } = useForm<SignupForm, unknown, SignupBody>({
    resolver: zodResolver(signupBodySchema),
    defaultValues: { email: '', password: '' },
  });
  const submit = handleSubmit((body) =>
    signUp.mutate(body, {
      onError: (error) => {
        // A taken email belongs to the email field, not to a form-level alert.
        if (error.code === 'EMAIL_TAKEN') setError('email', { message: error.message });
      },
    }),
  );
  const formError = signUp.error && signUp.error.code !== 'EMAIL_TAKEN' ? signUp.error : null;

  return (
    <FormScreen
      title="Create your account"
      subtitle="Your plan and progress stay private to you."
      footer={
        <LinkButton onPress={() => router.replace('/sign-in')}>
          Already have an account? Sign in
        </LinkButton>
      }
    >
      {formError ? <FormAlert message={formError.message} /> : null}
      <FormTextField
        control={control}
        name="email"
        label="Email"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <FormPasswordField
        ref={passwordRef}
        control={control}
        name="password"
        label="Password"
        description="At least 8 characters."
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />
      <SubmitButton
        label="Create account"
        isPending={signUp.isPending}
        onPress={() => void submit()}
      />
    </FormScreen>
  );
}
