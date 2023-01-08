/* eslint-disable no-undef */
const request = require("supertest");
const db = require("../models/index");
const app = require("../app");
const port = 3000;
const cheerio = require("cheerio");

let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Online Voting Application", function () {
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
    const res = await agent.get("/elections/new");
    const csrfToken = extractCsrfToken(res);
    // console.log("This is for csrf token",csrfToken);
    const response = await agent.post("/createElections").send({
      title: "PM Election of Nepal",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Creates a question and responds with json at /createQuestions POST endpoint", async () => {
    // Created election first
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    const createElection = await agent.post("/createElections").send({
      title: "PM Election of Nepal",
      _csrf: csrfToken,
    });
    // Checking whether the election is created or not.
    expect(createElection.statusCode).toBe(302);

    // To find out the last index of election.
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionsCount = parsedGroupedResponse.length;
    const latestElection = parsedGroupedResponse[electionsCount - 1];

    // Created new question for specific election
    res = await agent.get(`/elections/${latestElection.id}/questions/new`);
    csrfToken = extractCsrfToken(res);
    const createQuestion = await agent.post("/createQuestions").send({
      question: "New Prime Minister of Nepal",
      description: "There are three candidates. There are rabi, pushpa, khadga",
      electionId: latestElection.id,
      _csrf: csrfToken,
    });
    // Checking whether the question is created or not.
    expect(createQuestion.statusCode).toBe(302);
  });

  test("Creates a answer and responds with json at /createOptions POST endpoint", async () => {
    // Created election first
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    const createElection = await agent.post("/createElections").send({
      title: "PM Election of Nepal",
      _csrf: csrfToken,
    });
    // Checking whether the election is created or not.
    expect(createElection.statusCode).toBe(302);

    // To find out the last index of election.
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionsCount = parsedGroupedResponse.length;
    const latestElection = parsedGroupedResponse[electionsCount - 1];

    // Created new question for specific election
    res = await agent.get(`/elections/${latestElection.id}/questions/new`);
    csrfToken = extractCsrfToken(res);
    const createQuestion = await agent.post("/createQuestions").send({
      question: "New Prime Minister of Nepal",
      description: "There are three candidates. There are rabi, pushpa, khadga",
      electionId: latestElection.id,
      _csrf: csrfToken,
    });
    // Checking whether the question is created or not.
    expect(createQuestion.statusCode).toBe(302);

    // To find out the latest index of question
    const groupedQuestionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions`)
      .set("Accept", "application/json");
      const parsedGroupedQuestionsResponse = JSON.parse(groupedQuestionsResponse.text);
      const questionsCount = parsedGroupedQuestionsResponse.length;
      const latestQuestion = parsedGroupedQuestionsResponse[questionsCount - 1];
      res = await agent.get(`/questions/${latestQuestion.id}`);
      csrfToken = extractCsrfToken(res);
      const createOptions = await agent.post("/createOptions").send({
        options: "Rabi Lamichanne",
        questionId: latestQuestion.id,
        _csrf: csrfToken
      });
      expect(createOptions.statusCode).toBe(302);
  });
});
