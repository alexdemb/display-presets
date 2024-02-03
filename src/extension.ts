import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { DisplayPresetsIndicator } from './lib/ui/indicator.js';
import { SaveCurrentDialog } from './lib/ui/save-current-dialog.js';

export default class DisplayPresetsExtension extends Extension {
  gsettings?: Gio.Settings;
  indicator?: DisplayPresetsIndicator;

  enable() {
    this.gsettings = this.getSettings();
    this.indicator = new DisplayPresetsIndicator();
    this.indicator.connect("activated::preferences", () => this.openPreferences());
    this.indicator.connect("activated::save-current-config", () => this._onSaveCurrentConfig());

    Main.panel.addToStatusArea(this.uuid, this.indicator);
  }

  _onSaveCurrentConfig() {
    const dialog = new SaveCurrentDialog();
    if (dialog.open(global.get_current_time(), true)) {
      dialog.connect("confirmed", () => this._saveCurrentConfig(dialog.presetName));
    }
  }

  _saveCurrentConfig(presetName: string) {
    // TODO: implement
    console.log(`Saving current preset with name '${presetName}'`);
  }

  disable() {
    this.gsettings = undefined;
    this.indicator = undefined;
  }
}
