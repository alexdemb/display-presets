import St from 'gi://St';
import GObject from "gi://GObject";
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import { PopupMenuItem, PopupSeparatorMenuItem } from 'resource:///org/gnome/shell/ui/popupMenu.js';

export class DisplayPresetsIndicator extends PanelMenu.Button {
    _icon: St.Icon;
    _preferencesItem: PopupMenuItem;
    _saveCurrentItem: PopupMenuItem;

    static {
        GObject.registerClass({
            GTypeName: "DisplayPresetsIndicator",
            Signals: {
                "activated": {
                    flags: [GObject.SignalFlags.DETAILED]
                }
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

        this._saveCurrentItem = new PopupMenuItem("Save current config");
        this._saveCurrentItem.connect("activate", () => this.emit("activated::save-current-config"));

        this._preferencesItem = new PopupMenuItem("Preferences");
        this._preferencesItem.connect("activate", () => this.emit("activated::preferences"));

        this.menu.addMenuItem(new PopupSeparatorMenuItem());
        this.menu.addMenuItem(this._saveCurrentItem);
        this.menu.addMenuItem(this._preferencesItem);
    }

};

