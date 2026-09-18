import { Plugin } from 'obsidian';

/** Stage 0 deliberately registers no product UI or workspace/file listeners.
 * Runtime feasibility probes live under scripts/, never in the release bundle.
 * Loading/unloading this foundation must leave workspace and user data intact.
 */
export default class MDPalettePlugin extends Plugin {
  async onload(): Promise<void> {
    // Space and sidebar functionality begins with the next approved stage.
  }
}
