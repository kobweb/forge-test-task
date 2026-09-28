import { Button, Card, Typography } from 'heroui-native';
import { View } from 'react-native';

// Plan 0 placeholder: proves Uniwind + HeroUI Native render in Expo Go, in light and dark.
// Plan B, Task B1 deletes it.
export default function Placeholder() {
  return (
    <View className="flex-1 justify-center gap-4 bg-background px-6">
      <Typography.Heading type="h1">Forge</Typography.Heading>
      <Card>
        <Card.Body>
          <Card.Title>Scaffold ready</Card.Title>
          <Card.Description>HeroUI Native and Uniwind are wired up.</Card.Description>
        </Card.Body>
        <Card.Footer>
          <Button onPress={() => {}}>Looks good</Button>
        </Card.Footer>
      </Card>
    </View>
  );
}
