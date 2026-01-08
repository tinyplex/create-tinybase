import * as esbuild from "esbuild";
import { chmod, rm, mkdir, readFile, writeFile } from "fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

await esbuild.build({
  entryPoints: ["src/cli.ts"],
  bundle: false,
  minify: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outfile: "dist/cli.js",
  banner: {
    js: "#!/usr/bin/env node\n",
  },
});

await chmod("dist/cli.js", 0o755);

const pkg = JSON.parse(await readFile("package.json", "utf-8"));
delete pkg.devDependencies;
delete pkg.scripts;
delete pkg.private;
pkg.bin["create-tinybase"] = "./cli.js";
await writeFile("dist/package.json", JSON.stringify(pkg, null, 2));

console.log("✅ Built and minified CLI");
