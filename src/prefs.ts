import Adw from "gi://Adw";
import Gio from "gi://Gio";
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class DisplayPresetsPreferences extends ExtensionPreferences {
  _settings?: Gio.Settings

  fillPreferencesWindow(window: Adw.PreferencesWindow) {
    this._settings = this.getSettings();

    const page = new Adw.PreferencesPage({
      title: _("General"),
      icon_name: "dialog-information-symbolic",
    });

    const iconGroup = new Adw.PreferencesGroup({
      title: _("Icon"),
      description: _("Configure icon"),
    });
    page.add(iconGroup);

    const showIcon = new Adw.SwitchRow({
      title: _("Show icon"),
      subtitle: _("Show icon on the bar"),
    });
    iconGroup.add(showIcon);

    const displayConfigGroup = new Adw.PreferencesGroup({
      title: _("Display configuration"),
      description: _("Configure display configuration options"),
    });
    page.add(displayConfigGroup);

    const persistentConfig = new Adw.SwitchRow({
      title: _("Persistent configuration"),
      subtitle: _("Persist configuration after applying preset"),
    })
    displayConfigGroup.add(persistentConfig);

    window.add(page)

    this._settings.bind("show-icon", showIcon, "active", Gio.SettingsBindFlags.DEFAULT);
    this._settings.bind("persistent-config", persistentConfig, "active", Gio.SettingsBindFlags.DEFAULT);
  }
}