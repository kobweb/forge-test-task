import { zodResolver } from '@hookform/resolvers/zod';
import { loginBodySchema, type LoginBody } from '@forge/contracts';
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
import { useSignIn } from '@/features/auth/api';

type LoginForm = z.input<typeof loginBodySchema>;

export default function SignInScreen() {
  const signIn = useSignIn();
  const passwordRef = useRef<TextInput>(null);
  const { control, handleSubmit } = useForm<LoginForm, unknown, LoginBody>({
    resolver: zodResolver(loginBodySchema),
    defaultValues: { email: '', password: '' },
  });
  const submit = handleSubmit((body) => signIn.mutate(body));

  return (
    <FormScreen
      title="Forge"
      subtitle="Three sessions. Unlocked in order."
      footer={
        <LinkButton onPress={() => router.replace('/sign-up')}>
          New here? Create an account
        </LinkButton>
      }
    >
      {signIn.error ? <FormAlert message={signIn.error.message} /> : null}
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
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />
      <SubmitButton label="Sign in" isPending={signIn.isPending} onPress={() => void submit()} />
    </FormScreen>
  );
}
