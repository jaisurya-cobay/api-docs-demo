// The "code scanner": boots the app in memory (no port, no DB), asks it for
// the OpenAPI document it built from the route schemas, and writes it out.
// Usage: node scripts/export-openapi.js [output-file]   (default docs/openapi.json)
const fs = require("node:fs");
const path = require("node:path");
const { buildApp } = require("../src/app");

(async () => {
  const app = buildApp();
  await app.ready();
  const spec = app.swagger();
  const out = path.resolve(process.argv[2] || path.join(__dirname, "..", "docs", "openapi.json"));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(spec, null, 2) + "\n");
  console.log(`Wrote ${out} (${Object.keys(spec.paths).length} paths, version ${spec.info.version})`);
  await app.close();
})();
