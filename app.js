/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
const { Election, Questions, Answers } = require("./models");
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// Display base page
app.get("/", (request, response) => {
  console.log("Display base page");
  response.send("Hello World");
});

// Display elections
app.get("/elections", (request, response) => {
  console.log("Display elections");
  response.render("");
});

// Display create election page
app.get("/elections/new", (request, response) => {
  console.log("Display create election page");
  response.render("", {
    title: "Create New Election",
  });
});

// Create a election
app.post("/createElections", async (request, response) => {
  console.log("Create a election");
  const title = request.body.title;
  try {
    const election = await Election.addElection(title);
    return response.json(election);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// Display election single page with details
app.get("/elections/:id", async (request, response) => {
  console.log("Display election single page with details");
  const election = await Election.getElection(request.params.id);
  const { title } = election;
  response.render("", {
    title: title,
  });
});

// Display add question page
app.get("/elections/:id/questions", async (request, response) => {
  console.log("Display add question page ");
  const election = await Election.getElection(request.params.id);
  const { title } = election;
  response.render("", {
    title: title,
  });
});

// Display add question form page
app.get("/elections/:id/questions/new", async (request, response) => {
  console.log("Display add question form page");
  const election = await Election.findByPk(request.params.id);
  const { title } = election;
  response.render("", {
    title: title,
  });
});

// Create Question
app.post(
  "/createQuestions",
  async (request, response) => {
    console.log("Create question");

    try {
      const questionTitle = request.body.question;
      const questionDescription = request.body.description;
      const question = await Questions.create({
        question: questionTitle,
        description: questionDescription,
      });
      return response.json(question);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

// Display add options page
app.get("/questions/:id", async (request, response) => {
  console.log(
    "Add option for particular question must have minimum 2 options."
  );

  const question = await Questions.findByPk(request.params.id);
  return response.json(question);
});

// Create options
app.post("/createOptions", async (request, response) => {
  console.log(
    "Create options"
  );
  const options = request.body.options;
  const answer = await Answers.create({
    options,
  });
  return response.json(options);
});

// Display add voters page
app.get("/elections/:id/voters", async (request, response) => {
  console.log("Addition of new voters and ");
});

//
app.put("/elections/:id/launch", async (request, response) => {
  console.log("Launch specific election.");

  const election = await Election.findByPk(request.params.id);

  try {
    const launch = await election.update({
      status: "Launch",
    });
    return response.json(launch);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;