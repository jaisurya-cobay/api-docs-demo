// Local run: API on :3000 and the same Scalar docs at /docs (with a working "Try it").
const { buildApp } = require("./app");

const app = buildApp();
app.register(require("@scalar/fastify-api-reference"), { routePrefix: "/docs" });

app.listen({ port: 3000 }).then(() => {
  console.log("API   → http://localhost:3000/api/v1/tasks");
  console.log("Docs  → http://localhost:3000/docs");
});
