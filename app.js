/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");
const csrf = require("csurf");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
app.use(bodyParser.json());

// View engine
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(csrf({ cookie: true }));
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.use(flash());

app.use(
  session({
    secret: "This-is-my-secret-key-36478489573626284954736261819037",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      Admin.findOne({
        where: {
          email: username,
        },
      })
        .then(async (admin) => {
          if (!admin) {
            return done(null, false, {
              message: "Invalid Credentials",
            });
          }
          const result = await bcrypt.compare(password, admin.password);
          if (result) {
            return done(null, admin);
          } else {
            return done(null, false, {message: "Invalid Credentials"});
          }
        })
        .catch((error) => {
          return error;
        });
    }
  )
);

app.use(function(request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.serializeUser((admin, done) => {
  console.log("Serializing user in session", admin.id);
  done(null, admin.id);
});

passport.deserializeUser((id, done) => {
  Admin.findByPk(id)
    .then((admin) => {
      done(null, admin);
    })
    .catch((error) => {
      done(error, null);
    });
});

const { Election, Questions, Answers, Admin } = require("./models");
const saltRounds = 10;

// Display landing page
app.get("/", (request, response) => {
  // console.log("Display landing page");
  response.render("index", {
    title: "Online Voting Platform",
    csrfToken: request.csrfToken(),
    isSignedIn: false,
  });
});

app.get("/signup", (request, response) => {
  response.render("signup", {
    title: "Sign up | Online Voting Platform",
    csrfToken: request.csrfToken(),
    isSignedIn: false,
  });
});

app.get("/login", (request, response) => {
  response.render("login", {
    title: "Login | Online Voting Platform",
    csrfToken: request.csrfToken(),
    isSignedIn: false,
  });
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect("/elections");
  }
);

app.post("/admins", async (request, response) => {
  // Hashed Password using bcrypt
  const hashPassword = await bcrypt.hash(request.body.password, saltRounds);

  // Create admin
  try {
    const { firstName, lastName, email } = request.body;
    const admin = await Admin.createAdmin(firstName, lastName, email, hashPassword);
    request.logIn(admin, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/elections");
    });
  } catch (error) {
    console.log(error);
    if (error.name == "SequelizeUniqueConstraintError") {
      request.flash("alert", "Email already in use.");
      return response.redirect("/signup");
    }
    if (error.errors[0].message == "Validation len on firstName failed") {
      request.flash("alert", "First name is required.");
      return response.redirect("/signup");
    }

    if (error.errors[0].message == "Validation isEmail on email failed") {
      request.flash("alert", "Enter a valid email.");
      return response.redirect("/signup");
    }
    return response.json(error);
  }
});

// Display elections
app.get(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const admin = request.user;
    const adminId = admin.id;
    const elections = await Election.getAllElections(adminId);

    // Remember to refactor test case white creating elections
    if (request.accepts("html")) {
      response.render("election", {
        title: "Home | Online Voting Platform",
        csrfToken: request.csrfToken(),
        isSignedIn: true,
        elections,
        admin,
      });
    } else {
      return response.json(elections);
    }
  }
);

// Display create election page
app.get(
  "/elections/new",
  connectEnsureLogin.ensureLoggedIn(),
  (request, response) => {
    console.log("Display create election page");
    response.render("createElection", {
      title: "Create New Election | Online Voting Platform",
      csrfToken: request.csrfToken(),
      isSignedIn: true,
    });
  }
);

// Create a election
app.post(
  "/createElections",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const admin = request.user;
    const adminId = admin.id;
    try {
      const election = await Election.addElection(request.body.title, adminId);
      const id = election.id;
      return response.redirect(`/elections/${id}`);
    } catch (error) {
      console.log(error);
      if (error.errors[0].message == "Validation len on title failed") {
        request.flash("alert", "Please enter a title");
        return response.redirect("elections/new");
      }
      return response.status(422).json(error);
    }
  }
);

// Display election single page with details
app.get(
  "/elections/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Display election single page with details");

    const electionId = request.params.id;
    const election = await Election.getElection(electionId);
    const questions = await Questions.getAllQuestions(electionId);
    response.render("manageElection", {
      title: "Manage Election | Online Voting Platform",
      csrfToken: request.csrfToken(),
      isSignedIn: true,
      election,
      questions,
    });
  }
);

// Display add question page
app.get(
  "/elections/:id/questions",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Display add question page ");

    const electionId = request.params.id;
    const election = await Election.getElection(electionId);
    const questions = await Questions.getAllQuestions(electionId);
    if (request.accepts("html")) {
      return response.render("question", {
        title: "Create Questions | Online Voting Platform",
        csrfToken: request.csrfToken(),
        isSignedIn: true,
        election,
        questions,
      });
    } else {
      return response.json(questions);
    }
  }
);

// Display add question form page
app.get(
  "/elections/:id/questions/new",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    // console.log("Display add question form page");

    const electionId = request.params.id;
    const election = await Election.getElection(electionId);

    response.render("createQuestion", {
      title: "New Question | Online Voting Platform",
      csrfToken: request.csrfToken(),
      isSignedIn: true,
      electionId,
      election
    });
  }
);

// Create Question
app.post("/createQuestions", async (request, response) => {
  console.log("Create question");
  const electionId = request.body.electionId;
  try {
    const questionTitle = request.body.question;
    const questionDescription = request.body.description;
    const question = await Questions.addQuestion(
      questionTitle,
      questionDescription,
      electionId
    );
    response.redirect(`/questions/${question.id}`);
  } catch (error) {
    console.log(error);
    if (error.errors[0].message == "Validation len on question failed") {
      request.flash("alert", "Please enter question");
      return response.redirect(`/elections/${electionId}/questions/new`);
    }
    if (error.errors[0].message == "Validation len on description failed") {
      request.flash("alert", "Please enter description");
      return response.redirect(`/elections/${electionId}/questions/new`);
    }
    return response.status(422).json(error);
  }
});

// Display add options page
app.get(
  "/questions/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log(
      "Add option for particular question must have minimum 2 options."
    );
    const questionId = request.params.id;
    const question = await Questions.getQuestion(questionId);
    const electionId = question.electionId;
    console.log(electionId);
    const election = await Election.getElection(electionId);
    const getOptions = await Answers.getAllAnswers(questionId);

    console.log(getOptions.length);
    try {
      return response.render("createOptions", {
        title: "Add Options | Online Voting Platform",
        csrfToken: request.csrfToken(),
        isSignedIn: true,
        question,
        getOptions,
        election
      });
    } catch (error) {
      console.log("Error message: ", error);
      return response.json(error);
    }
  }
);

// Create options
app.post("/createOptions", async (request, response) => {
  console.log("Create options");
  const { options, questionId } = request.body;
  try {
    const answer = await Answers.addOptions(options, questionId);
    return response.redirect(`/questions/${questionId}`);
  } catch (error) {
    console.log("Error received : ", error);
    return response.json(error);
  }
});

// Display add voters page
app.get(
  "/elections/:id/voters",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Addition of new voters and ");
  }
);

//
app.put("/elections/:id/launch", async (request, response) => {
  console.log("Launch specific election.");
  const election = await Election.getElection(request.params.id);
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
