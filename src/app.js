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

  // v1 removed in v2.0.0 (deprecated since v1.1.0)

  // v2: tasks now have a priority
  const TaskV2 = {
    type: "object",
    required: ["id", "title", "done", "priority"],
    properties: {
      ...Task.properties,
      priority: { type: "string", enum: ["low", "medium", "high"], example: "high" },
    },
  };

  app.register(async (r) => {
    r.get("/tasks", {
      schema: {
        operationId: "listTasksV2",
        tags: ["Tasks v2"],
        summary: "List tasks",
        querystring: {
          type: "object",
          properties: { priority: { type: "string", enum: ["low", "medium", "high"], description: "Filter by priority" } },
        },
        response: { 200: { type: "array", items: TaskV2 } },
      },
    }, async (req) => {
      const all = tasks.map((t) => ({ priority: "medium", ...t }));
      return req.query.priority ? all.filter((t) => t.priority === req.query.priority) : all;
    });

    r.post("/tasks", {
      schema: {
        operationId: "createTaskV2",
        tags: ["Tasks v2"],
        summary: "Create a task",
        body: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string", minLength: 1, maxLength: 200 },
            priority: { type: "string", enum: ["low", "medium", "high"], default: "medium" },
          },
        },
        response: { 201: TaskV2 },
      },
    }, async (req, reply) => {
      const task = { id: tasks.length + 1, title: req.body.title, done: false, priority: req.body.priority };
      tasks.push(task);
      return reply.code(201).send(task);
    });
  }, { prefix: "/api/v2" });

  return app;
}

module.exports = { buildApp };
