// textPosition
// Offers helper math for converting string offsets to positions.

import { Position } from '../adapters/types';
import { getPlatform } from '../adapters/platform';

export const getPositionAt = (text: string, index: number): Position => {
  const lines = text.substring(0, index).split('\n');
  const line = lines.length - 1;
  const character = lines[line].length;
  const platform = getPlatform();
  return new platform.Position(line, character);
};