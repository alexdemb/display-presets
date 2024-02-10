import Gio from "gi://Gio";
import GLib from "gi://GLib";
import { loadPresetsConfig } from "../presets/presets-config.js";
import { DisplayConfig } from "./display-config.js";

const interfaceXml = `
<node>
    <interface name="com.github.alexdemb.DisplayPresets">
        <method name="ApplyPreset">
            <arg type="s" direction="in" name="presetName"/>
        </method>
    </interface>
</node>
`;

const OBJECT_PATH = "/com/github/alexdemb/DisplayPresets";

class Service {
    dbus: Gio.DBusExportedObject;
    displayConfig?: DisplayConfig;

    constructor() {
        this.dbus = Gio.DBusExportedObject.wrapJSObject(interfaceXml, this);
    }
    
    async ApplyPreset(presetName: string): Promise<void> {
        const presets = loadPresetsConfig();
        const preset = presets.find(p => p.name === presetName);

        if (preset) {
            console.log("Applying preset " + presetName);
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
}

let serviceObj = new Service();

const onBusAcquired = (connection: Gio.DBusConnection, _name: string, displayConfig: DisplayConfig) => {
    serviceObj.displayConfig = displayConfig;
    serviceObj.dbus.export(connection, OBJECT_PATH);
}

const onNameAcquired = (connection: Gio.DBusConnection, _name: string) => {
    console.log(`Name acquired: ${_name}`);
}

const onNameLost = (connection: Gio.DBusConnection, _name: string) => {
    console.log(`Name lost: ${_name}`);
}

export const start = (displayConfig: DisplayConfig) => {
    return Gio.bus_own_name(
        Gio.BusType.SESSION, 
        "com.github.alexdemb.DisplayPresets", 
        Gio.BusNameOwnerFlags.NONE,
        (c, n) => onBusAcquired(c, n, displayConfig),
        onNameAcquired,
        onNameLost);
};

export const stop = (ownerId: number) => {
    Gio.bus_unown_name(ownerId);
}