import St from 'gi://St';
import GObject from "gi://GObject";
import { ModalDialog } from "resource:///org/gnome/shell/ui/modalDialog.js";
import Clutter from 'gi://Clutter';

export class SaveCurrentDialog extends ModalDialog {
    _input?: St.Entry;
    _presetName: string = "";

    static {
        GObject.registerClass({
            GTypeName: "SaveCurrentDialog",
            Properties: {
                "presetName": GObject.ParamSpec.string(
                    "presetName", 
                    "Preset Name", 
                    "A name of preset to save", 
                    GObject.ParamFlags.READWRITE, 
                    null)
            },
            Signals: {
                "confirmed": {}
            }
        }, this);
    }

    constructor() {
        super({destroyOnClose: true});

        this.setButtons([
            {
                label: "OK",
                action: this._onConfirm.bind(this),
                isDefault: true,
                key: Clutter.KEY_Return
            },
            {
                label: "Cancel",
                action: this._onCancel.bind(this),
                key: Clutter.KEY_Escape
            }
        ]);

        
        const box = new St.BoxLayout({ vertical: true });

        this._input = new St.Entry();
        this._input.bind_property("text", this, "presetName", GObject.BindingFlags.BIDIRECTIONAL);

        box.add_child(new St.Label({text: "Preset Name:"}));
        box.add_child(this._input);
        
        this.contentLayout.add_child(box);
    }

    _isPresetNameValid(): boolean {
        return this.presetName.length > 0;
    }

    _onConfirm() {
        if (this._isPresetNameValid()) {
            this.close(global.get_current_time());
            this.emit("confirmed");
        }
    }

    _onCancel() {
        this.destroy();
    }

    get presetName() {
        return this._presetName;
    }

    set presetName(value: string) {
        if (this._presetName === value) 
            return;

        this._presetName = value;
        this.notify("presetName");
    }
}