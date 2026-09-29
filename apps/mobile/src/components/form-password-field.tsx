import {
  Description,
  FieldError,
  InputGroup,
  Label,
  TextField,
  type InputProps,
} from 'heroui-native';
import { useState, type Ref } from 'react';
import { Pressable, type TextInput } from 'react-native';
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Icon } from './icon';

interface FormPasswordFieldProps<TValues extends FieldValues, TOutput> extends Omit<
  InputProps,
  'value' | 'onChangeText' | 'onBlur' | 'secureTextEntry' | 'ref'
> {
  control: Control<TValues, unknown, TOutput>;
  name: FieldPath<TValues>;
  label: string;
  description?: string;
  ref?: Ref<TextInput>;
}

/** Password input with a show/hide toggle, bound to react-hook-form. */
export function FormPasswordField<TValues extends FieldValues, TOutput>({
  control,
  name,
  label,
  description,
  ref,
  ...inputProps
}: FormPasswordFieldProps<TValues, TOutput>) {
  const {
    field: { value, onChange, onBlur },
    fieldState,
  } = useController({ control, name });
  const [isVisible, setIsVisible] = useState(false);
  return (
    <TextField isInvalid={fieldState.invalid}>
      <Label>{label}</Label>
      <InputGroup>
        <InputGroup.Input
          ref={ref}
          value={String(value ?? '')}
          onChangeText={onChange}
          onBlur={onBlur}
          secureTextEntry={!isVisible}
          autoCapitalize="none"
          autoCorrect={false}
          {...inputProps}
        />
        <InputGroup.Suffix>
          <Pressable
            onPress={() => setIsVisible((visible) => !visible)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
          >
            <Icon
              name={isVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              className="text-muted"
            />
          </Pressable>
        </InputGroup.Suffix>
      </InputGroup>
      {description ? <Description hideOnInvalid>{description}</Description> : null}
      <FieldError>{fieldState.error?.message}</FieldError>
    </TextField>
  );
}
