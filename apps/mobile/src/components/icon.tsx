import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { withUniwind } from 'uniwind';

/** Ionicons that take their colour from a className token, e.g. `className="text-muted"`. */
export const Icon = withUniwind(Ionicons);

export type IconName = ComponentProps<typeof Ionicons>['name'];
