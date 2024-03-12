import Gio from "gi://Gio";
import GLib from "gi://GLib";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { DisplayPresetsIndicator } from "./lib/ui/indicator.js";
import { SaveCurrentDialog } from "./lib/ui/save-current-dialog.js";
import { DisplayConfig, initDbusProxy } from "./lib/dbus/display-config.js";
import { loadPresetsConfig, savePresetsConfig, Preset } from "./lib/presets/presets-config.js";
import * as DBusService from "./lib/dbus/service.js";

export default class DisplayPresetsExtension extends Extension {
  gsettings?: Gio.Settings;
  indicator?: DisplayPresetsIndicator;
  displayConfig?: DisplayConfig;
  dbusOwnerId?: number;
  showIconCallbackId? : number;

  async enable() {
    this.gsettings = this.getSettings();

    const dbusProxy = await initDbusProxy();
    this.displayConfig = new DisplayConfig(dbusProxy, this.gsettings);

    this.dbusOwnerId = DBusService.start(this.displayConfig);

    this.showIconCallbackId = this.gsettings.connect("changed::show-icon", () => {
      this._refreshIndicator();
    });
    
    this._refreshIndicator();
  }

  _refreshIndicator() {
    this._toggleIndicator(this.gsettings?.get_boolean("show-icon") ?? false);
  }

  _toggleIndicator(enabled: boolean) {
    if (enabled) {
      this._enableIndicator();
    } else {
      this._disableIndicator();
    }
  }

  async _enableIndicator() {
    this.indicator = new DisplayPresetsIndicator();
    this.indicator.connect("activated::preferences", () => this.openPreferences());
    this.indicator.connect("activated::save-current-config", () => this._onSaveCurrentConfig());
    this.indicator.connect("activated::open-config-file", () => this._onOpenConfigFile());
    this.indicator.connect("activated-preset", (_, name) => this._activatePreset(name));

    Main.panel.addToStatusArea(this.uuid, this.indicator);

    try {
      const presets = await loadPresetsConfig()
      this.indicator?.updateItems(presets);
    } catch (e) {
      console.log(`Error loading presets config: ${e}`)
    }
  }

  _disableIndicator() {
    if (this.indicator) {
      this.indicator.destroy();
    }
  }

  async _onSaveCurrentConfig() {
    const presets = await loadPresetsConfig();
    const dialog = new SaveCurrentDialog(presets);

    if (dialog.open(global.get_current_time(), true)) {
      dialog.connect("confirmed", () => this._saveCurrentConfig(dialog.presetName));
    }
  }

  async _onOpenConfigFile() {
    try {
      console.log("Opening configuration file")
      Gio.Subprocess.new(["xdg-open", `${GLib.getenv("HOME")}/.config/display-presets.json`], Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
    } catch (e) {
      logError(e);
    }
  }

  _findPreset(presets: Preset[], name: string): Preset | undefined {
    return presets.find(p => p.name === name);
  }

  async _activatePreset(presetName: string) {
    const presets = await loadPresetsConfig();
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
    
    const presets = await loadPresetsConfig();
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
    if (this.showIconCallbackId) {
      this.gsettings?.disconnect(this.showIconCallbackId);
    }

    this._disableIndicator();

    if (this.dbusOwnerId) {
      DBusService.stop(this.dbusOwnerId);
      this.dbusOwnerId = undefined;
    }
  
    this.gsettings = undefined;
    this.indicator = undefined;
    this.displayConfig = undefined;

  }
}
