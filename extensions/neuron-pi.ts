import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { registerNeuronPiHandlers } from "./neuron-pi-core.mjs";

export default function (pi: ExtensionAPI) {
  registerNeuronPiHandlers(pi, { Type });
}
