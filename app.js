/* eslint-disable no-unused-vars */
const express = require("express");
const csrf = require("csurf");
const app = express();
const { Election, Questions, Answers, Admin } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const saltRounds = 10;
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("This is the secret key for ..."));
app.use(csrf({ cookie: true }));

const path = require("path");
const admin = require("./models/admin");
// View engine
app.set("view engine", "ejs");

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));

// Display landing page
app.get("/", (request, response) => {
  console.log("Display landing page");
  response.render("index", {
    title: "Online Voting Platform",
    csrfToken: request.csrfToken(),
  });
});

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Sign up | Online Voting Platform",
    csrfToken: request.csrfToken(),
  });
});

// Display elections
app.get("/elections", async (request, response) => {
  const elections = await Election.findAll();
  if (request.accepts("html")) {
    response.render("election", {
      title: "Home | Online Voting Platform",
      csrfToken: request.csrfToken(),
      elections,
    });
  } else {
    return response.json(elections);
  }
});

app.post("/admins", async (request, response) => {
  // Hashed Password using bcrypt
  const hashPassword = await bcrypt.hash(request.body.password, saltRounds);

  // Create admin
  try {
    const { firstName, lastName, email } = request.body;
    const admin = await Admin.create({
      firstName,
      lastName,
      email,
      password: hashPassword,
    });
    return response.redirect("/elections");
  } catch (error) {
    console.log(error);
    return response.json(error);
  }
});

// Display create election page
app.get("/elections/new", (request, response) => {
  console.log("Display create election page");
  response.render("createElection", {
    title: "Create New Election | Online Voting Platform",
    csrfToken: request.csrfToken(),
  });
});

// Create a election
app.post("/createElections", async (request, response) => {
  try {
    const election = await Election.addElection(request.body.title);
    const id = election.id;
    return response.redirect(`/elections/${id}`);
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
    csrfToken: request.csrfToken(),
    electionTitle,
    id,
  });
});

// Display add question page
app.get("/elections/:id/questions", async (request, response) => {
  console.log("Display add question page ");
  const id = request.params.id;
  const election = await Election.getElection(id);
  const electionTitle = election.title;
  const question = await Questions.findAll();
  if (request.accepts("html")) {
    return response.render("question", {
      title: "Create Questions | Online Voting Platform",
      csrfToken: request.csrfToken(),
      electionTitle,
      id,
      question,
    });
  } else {
    return response.json(question);
  }
});

// Display add question form page
app.get("/elections/:id/questions/new", async (request, response) => {
  console.log("Display add question form page");
  const id = request.params.id;
  const election = await Election.getElection(id);

  response.render("createQuestion", {
    title: "New Question | Online Voting Platform",
    csrfToken: request.csrfToken(),
  });
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
  console.log(getOptions.length);
  try {
    return response.render("createOptions", {
      title: "Add Options | Online Voting Platform",
      csrfToken: request.csrfToken(),
      question: questionTitle,
      getOptions,
      questionId,
    });
  } catch (error) {
    console.log("Error message: ", error);
    return response.json(error);
  }
});


// Create options
app.post("/createOptions", async (request, response) => {
  console.log("Create options");
  const {options, questionId} = request.body;
  try {
    const answer = await Answers.addOptions(options, questionId);
    return response.redirect("back");
  } catch (error) {
    console.log("Error received : ", error);
    return response.json(error);
  }
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
