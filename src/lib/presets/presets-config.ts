import GLib from "gi://GLib";
import Gio from "gi://Gio"; 
import { Configuration } from "../dbus/display-config.js";

export interface Preset {
    name: string,
    configuration: Configuration,
};

const CONFIG_FILE = `${GLib.getenv("HOME")}/.config/display-presets.json`;

export const loadPresetsConfig = (): Preset[] => {
    if (!GLib.file_test(CONFIG_FILE, GLib.FileTest.EXISTS)) {
        return [];
    }

    const [success, content] = GLib.file_get_contents(CONFIG_FILE);
    const dec = new TextDecoder();

    if (success) {
        return JSON.parse(dec.decode(content));
    }

    return [];
};

export const savePresetsConfig = (presets: Preset[]) => {
    const content = JSON.stringify(presets);
    const enc = new TextEncoder();

    GLib.file_set_contents(CONFIG_FILE, enc.encode(content));
};
