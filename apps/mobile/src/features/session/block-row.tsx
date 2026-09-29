import type { SessionBlock } from '@forge/contracts';
import { Checkbox, ControlField, Surface, Typography } from 'heroui-native';
import { View } from 'react-native';
import { Icon } from '@/components/icon';
import { BLOCK_LABELS } from '@/content/labels';

function BlockText({ block, muted }: { block: SessionBlock; muted: boolean }) {
  return (
    <View className="flex-1 gap-0.5">
      <Typography type="body-xs" color="muted" className="uppercase tracking-wider">
        {BLOCK_LABELS[block.kind]}
      </Typography>
      <Typography type="body" weight="semibold" color={muted ? 'muted' : 'default'}>
        {block.title}
      </Typography>
      <Typography type="body-sm" color="muted">
        {block.detail}
      </Typography>
    </View>
  );
}

/** Open session: a tappable checklist row. */
export function CheckableBlockRow({
  block,
  isTicked,
  onToggle,
}: {
  block: SessionBlock;
  isTicked: boolean;
  onToggle: () => void;
}) {
  return (
    <ControlField
      isSelected={isTicked}
      onSelectedChange={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isTicked }}
      className="rounded-3xl bg-surface p-4"
    >
      <BlockText block={block} muted={false} />
      {/* The row is surface-coloured, and so is the primary checkbox's field colour in dark
          (its shadow is transparent there), so the unticked box vanished; `secondary` sits on
          `default`, which differs from surface in both modes. */}
      <ControlField.Indicator>
        <Checkbox variant="secondary" />
      </ControlField.Indicator>
    </ControlField>
  );
}

/** Completed session: every block done, muted. Locked session: a read-only preview. */
export function StaticBlockRow({ block, isDone }: { block: SessionBlock; isDone: boolean }) {
  return (
    <Surface
      variant={isDone ? 'secondary' : 'default'}
      className="flex-row items-center gap-3 shadow-none"
    >
      <BlockText block={block} muted={isDone} />
      {isDone ? <Icon name="checkmark-circle" size={22} className="text-muted" /> : null}
    </Surface>
  );
}
