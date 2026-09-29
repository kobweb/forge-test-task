import { Chip, cn, Radio, RadioGroup, Typography } from 'heroui-native';
import { View } from 'react-native';
import type { ProductDisplay } from './products';

export function ProductOption({
  product,
  isSelected,
}: {
  product: ProductDisplay;
  isSelected: boolean;
}) {
  return (
    <RadioGroup.Item
      value={product.id}
      className={cn(
        'rounded-3xl border-2 bg-surface p-4',
        isSelected ? 'border-accent' : 'border-transparent',
      )}
    >
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Typography type="body" weight="semibold">
            {product.label}
          </Typography>
          {product.badge ? (
            <Chip size="sm" color="accent">
              {product.badge}
            </Chip>
          ) : null}
        </View>
        <Typography type="body-sm">{product.price}</Typography>
        {product.note ? (
          <Typography type="body-xs" color="muted">
            {product.note}
          </Typography>
        ) : null}
      </View>
      <Radio />
    </RadioGroup.Item>
  );
}
