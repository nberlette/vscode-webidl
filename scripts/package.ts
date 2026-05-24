interface PackageManifest {
  name: string;
  version: string;
}

const manifest = JSON.parse(
  await Deno.readTextFile("package.json"),
) as PackageManifest;

const artifactsDir = Deno.env.get("ARTIFACTS_DIR") ?? ".artifacts";
const vsixTemplate = Deno.env.get("VSIX_TEMPLATE") ??
  `${manifest.name}-{{VERSION}}.vsix`;
const vsixFile = vsixTemplate.replaceAll("{{VERSION}}", manifest.version);
const outPath = `${artifactsDir}/${vsixFile}`;

await Deno.mkdir(artifactsDir, { recursive: true });

const command = new Deno.Command(Deno.execPath(), {
  args: [
    "run",
    "-A",
    "npm:@vscode/vsce",
    "package",
    "--no-dependencies",
    "--out",
    outPath,
  ],
  stdout: "inherit",
  stderr: "inherit",
});

const status = await command.spawn().status;
if (!status.success) {
  Deno.exit(status.code);
}
