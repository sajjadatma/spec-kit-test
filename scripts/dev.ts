import { spawn } from "node:child_process";

const commands = [
  ["pnpm", ["--filter", "@industrial-dashboard/web", "dev"]],
  ["pnpm", ["--filter", "@industrial-dashboard/api", "dev"]],
  ["pnpm", ["--filter", "@industrial-dashboard/worker", "dev"]]
] as const;
const children = commands.map(([command, args]) => spawn(command, args, { stdio: "inherit" }));
const shutdown = () => children.forEach((child) => child.kill("SIGTERM"));
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
