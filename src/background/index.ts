import { registerHeartbeatOnInstalled } from "../features/heartbeat/register-heartbeat-on-installed";
import { registerUninstallFarewellUrl } from "../features/heartbeat/register-uninstall-farewell-url";

registerHeartbeatOnInstalled();
void registerUninstallFarewellUrl();

chrome.runtime.onStartup?.addListener?.(() => {
  void registerUninstallFarewellUrl();
});
