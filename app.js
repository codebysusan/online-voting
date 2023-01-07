/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
const { Election, Questions, Answers, Admin } = require("./models");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

const path = require("path");
// View engine
app.set("view engine", "ejs");

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));


// Display landing page
app.get("/", (request, response) => {
  console.log("Display landing page");
  response.render("index", {
    title: "Online Voting Platform"
  });
});

// Display elections
app.get("/elections", (request, response) => {
  console.log("Display elections");
  response.render("election",
  {
    title: "Home | Online Voting Platform"
  });
});

// Display create election page
app.get("/elections/new", (request, response) => {
  console.log("Display create election page");
  response.render("createElection", {
    title: "Create New Election | Online Voting Platform"
  });
});

// Create a election
app.post("/createElections", async (request, response) => {
  console.log("Create a election", request.body);
  try {
    const election = await Election.addElection(request.body.title);
    const id = election.id;
    response.redirect(`/elections/${id}`);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// Display election single page with details
app.get("/elections/:id", async (request, response) => {
  console.log("Display election single page with details");
  const id = request.params.id;
  const election = await Election.getElection(id);
  const electionTitle = election.title;
  response.render("manageElection", {
    title: "Manage Election | Online Voting Platform",
    electionTitle,
    id
  });
});

// Display add question page
app.get("/elections/:id/questions", async (request, response) => {
  console.log("Display add question page ");
  const id = request.params.id;
  const election = await Election.getElection(id);
  const electionTitle = election.title;
  response.render("question", {
    title: "Create Questions | Online Voting Platform",
    electionTitle,
    id
  });
});

// Display add question form page
app.get("/elections/:id/questions/new", async (request, response) => {
  console.log("Display add question form page");
  const id = request.params.id;
  const election = await Election.getElection(id);
  response.render("createQuestion", {
    title: "New Question | Online Voting Platform",
  });
  // response.send("Hello");
});

// Create Question
app.post("/createQuestions", async (request, response) => {
  console.log("Create question");

  try {
    const questionTitle = request.body.question;
    const questionDescription = request.body.description;
    const question = await Questions.addQuestion(
      questionTitle,
      questionDescription
    );
    const questionId = question.id;
    response.redirect(`/questions/${questionId}`);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// Display add options page
app.get("/questions/:id", async (request, response) => {
  console.log(
    "Add option for particular question must have minimum 2 options."
  );
  const questionId = request.params.id;
  const question = await Questions.getQuestion(questionId);
  const questionTitle = question.question;
  const getOptions = await Answers.findAll();
  console.log(getOptions[1].options);

  return response.render("createOptions", {
    title: "Add Options | Online Voting Platform",
    question: questionTitle,
    getOptions
  });
});

// Create options
app.post("/createOptions", async (request, response) => {
  console.log("Create options");
  const options = request.body.options;
  const answer = await Answers.addOptions(options);
  // res.redirect('back');
  return response.redirect('back');
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
        presentStatus: "Launch",
    });
    return response.json(launch);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;
