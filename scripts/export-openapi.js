// The "code scanner": boots the app in memory (no port, no DB), asks it for
// the OpenAPI document it built from the route schemas, and writes it out.
const fs = require("node:fs");
const path = require("node:path");
const { buildApp } = require("../src/app");

(async () => {
  const app = buildApp();
  await app.ready();
  const spec = app.swagger();
  const out = path.join(__dirname, "..", "docs", "openapi.json");
  fs.writeFileSync(out, JSON.stringify(spec, null, 2) + "\n");
  console.log(`Wrote ${out} (${Object.keys(spec.paths).length} paths)`);
  await app.close();
})();
