import St from 'gi://St';
import GObject from "gi://GObject";
import { ModalDialog } from "resource:///org/gnome/shell/ui/modalDialog.js";
import Clutter from 'gi://Clutter';
import { Preset } from '../presets/presets-config.js';

export class SaveCurrentDialog extends ModalDialog {
    _input?: St.Entry;
    _presetNameLabel?: St.Label;
    _validationLabel?: St.Label;
    _presetName: string = "";

    static readonly SYMBOL_INVALID: string = "✗";

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

    constructor(presets: Preset[]) {
        super({ destroyOnClose: true, shouldFadeIn: true, shouldFadeOut: true });
        
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

        this._input = new St.Entry({ canFocus: true, style_class: "preset-name-input" });
        this._input.minWidth = 350;
        this._input.set_margin_top(12);
        this._input.bind_property("text", this, "presetName", GObject.BindingFlags.BIDIRECTIONAL);
        this._input.connect("notify::text", (e) => this._onInputTextChanged());

        this._presetNameLabel = new St.Label({text: "Preset Name:", style_class: "preset-name-label" });
        this._validationLabel = new St.Label({height: 16, style_class: "preset-validation-label"});
        
        box.add_child(this._presetNameLabel);
        box.add_child(this._input);
        box.add_child(this._validationLabel);
        
        presets.forEach(p => {
            let button = new St.Button({label: p.name, style_class: "preset-existing-item", x_align: Clutter.ActorAlign.START});
            button.connect("clicked", () => {
                this._input?.set_text(p.name);
            });
            box.add_child(button);
        });
        
        this.contentLayout.add_child(box);

        this.setInitialKeyFocus(this._input);
        this._updateValidation();
    }

    _onInputTextChanged() {
        this._updateValidation();
    }

    _updateValidation() {
        const [valid, msg] = this._validateInput();

        if (valid) {
            this._validationLabel?.set_text("");
            this._input?.set_style_class_name("preset-name-input-valid");
        } else {
            this._validationLabel?.set_text(`${SaveCurrentDialog.SYMBOL_INVALID} ${msg}`);
            this._input?.set_style_class_name("preset-name-input-invalid");
        }
    }

    _validateInput(): [boolean, string] {
        let text = this._input?.get_text()?.trim();
        
        if (!text || text.length == 0) {
           return [false, "Enter preset name"];
        }

        if (!/^[A-Za-z].*$/.test(text)) {
           return [false, "Preset name should start with letter"];
        }

        if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(text)) {
           return [false, "Preset name can have letters, digits, '-' and '_' symbols"];
        }

        return [true, ""];
    }

    _onConfirm() {
        const [valid, _] = this._validateInput();

        if (valid) {
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

        this._presetName = value.trim();
        this.notify("presetName");
    }
}