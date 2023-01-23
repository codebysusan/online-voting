/* eslint-disable no-undef */
const request = require("supertest");
const db = require("../models/index");
const app = require("../app");
const port = 3000;
const cheerio = require("cheerio");

let server, agent;

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/sessionAdmin").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

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

  test("Sign up", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/admins").send({
      firstName: "Test",
      lastName: "User A",
      email: "susank@gmail.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign in", async () => {
    let res = await agent.get("/login");
    const csrfToken = extractCsrfToken(res);
    let response = await agent.post("/sessionAdmin").send({
      email: "susank@gmail.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Sign out", async () => {
    let res = await agent.get("/elections");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/elections");
    expect(res.statusCode).toBe(302);
  });

  test("Creates a election and responds with json at /createElections POST endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, "susank@gmail.com", "12345678");
    const res = await agent.get("/elections/new");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/createElections").send({
      title: "PM Election of Nepal",
      _csrf: csrfToken,
    });
    console.log(response);
    expect(response.statusCode).toBe(302);
  });

  test("Creates a question and responds with json at /createQuestions", async () => {
    // Created election first
    const agent = request.agent(server);
    await login(agent, "susank@gmail.com", "12345678");
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    const createElection = await agent.post("/createElections").send({
      title: "PM Election of Nepal",
      _csrf: csrfToken,
    });
    expect(createElection.statusCode).toBe(302);

    //  To find out the last index of election.
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionsCount = parsedGroupedResponse.length;
    const latestElection = parsedGroupedResponse[electionsCount - 1];

    //  Created new question for specific election
    res = await agent.get(`/elections/${latestElection.id}/questions/new`);
    csrfToken = extractCsrfToken(res);
    const createQuestion = await agent.post("/createQuestions").send({
      question: "New Prime Minister of Nepal",
      description: "There are three candidates. There are rabi, pushpa, khadga",
      electionId: latestElection.id,
      _csrf: csrfToken,
    });
    //  Checking whether the question is created or not.
    expect(createQuestion.statusCode).toBe(302);
  });

  test("Edits a question and responds with json at /updateQuestion/:id", async () => {
    // Created election first
    const agent = request.agent(server);
    await login(agent, "susank@gmail.com", "12345678");
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    const createElection = await agent.post("/createElections").send({
      title: "PM Election of Nepal",
      _csrf: csrfToken,
    });
    expect(createElection.statusCode).toBe(302);

    //  To find out the last index of election.
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionsCount = parsedGroupedResponse.length;
    const latestElection = parsedGroupedResponse[electionsCount - 1];

    //  Created new question for specific election
    res = await agent.get(`/elections/${latestElection.id}/questions/new`);
    csrfToken = extractCsrfToken(res);
    const createQuestion = await agent.post("/createQuestions").send({
      question: "New Prime Minister of Nepal",
      description: "There are three candidates. There are rabi, pushpa, khadga",
      electionId: latestElection.id,
      _csrf: csrfToken,
    });
    //  Checking whether the question is created or not.
    expect(createQuestion.statusCode).toBe(302);

    const groupedQuestionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions`)
      .set("Accept", "application/json");
    const parsedGroupedQuestionsResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionsCount = parsedGroupedQuestionsResponse.length;
    const latestQuestion = parsedGroupedQuestionsResponse[questionsCount - 1];

    // Edit question title and description
    res = await agent.get(`/question/${latestQuestion.id}/edit`);
    csrfToken = extractCsrfToken(res);
    const updateQuestion = await agent
      .post(`/updateQuestion/${latestQuestion.id}`)
      .send({
        question: "Prime Minister of UK",
        description:
          "There are three candidates. They are Liz Truss, Boris Johnson and Rishi Sunak.",
        _csrf: csrfToken,
      });
    // Checking the response of edit question
    expect(updateQuestion.statusCode).toBe(302);
  });

  test("Deletes a question and responds at /question/:id", async () => {
    // Created election first
    const agent = request.agent(server);
    await login(agent, "susank@gmail.com", "12345678");
    let res = await agent.get("/elections/new");
    let csrfToken = extractCsrfToken(res);
    const createElection = await agent.post("/createElections").send({
      title: "PM Election of Nepal",
      _csrf: csrfToken,
    });
    expect(createElection.statusCode).toBe(302);

    //  To find out the last index of election.
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionsCount = parsedGroupedResponse.length;
    const latestElection = parsedGroupedResponse[electionsCount - 1];

    //  Created new question for specific election
    res = await agent.get(`/elections/${latestElection.id}/questions/new`);
    csrfToken = extractCsrfToken(res);
    const createQuestion = await agent.post("/createQuestions").send({
      question: "New Prime Minister of Nepal",
      description: "There are three candidates. There are rabi, pushpa, khadga",
      electionId: latestElection.id,
      _csrf: csrfToken,
    });
    //  Checking whether the question is created or not.
    expect(createQuestion.statusCode).toBe(302);

    const groupedQuestionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions`)
      .set("Accept", "application/json");
    const parsedGroupedQuestionsResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionsCount = parsedGroupedQuestionsResponse.length;
    const latestQuestion = parsedGroupedQuestionsResponse[questionsCount - 1];

    // Deletes a question
    res = await agent.get(`/elections/${latestQuestion.id}/questions`);
    csrfToken = extractCsrfToken(res);
    const deleteQuestion = await agent
      .post(`/question/${latestQuestion.id}`)
      .send({
        _csrf: csrfToken,
      });
    // Checks the response of delete question
    expect(deleteQuestion.statusCode).toBe(302);
  });

  test("Create a option and responds at /createOptions POST endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, "susank@gmail.com", "12345678");

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
    const parsedGroupedQuestionsResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionsCount = parsedGroupedQuestionsResponse.length;
    const latestQuestion = parsedGroupedQuestionsResponse[questionsCount - 1];
    res = await agent.get(`/questions/${latestQuestion.id}`);
    csrfToken = extractCsrfToken(res);
    // Creating option
    const createOptions = await agent.post("/createOptions").send({
      options: "Rabi Lamichanne",
      questionId: latestQuestion.id,
      _csrf: csrfToken,
    });
    // Checking whether the option is created or not.
    expect(createOptions.statusCode).toBe(302);
  });

  test("Edit a option and responds at /updateOptions POST endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, "susank@gmail.com", "12345678");

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
    const parsedGroupedQuestionsResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionsCount = parsedGroupedQuestionsResponse.length;
    const latestQuestion = parsedGroupedQuestionsResponse[questionsCount - 1];
    res = await agent.get(`/questions/${latestQuestion.id}`);
    csrfToken = extractCsrfToken(res);
    // Creating option
    const createOptions = await agent.post("/createOptions").send({
      options: "Rabi Lamichanne",
      questionId: latestQuestion.id,
      _csrf: csrfToken,
    });
    // Checking whether the option is created or not.
    expect(createOptions.statusCode).toBe(302);

    const groupedOptionsResponse = await agent
      .get(`/questions/${latestQuestion.id}`)
      .set("Accept", "application/json");
    const parsedGroupedOptionsResponse = JSON.parse(
      groupedOptionsResponse.text
    );
    const optionsCount = parsedGroupedOptionsResponse.length;
    const latestOption = parsedGroupedOptionsResponse[optionsCount - 1];

    res = await agent.get(
      `/question/${latestQuestion.id}/editOption/${latestOption.id}`
    );
    csrfToken = extractCsrfToken(res);

    // updating options
    const updateOptions = await agent
      .post(`/updateOptions/${latestOption.id}`)
      .send({
        option: "Kaushal Guragain",
        _csrf: csrfToken,
      });
    // Checking update option response
    expect(updateOptions.statusCode).toBe(302);
  });

  test("Delete a option and responds at /options/:id POST endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, "susank@gmail.com", "12345678");

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
    const parsedGroupedQuestionsResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionsCount = parsedGroupedQuestionsResponse.length;
    const latestQuestion = parsedGroupedQuestionsResponse[questionsCount - 1];
    res = await agent.get(`/questions/${latestQuestion.id}`);
    csrfToken = extractCsrfToken(res);
    // Creating option
    const createOptions = await agent.post("/createOptions").send({
      options: "Rabi Lamichanne",
      questionId: latestQuestion.id,
      _csrf: csrfToken,
    });
    // Checking whether the option is created or not.
    expect(createOptions.statusCode).toBe(302);

    const groupedOptionsResponse = await agent
      .get(`/questions/${latestQuestion.id}`)
      .set("Accept", "application/json");
    const parsedGroupedOptionsResponse = JSON.parse(
      groupedOptionsResponse.text
    );
    const optionsCount = parsedGroupedOptionsResponse.length;
    const latestOption = parsedGroupedOptionsResponse[optionsCount - 1];

    res = await agent.get(`/questions/${latestQuestion.id}`);
    csrfToken = extractCsrfToken(res);
    // Deleting response
    const deleteOptions = await agent
      .delete(`/options/${latestOption.id}`)
      .send({
        _csrf: csrfToken,
      });
    console.log(deleteOptions);
    // Checking delete options response
    expect(deleteOptions.statusCode).toBe(200);
  });

  test("Creates a voter and responds with a json at /createVoters POST endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, "susank@gmail.com", "12345678");

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
    const parsedGroupedQuestionsResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionsCount = parsedGroupedQuestionsResponse.length;
    const latestQuestion = parsedGroupedQuestionsResponse[questionsCount - 1];
    res = await agent.get(`/questions/${latestQuestion.id}`);
    csrfToken = extractCsrfToken(res);
    const createOptions = await agent.post("/createOptions").send({
      options: "Rabi Lamichanne",
      questionId: latestQuestion.id,
      _csrf: csrfToken,
    });
    // Checking whether the option is created or not.
    expect(createOptions.statusCode).toBe(302);

    res = await agent.get(`/elections/${latestElection.id}/voters`);
    csrfToken = extractCsrfToken(res);
    // Creating a voter
    const createVoters = await agent.post("/createVoters").send({
      electionId: latestElection.id,
      voterId: "2001",
      password: "1234",
      _csrf: csrfToken,
    });
    // Checking create voter response/statuscode
    expect(createVoters.statusCode).toBe(302);
  });

  test("Deletes a voter and responds with a json at /voters/:id POST endpoint", async () => {
    const agent = request.agent(server);
    await login(agent, "susank@gmail.com", "12345678");

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
    const parsedGroupedQuestionsResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionsCount = parsedGroupedQuestionsResponse.length;
    const latestQuestion = parsedGroupedQuestionsResponse[questionsCount - 1];

    res = await agent.get(`/questions/${latestQuestion.id}`);
    csrfToken = extractCsrfToken(res);
    const createOptions = await agent.post("/createOptions").send({
      options: "Rabi Lamichanne",
      questionId: latestQuestion.id,
      _csrf: csrfToken,
    });
    // Checking whether the option is created or not.
    expect(createOptions.statusCode).toBe(302);

    res = await agent.get(`/elections/${latestElection.id}/voters`);
    csrfToken = extractCsrfToken(res);
    const createVoters = await agent.post("/createVoters").send({
      electionId: latestElection.id,
      voterId: "2001",
      password: "1234",
      _csrf: csrfToken,
    });
    expect(createVoters.statusCode).toBe(302);

    const groupedVotersResponse = await agent
      .get(`/elections/${latestElection.id}/voters`)
      .set("Accept", "application/json");
    const parsedGroupedVotersResponse = JSON.parse(groupedVotersResponse.text);
    const votersCount = parsedGroupedVotersResponse.length;
    const latestVoter = parsedGroupedVotersResponse[votersCount - 1];

    res = await agent.get(`/elections/${latestElection.id}/voters`);
    csrfToken = extractCsrfToken(res);
    // Deleting voters
    const deleteVoters = await agent.delete(`/voters/${latestVoter.id}`).send({
      _csrf: csrfToken,
    });
    // Checking delete voters response
    expect(deleteVoters.statusCode).toBe(200);
  });

  test("Launch an election", async () => {
    const agent = request.agent(server);
    await login(agent, "susank@gmail.com", "12345678");

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
    const parsedGroupedQuestionsResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionsCount = parsedGroupedQuestionsResponse.length;
    const latestQuestion = parsedGroupedQuestionsResponse[questionsCount - 1];
    res = await agent.get(`/questions/${latestQuestion.id}`);
    csrfToken = extractCsrfToken(res);
    // Creating option
    const createOptions = await agent.post("/createOptions").send({
      options: "Rabi Lamichanne",
      questionId: latestQuestion.id,
      _csrf: csrfToken,
    });

    // Checking whether the option is created or not.
    expect(createOptions.statusCode).toBe(302);

    await agent.post("/createOptions").send({
      options: "Kaushal Guragain",
      questionId: latestQuestion.id,
      _csrf: csrfToken,
    });

    res = await agent.get(`/elections/${latestElection.id}/previewBallot`);
    csrfToken = extractCsrfToken(res);
    console.log(res);
    const launchElection = await agent
      .post(`/elections/${latestElection.id}/launch`)
      .send({
        _csrf: csrfToken,
      });
    expect(launchElection.statusCode).toBe(302);
  });

  //* Todos for voters

  //* Login for voters
  test("Voters Login", async () => {
    const agent = request.agent(server);
    await login(agent, "susank@gmail.com", "12345678");

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
    const parsedGroupedQuestionsResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionsCount = parsedGroupedQuestionsResponse.length;
    const latestQuestion = parsedGroupedQuestionsResponse[questionsCount - 1];
    res = await agent.get(`/questions/${latestQuestion.id}`);
    csrfToken = extractCsrfToken(res);
    const createOptions = await agent.post("/createOptions").send({
      options: "Rabi Lamichanne",
      questionId: latestQuestion.id,
      _csrf: csrfToken,
    });
    await agent.post("/createOptions").send({
      options: "Kaushal Guragain",
      questionId: latestQuestion.id,
      _csrf: csrfToken,
    });
    // Checking whether the option is created or not.
    expect(createOptions.statusCode).toBe(302);

    // Creating voters
    res = await agent.get(`/elections/${latestElection.id}/voters`);
    csrfToken = extractCsrfToken(res);
    const createVoters = await agent.post("/createVoters").send({
      electionId: latestElection.id,
      voterId: "2001",
      password: "1234",
      _csrf: csrfToken,
    });
    // Checking Voters
    expect(createVoters.statusCode).toBe(302);

    // Login Voters
    res = await agent.get(`/elections/${latestElection.id}/vote`);
    csrfToken = extractCsrfToken(res);
    res = await agent.get("/login/voters");
    csrfToken = extractCsrfToken(res);
    let user = await agent.post("/sessionVoter").send({
      votersId: "2001",
      password: "1234",
      electionId: latestElection.id,
      _csrf: csrfToken,
    });
    // Checking if the voter is logged in
    expect(user.statusCode).toBe(302);
  });

  test("Voters Sign Out", async () => {
    const agent = request.agent(server);
    await login(agent, "susank@gmail.com", "12345678");

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
    const parsedGroupedQuestionsResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionsCount = parsedGroupedQuestionsResponse.length;
    const latestQuestion = parsedGroupedQuestionsResponse[questionsCount - 1];
    res = await agent.get(`/questions/${latestQuestion.id}`);
    csrfToken = extractCsrfToken(res);
    const createOptions = await agent.post("/createOptions").send({
      options: "Rabi Lamichanne",
      questionId: latestQuestion.id,
      _csrf: csrfToken,
    });
    await agent.post("/createOptions").send({
      options: "Kaushal Guragain",
      questionId: latestQuestion.id,
      _csrf: csrfToken,
    });
    // Checking whether the option is created or not.
    expect(createOptions.statusCode).toBe(302);

    // Creating voters
    res = await agent.get(`/elections/${latestElection.id}/voters`);
    csrfToken = extractCsrfToken(res);
    const createVoters = await agent.post("/createVoters").send({
      electionId: latestElection.id,
      voterId: "2001",
      password: "1234",
      _csrf: csrfToken,
    });
    // Checking Voters
    expect(createVoters.statusCode).toBe(302);

    // Login Voters
    res = await agent.get(`/elections/${latestElection.id}/vote`);
    csrfToken = extractCsrfToken(res);
    res = await agent.get("/login/voters");
    csrfToken = extractCsrfToken(res);
    let user = await agent.post("/sessionVoter").send({
      votersId: "2001",
      password: "1234",
      electionId: latestElection.id,
      _csrf: csrfToken,
    });
    // Checking if the voter is logged in
    expect(user.statusCode).toBe(302);

    // Checking if the logged in voters can access the voting page
    res = await agent.get(`/elections/${latestElection.id}/vote/question`);
    expect(res.statusCode).toBe(200);
    // Sign Out the logged in voters
    res = await agent.get("/signout/voters");
    expect(res.statusCode).toBe(302);
    // Checking if the logged in voters can access the voting page
    res = await agent.get(`/elections/${latestElection.id}/vote/question`);
    expect(res.statusCode).toBe(302);
  });
});
