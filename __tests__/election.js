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

    test("Creates a election and responds with json at /elections/create POST endpoint", async () => {
        const response = await agent.post("/elections/create").send({
          title: "Select new Class Representative",
        });
        expect(response.statusCode).toBe(200);
      });
});