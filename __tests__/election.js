/* eslint-disable no-undef */
const request = require("supertest");
const db = require("../models/index");
const app = require("../app");
const port = 3000;

let server, agent;

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(port, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Creates a election and responds with json at /createElections POST endpoint", async () => {
    const response = await agent.post("/createElections").send({
      title: "Select new Class Representative",
    });
    expect(response.statusCode).toBe(200);
  });

  test("Creates a question and responds with json at /createQuestions POST endpoint", async () => {
    const response = await agent.post("/createQuestions").send({
      question: "New Prime Minister of Nepal",
      description:
        "There are three candidates. They are rabi, pushpa, khadga",
    });
    expect(response.statusCode).toBe(200);
  });
  test("Creates a answer and responds with json at /createOptions POST endpoint", async () => {
    const response = await agent.post("/createOptions").send({
      options: "Person A",
    });
    expect(response.statusCode).toBe(200);
  });
});
