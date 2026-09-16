const command = process.argv[2] ?? "This command";
console.error(`${command} is not available until its implementation task is complete.`);
process.exitCode = 1;
