import type { ControlsThemeId } from '../shared/theme-preferences';
import type { PopupContext } from './popup-context';
import { setSelectedTheme } from './set-selected-theme';
import { writeStoredThemeId } from './write-stored-theme-id';

export async function selectTheme(context: PopupContext, themeId: ControlsThemeId): Promise<void> {
  setSelectedTheme(context, themeId);
  await writeStoredThemeId(themeId);
}
