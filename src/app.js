// A tiny "Tasks" API. The point: every route declares a JSON schema for its
// input and output. Fastify uses those schemas to validate requests, and
// @fastify/swagger reads the same schemas to build openapi.json.
// One definition → validation + docs, so the docs can't drift from the code.

const Fastify = require("fastify");

const Task = {
  $id: "Task",
  type: "object",
  required: ["id", "title", "done"],
  properties: {
    id: { type: "integer", example: 1 },
    title: { type: "string", example: "Write API docs" },
    done: { type: "boolean", example: false },
  },
};

const ErrorSchema = {
  $id: "Error",
  type: "object",
  properties: { message: { type: "string", example: "Task not found" } },
};

function buildApp() {
  const app = Fastify({ logger: false });

  app.register(require("@fastify/swagger"), {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "Tasks API",
        version: process.env.API_VERSION || "0.0.0-dev",
        description: "Demo API. This page is generated from the code on every push.",
      },
      servers: [{ url: "http://localhost:3000", description: "Local (run `npm start`)" }],
    },
    // Name shared schemas by their $id ("Task") instead of "def-0"
    refResolver: { buildLocalReference: (json, _base, _frag, i) => json.$id || `def-${i}` },
  });

  app.addSchema(Task);
  app.addSchema(ErrorSchema);

  const tasks = [{ id: 1, title: "Write API docs", done: false }];

  app.register(async (r) => {
    r.get("/tasks", {
      schema: {
        operationId: "listTasks",
        tags: ["Tasks"],
        summary: "List tasks",
        querystring: {
          type: "object",
          properties: { done: { type: "boolean", description: "Filter by status" } },
        },
        response: { 200: { type: "array", items: { $ref: "Task#" } } },
      },
    }, async (req) => (req.query.done === undefined ? tasks : tasks.filter((t) => t.done === req.query.done)));

    r.post("/tasks", {
      schema: {
        operationId: "createTask",
        tags: ["Tasks"],
        summary: "Create a task",
        body: {
          type: "object",
          required: ["title"],
          properties: { title: { type: "string", minLength: 1, maxLength: 200 } },
        },
        response: { 201: { $ref: "Task#" } },
      },
    }, async (req, reply) => {
      const task = { id: tasks.length + 1, title: req.body.title, done: false };
      tasks.push(task);
      return reply.code(201).send(task);
    });

    r.get("/tasks/:id", {
      schema: {
        operationId: "getTask",
        tags: ["Tasks"],
        summary: "Get one task",
        params: { type: "object", properties: { id: { type: "integer" } } },
        response: { 200: { $ref: "Task#" }, 404: { $ref: "Error#" } },
      },
    }, async (req, reply) => {
      const task = tasks.find((t) => t.id === req.params.id);
      return task ?? reply.code(404).send({ message: "Task not found" });
    });
  }, { prefix: "/api" });

  return app;
}

module.exports = { buildApp };
