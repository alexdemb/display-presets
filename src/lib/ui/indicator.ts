import St from "gi://St";
import GObject from "gi://GObject";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import { PopupMenuItem, PopupSeparatorMenuItem, PopupSubMenuMenuItem } from "resource:///org/gnome/shell/ui/popupMenu.js";
import { Preset } from "../presets/presets-config.js";

export class DisplayPresetsIndicator extends PanelMenu.Button {
    _icon: St.Icon;
    _preferencesItem: PopupMenuItem;
    _saveCurrentItem: PopupMenuItem;
    _presetsSubMenu: PopupSubMenuMenuItem;

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

        this._presetsSubMenu = new PopupSubMenuMenuItem("");
        this._presetsSubMenu.label.set_text("Presets");

        this._saveCurrentItem = new PopupMenuItem("Save display configuration");
        this._saveCurrentItem.connect("activate", () => this.emit("activated::save-current-config"));

        this._preferencesItem = new PopupMenuItem("Preferences");
        this._preferencesItem.connect("activate", () => this.emit("activated::preferences"));
    }

    updateItems(presets: Preset[]): void {
        this._presetsSubMenu.menu.removeAll();

        for (const preset of presets) {
            const item = new PopupMenuItem(preset.name);
            item.connect("activate", () => this.emit("activated-preset", preset.name));

            this._presetsSubMenu.menu.addMenuItem(item);
        }

        this.menu.addMenuItem(this._presetsSubMenu);
        this.menu.addMenuItem(new PopupSeparatorMenuItem());
        this.menu.addMenuItem(this._saveCurrentItem);
        this.menu.addMenuItem(this._preferencesItem);
    }

};

