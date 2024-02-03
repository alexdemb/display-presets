import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import St from 'gi://St';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

export default class DisplayPresetsExtension extends Extension {
  gsettings?: Gio.Settings;
  showIcon: boolean = true;
  indicator?: PanelMenu.Button;

  enable() {
    this.gsettings = this.getSettings();
    this.showIcon = this.gsettings.get_boolean('show-icon') ?? true;

    this.indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
    
    const icon = new St.Icon({
      icon_name: 'preferences-desktop-display',
      style_class: 'system-status-icon'
    });
    this.indicator.add_child(icon);

    Main.panel.addToStatusArea(this.uuid, this.indicator);
  }

  disable() {
    this.gsettings = undefined;
  }
}
