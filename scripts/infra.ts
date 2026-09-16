import { spawnSync } from "node:child_process";

const action = process.argv[2];
if (action !== "up" && action !== "stop") throw new Error("Use infra:up or infra:stop.");
const args = ["compose", "-f", "infra/compose.dev.yml", action === "up" ? "up" : "stop"];
if (action === "up") args.push("-d");
const result = spawnSync("docker", args, { stdio: "inherit" });
process.exit(result.status ?? 1);
