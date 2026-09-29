import { Alert } from 'heroui-native';

/** A form-level error that belongs to no single field. */
export function FormAlert({ message }: { message: string }) {
  return (
    <Alert status="danger">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{message}</Alert.Title>
      </Alert.Content>
    </Alert>
  );
}
