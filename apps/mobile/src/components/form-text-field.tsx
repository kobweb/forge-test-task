import { Description, FieldError, Input, Label, TextField, type InputProps } from 'heroui-native';
import type { Ref } from 'react';
import type { TextInput } from 'react-native';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

interface FormTextFieldProps<TValues extends FieldValues, TOutput> extends Omit<
  InputProps,
  'value' | 'onChangeText' | 'onBlur' | 'ref'
> {
  control: Control<TValues, unknown, TOutput>;
  name: FieldPath<TValues>;
  label: string;
  description?: string;
  ref?: Ref<TextInput>;
}

/** A labelled text input bound to react-hook-form, with its error shown inline. */
export function FormTextField<TValues extends FieldValues, TOutput>({
  control,
  name,
  label,
  description,
  ref,
  ...inputProps
}: FormTextFieldProps<TValues, TOutput>) {
  const {
    field: { value, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  return (
    <TextField isInvalid={fieldState.invalid}>
      <Label>{label}</Label>
      <Input
        ref={ref}
        value={String(value ?? '')}
        onChangeText={onChange}
        onBlur={onBlur}
        {...inputProps}
      />
      {description ? <Description hideOnInvalid>{description}</Description> : null}
      <FieldError>{fieldState.error?.message}</FieldError>
    </TextField>
  );
}
