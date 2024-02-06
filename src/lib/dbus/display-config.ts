import GLib from "gi://GLib";
import Gio from "gi://Gio"; 

const NAME = "org.gnome.Mutter.DisplayConfig";
const OBJECT_PATH = "/org/gnome/Mutter/DisplayConfig";
const INTERFACE = "org.gnome.Mutter.DisplayConfig";

export interface Configuration {
    serial: number,
    monitors: Monitor[],
    logicalMonitors: LogicalMonitor[],
    properties: Object,
}

export interface Monitor extends MonitorInfo {
    modes: Mode[],
    properties: Object,
};

export interface MonitorInfo {
    connector: string,
    vendor: string,
    product: string,
    serial: string,
}

export interface Mode {
    id: string,
    width: number,
    height: number,
    refreshRate: number,
    scale: number,
    supportedScales: number[],
    properties: Object,
};

export interface LogicalMonitor {
    x: number,
    y: number,
    scale: number,
    transform: Transform,
    primary: boolean,
    monitors: MonitorInfo[],
    properties: Object,
};

export enum Transform {
    NORMAL = 0,
    ROTATE_90 = 1,
    ROTATE_180 = 2,
    ROTATE_270 = 3,
    FLIPPED = 4,
    ROTATE_90_FLIPPED = 5,
    ROTATE_180_FLIPPED = 6,
    ROTATE_270_FLIPPED = 7,
};

export class DisplayConfig {
    proxy: Gio.DBusProxy;

    constructor() {
        this.proxy = Gio.DBusProxy.new_for_bus_sync(
            Gio.BusType.SESSION,
            Gio.DBusProxyFlags.NONE,
            null,
            NAME,
            OBJECT_PATH,
            INTERFACE,
            null
        );
    }

    async getCurrentState(): Promise<Configuration> {
        return new Promise((resolve) => { 
            this.proxy.call("org.gnome.Mutter.DisplayConfig.GetCurrentState", null, Gio.DBusCallFlags.NONE, -1, null, (src, res) => {
                const reply = src.call_finish(res);
                const result: any = reply.recursiveUnpack();

                const serial: number = result[0];
                const monitors: Monitor[] = result[1].map((m: any) => this._extractMonitor(m));
                const logicalMonitors: LogicalMonitor[] = result[2].map((lm: any) => this._extractLogicalMonitor(lm));
                const properties = result[3];

                const configState: Configuration = {
                    serial,
                    monitors,
                    logicalMonitors,
                    properties
                };

                resolve(configState);
            });
        });
    }

    async applyMonitorsConfig(serial: number, presetName: string, config: Configuration): Promise<void> {
        return new Promise((resolve) => {
            console.log(`ApplyMonitorsConfig: Serial = ${serial}, Preset = ${presetName}`);

            const monitorsConfig = this._configurationToApplyMonitorConfigRequest(serial, config);

            this.proxy.call("org.gnome.Mutter.DisplayConfig.ApplyMonitorsConfig", monitorsConfig, Gio.DBusCallFlags.NONE, -1, null, (src, res) => {
                src.call_finish(res);
                resolve();
            });
        });
    }

    _configurationToApplyMonitorConfigRequest(current_serial: number, config: Configuration): GLib.Variant {
        const logicalMonitors = config.logicalMonitors.map(lm => this._toLogicalMonitorRequest(config, lm));       
        const properties = {}
        const requestStructure = [current_serial, 2, logicalMonitors, properties];

        console.log(`Request structure: ${JSON.stringify(requestStructure)}`);

        return new GLib.Variant("(uua(iiduba(ssa{sv}))a{sv})", requestStructure);
    }

    _toLogicalMonitorRequest(config: Configuration, lm: LogicalMonitor): Array<any> {
        return [lm.x, lm.y, lm.scale, lm.transform, lm.primary, lm.monitors.map(m => [m.connector, this._getCurrentModeIdForConnector(config, m.connector), {}])];
    }

    _getCurrentModeIdForConnector(config: Configuration, connector: string): string | undefined {
        return config.monitors
            .find(m => m.connector === connector)
            ?.modes
            .find((m: Mode) => m.properties.hasOwnProperty("is-current") && (m.properties as any)["is-current"] === true)
            ?.id;
    }

    _extractMonitor(m: any[]): Monitor {
        return {
            ...this._extractMonitorInfo(m[0]),  
            modes: m[1].map((md: any) => this._extractMode(md)),
            properties: m[2],
        };
    }

    _extractMonitorInfo(mi: any[]): MonitorInfo {
        return {
            connector: mi[0],
            vendor: mi[1],
            product: mi[2],
            serial: mi[3],
        }
    }

    _extractMode(mode: any[]): Mode {
        return {
            id: mode[0],
            width: mode[1],
            height: mode[2],
            refreshRate: mode[3],
            scale: mode[4],
            supportedScales: mode[5],
            properties: mode[6]
        }
    }

    _extractLogicalMonitor(lm: any[]): LogicalMonitor {
        return {
            x: lm[0],
            y: lm[1],
            scale: lm[2],
            transform: lm[3],
            primary: lm[4],
            monitors: lm[5].map((mi: any[]) => this._extractMonitorInfo(mi)),
            properties: lm[6],
        }
    }


}