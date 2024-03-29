import St from "gi://St";
import GObject from "gi://GObject";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import { PopupMenuItem, PopupSeparatorMenuItem, PopupSubMenuMenuItem } from "resource:///org/gnome/shell/ui/popupMenu.js";
import { Preset } from "../presets/presets-config.js";

export class DisplayPresetsIndicator extends PanelMenu.Button {
    _icon: St.Icon;
    _preferencesItem: PopupMenuItem;
    _saveCurrentItem: PopupMenuItem;
    _openConfigFileItem: PopupMenuItem;
    _presetsSubMenu?: PopupSubMenuMenuItem;

    static {
        GObject.registerClass({
            GTypeName: "DisplayPresetsIndicator",
            Signals: {
                "activated": {
                    flags: [GObject.SignalFlags.DETAILED]
                },
                "activated-preset": {
                    flags: [GObject.SignalFlags.DETAILED],
                    param_types: [GObject.TYPE_STRING]
                },
            }
        }, this);
    }

    constructor() {
        super(0, "DisplayPresetsIndicator", false);

        this._icon = new St.Icon({
            icon_name: 'preferences-desktop-display',
            style_class: 'system-status-icon'
        });

        this.add_child(this._icon);

        this._saveCurrentItem = new PopupMenuItem("Save display configuration");
        this._saveCurrentItem.connect("activate", () => this.emit("activated::save-current-config"));

        this._openConfigFileItem = new PopupMenuItem("Open configuration file");
        this._openConfigFileItem.connect("activate", () => this.emit("activated::open-config-file"));

        this._preferencesItem = new PopupMenuItem("Preferences");
        this._preferencesItem.connect("activate", () => this.emit("activated::preferences"));

        this.menu.addMenuItem(new PopupSeparatorMenuItem());
        this.menu.addMenuItem(this._saveCurrentItem);
        this.menu.addMenuItem(this._openConfigFileItem);
        this.menu.addMenuItem(this._preferencesItem);
    }

    updateItems(presets: Preset[]): void {
        if (this._presetsSubMenu) {
            this._presetsSubMenu.destroy();
        }

        this._presetsSubMenu = new PopupSubMenuMenuItem("");
        this._presetsSubMenu.label.set_text("Presets");

        for (const preset of presets) {
            const item = new PopupMenuItem(preset.name);
            item.connect("activate", () => this.emit("activated-preset", preset.name));

            this._presetsSubMenu.menu.addMenuItem(item);
        }

        this.menu.addMenuItem(this._presetsSubMenu, 0);
    }

};

