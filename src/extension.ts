import Gio from "gi://Gio";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { DisplayPresetsIndicator } from "./lib/ui/indicator.js";
import { SaveCurrentDialog } from "./lib/ui/save-current-dialog.js";
import { DisplayConfig } from "./lib/dbus/display-config.js";
import { loadPresetsConfig, savePresetsConfig, Preset } from "./lib/presets/presets-config.js";
import * as DBusService from "./lib/dbus/service.js";

export default class DisplayPresetsExtension extends Extension {
  gsettings?: Gio.Settings;
  indicator?: DisplayPresetsIndicator;
  displayConfig?: DisplayConfig;
  dbusOwnerId?: number;

  enable() {
    this.gsettings = this.getSettings();
    this.displayConfig = new DisplayConfig();

    const presets = loadPresetsConfig();

    this.indicator = new DisplayPresetsIndicator();
    this.indicator.connect("activated::preferences", () => this.openPreferences());
    this.indicator.connect("activated::save-current-config", () => this._onSaveCurrentConfig());
    this.indicator.connect("activated-preset", (_, name) => this._activatePreset(name));
    this.indicator.updateItems(presets);

    Main.panel.addToStatusArea(this.uuid, this.indicator);
    this.dbusOwnerId = DBusService.start(this.displayConfig);
  }

  _onSaveCurrentConfig() {
    const dialog = new SaveCurrentDialog();

    if (dialog.open(global.get_current_time(), true)) {
      dialog.connect("confirmed", () => this._saveCurrentConfig(dialog.presetName));
    }
  }

  _findPreset(presets: Preset[], name: string): Preset | undefined {
    return presets.find(p => p.name === name);
  }

  async _activatePreset(presetName: string) {
    const presets = loadPresetsConfig();
    const preset = this._findPreset(presets, presetName);

    console.log(`Activating preset: ${preset?.name}`);

    if (preset) {
      const currentState = await this.displayConfig?.getCurrentState();

      if (currentState) {
        try {
          await this.displayConfig?.applyMonitorsConfig(currentState.serial, preset.name, preset.configuration);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  async _saveCurrentConfig(presetName: string) {
    console.log(`Saving current preset with name '${presetName}'`);
    
    const presets = loadPresetsConfig();
    const config = await this.displayConfig?.getCurrentState();

    if (config) {
      const existingPreset = this._findPreset(presets, presetName);

      if (existingPreset) {
        existingPreset.configuration = config;
      } else {
        presets.push({ name: presetName, configuration: config });
      }

      savePresetsConfig(presets);
      this.indicator?.updateItems(presets);
    }

  }

  disable() {
    if (this.dbusOwnerId) {
      DBusService.stop(this.dbusOwnerId);
      this.dbusOwnerId = undefined;
    }
  
    this.gsettings = undefined;
    this.indicator = undefined;
    this.displayConfig = undefined;

  }
}
