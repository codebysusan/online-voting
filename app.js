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
const {
  Election,
  Questions,
  Answers,
  Admin,
  Voters,
  Result,
} = require("./models");
const saltRounds = 10;

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

function checkAdmin(user) {
  const type = user.votersId ?? "admin";
  if (type == "admin") {
    return true;
  } else {
    return false;
  }
}

function checkVoter(user) {
  const type = user.email ?? "voter";
  if (type == "voter") {
    return true;
  } else {
    return false;
  }
}

passport.use(
  "localAdmin",
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
            return done(null, false, { message: "Invalid Credentials" });
          }
        })
        .catch((error) => {
          return error;
        });
    }
  )
);

passport.use(
  "localVoter",
  new LocalStrategy(
    {
      usernameField: "votersId",
      passwordField: "votersPassword",
      passReqToCallback: true,
    },
    (request, username, password, done) => {
      const { electionId } = request.body;
      Voters.findOne({
        where: {
          votersId: username,
          electionId,
        },
      })
        .then(async (voter) => {
          if (!voter) {
            console.log("Invalid Credentials");
            return done(null, false, {
              message: "Invalid Credentials",
            });
          }
          const result = await bcrypt.compare(password, voter.votersPassword);
          if (result) {
            return done(null, voter);
          } else {
            return done(null, false, { message: "Invalid Credentials" });
          }
        })
        .catch((error) => {
          console.log("We have error at line 108");
          return error;
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing admin user in session", user.id);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  const id = user.id;
  const type = user.votersId ?? "admin";
  if (type == "admin") {
    Admin.findByPk(id)
      .then((admin) => {
        done(null, admin);
      })
      .catch((error) => {
        done(error, null);
      });
  } else {
    Voters.findByPk(id)
      .then((voter) => {
        done(null, voter);
      })
      .catch((error) => {
        done(error, null);
      });
  }
});

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

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
  try {
    response.render("signup", {
      title: "Sign up | Online Voting Platform",
      csrfToken: request.csrfToken(),
      isSignedIn: false,
    });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/login", (request, response) => {
  try {
    response.render("login", {
      title: "Login | Online Voting Platform",
      csrfToken: request.csrfToken(),
      isSignedIn: false,
    });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/login");
  });
});

app.get("/signout/voters", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/login/voters");
  });
});

app.post(
  "/sessionAdmin",
  passport.authenticate("localAdmin", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect("/elections");
  }
);

app.post(
  "/sessionVoter",
  passport.authenticate("localVoter", {
    failureRedirect: "/login/voters",
    failureFlash: true,
  }),
  (request, response) => {
    const electionId = request.body.electionId;
    response.redirect(`/elections/${electionId}/vote/question`);
  }
);

app.post("/admins", async (request, response) => {
  try {
    // Hashed Password using bcrypt
    const { password } = request.body;
    console.log("This is the password: " + password);
    if (password.length == 0) {
      request.flash("alert", "Fill the password please!");
      return response.redirect("/signup");
    }
    const hashPassword = await bcrypt.hash(password, saltRounds);
    const { firstName, lastName, email } = request.body;
    const admin = await Admin.createAdmin(
      firstName,
      lastName,
      email,
      hashPassword
    );
    request.logIn(admin, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/elections");
    });
  } catch (error) {
    console.log(error);
    if (error.name == "SequelizeUniqueConstraintError") {
      request.flash("alert", "User Already Exists.");
      return response.redirect("/signup");
    }
    if (error.errors[0].message == "Validation len on firstName failed") {
      request.flash("alert", "Enter First Name");
      return response.redirect("/signup");
    }

    if (error.errors[0].message == "Validation isEmail on email failed") {
      request.flash("alert", "Enter a valid email.");
      return response.redirect("/signup");
    }
    return response.status(422).json(error);
  }
});

app.post(
  "/createVoters",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("To create voters");
    const { electionId, voterId, password } = request.body;
    if (password.length == 0) {
      request.flash("alert", "Fill the password please!");
      return response.redirect("back");
    }
    // Create Voters
    try {
      const hashPassword = await bcrypt.hash(password, saltRounds);
      const availVoter = await Voters.findOne({
        where: {
          votersId: voterId,
          electionId,
        },
      });
      if (availVoter != null) {
        request.flash("alert", "Voter already registered");
        return response.redirect("back");
      } else {
        await Voters.create({
          votersId: voterId,
          votersPassword: hashPassword,
          electionId,
        });
        return response.redirect("back");
      }
    } catch (error) {
      console.log(error);
      if (
        error.name == "SequelizeValidationError" &&
        error.errors[0].message == "Validation len on votersId failed"
      ) {
        request.flash("alert", "Fill the voter id please!");
        return response.redirect("back");
      }
      if (
        error.name == "SequelizeUniqueConstraintError" &&
        error.errors[0].message == "votersId must be unique"
      ) {
        request.flash("alert", "Voter already registered 1");
        return response.redirect("back");
      }
      return response.status(422).json(error);
    }
  }
);

// Display elections
app.get(
  "/elections",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const admin = request.user;
      const isAdmin = checkAdmin(admin);
      // Remember to refactor test case white creating elections
      if (isAdmin) {
        const adminId = admin.id;
        const elections = await Election.getAllElections(adminId);
        if (request.accepts("html")) {
          response.render("election", {
            title: "Home | Online Voting Platform",
            csrfToken: request.csrfToken(),
            isSignedIn: true,
            elections,
            admin,
            isAdmin,
          });
        } else {
          return response.json(elections);
        }
      } else {
        return response.redirect("back");
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

// Display create election page
app.get(
  "/elections/new",
  connectEnsureLogin.ensureLoggedIn(),
  (request, response) => {
    const admin = request.user;
    const isAdmin = checkAdmin(admin);
    try {
      console.log("Display create election page");
      response.render("createElection", {
        title: "Create New Election | Online Voting Platform",
        csrfToken: request.csrfToken(),
        isSignedIn: true,
        isAdmin,
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

// Create a election
app.post(
  "/createElections",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const admin = request.user;
      const adminId = admin.id;
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
    try {
      console.log("Display election single page with details");
      const admin = request.user;
      const adminId = admin.id;
      const isAdmin = checkAdmin(admin);
      const electionId = request.params.id;
      const election = await Election.getElection(electionId, adminId);
      const questions = await Questions.getAllQuestions(electionId);
      const voters = await Voters.findAll({
        where: {
          electionId,
        },
      });
      if (election != null) {
        if (election.presentStatus == "Added") {
          response.render("manageElection", {
            title: "Manage Election | Online Voting Platform",
            csrfToken: request.csrfToken(),
            isSignedIn: true,
            election,
            questions,
            voters,
            isAdmin,
          });
        } else if (election.presentStatus == "Launched") {
          response.render("launchElection", {
            title: "Manage Election | Online Voting Platform",
            csrfToken: request.csrfToken(),
            isSignedIn: true,
            election,
            questions,
            voters,
            isAdmin,
          });
        } else if (election.presentStatus == "Ended") {
          response.render("endElection", {
            title: "Manage Election | Online Voting Platform",
            csrfToken: request.csrfToken(),
            isSignedIn: true,
            election,
            questions,
            isAdmin,
          });
        }
      } else {
        return response.render("errorpage", {
          title: "Error Page | Online Voting Platform",
          csrfToken: request.csrfToken(),
          isSignedIn: true,
          isAdmin,
          errormsg: "This is not the webpage you are looking for.",
        });
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

// Display add question page
app.get(
  "/elections/:id/questions",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      console.log("Display add question page ");
      const admin = request.user;
      const adminId = admin.id;
      const isAdmin = checkAdmin(admin);
      const electionId = request.params.id;
      const election = await Election.getElection(electionId, adminId);
      const questions = await Questions.getAllQuestions(electionId);
      if (election != null) {
        if (election.presentStatus == "Launched") {
          return response.render("errorpage", {
            title: "Access Denied | Online Voting Platform",
            csrfToken: request.csrfToken(),
            isSignedIn: true,
            isAdmin,
            errormsg:
              "Election has already been launched. Administrator can't edit the ballot of questions.",
          });
        }
        if (request.accepts("html")) {
          return response.render("question", {
            title: "Create Questions | Online Voting Platform",
            csrfToken: request.csrfToken(),
            isSignedIn: true,
            election,
            questions,
            isAdmin,
          });
        } else {
          return response.json(questions);
        }
      } else {
        return response.render("errorpage", {
          title: "Error Page | Online Voting Platform",
          csrfToken: request.csrfToken(),
          isSignedIn: true,
          isAdmin,
          errormsg: "This is not the webpage you are looking for.",
        });
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

// Display add question form page
app.get(
  "/elections/:id/questions/new",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const admin = request.user;
      const adminId = admin.id;
      const isAdmin = checkAdmin(admin);
      const electionId = request.params.id;
      const election = await Election.getElection(electionId, adminId);
      if (election != null) {
        if (election.presentStatus != "Added") {
          return response.render("errorpage", {
            title: "Access Denied | Online Voting Platform",
            csrfToken: request.csrfToken(),
            isSignedIn: true,
            isAdmin,
            errormsg:
              "You can't access this page while election is launched/ended.",
          });
        } else {
          response.render("createQuestion", {
            title: "New Question | Online Voting Platform",
            csrfToken: request.csrfToken(),
            isSignedIn: true,
            electionId,
            election,
            isAdmin,
          });
        }
      } else {
        return response.render("errorpage", {
          title: "Error Page | Online Voting Platform",
          csrfToken: request.csrfToken(),
          isSignedIn: true,
          isAdmin,
          errormsg: "This is not the webpage you are looking for.",
        });
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
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
    try {
      const questionId = request.params.id;
      const question = await Questions.getQuestion(questionId);
      const electionId = question.electionId;
      const admin = request.user;
      const adminId = admin.id;
      const isAdmin = checkAdmin(admin);
      const election = await Election.getElection(electionId, adminId);
      const getOptions = await Answers.getAllAnswers(questionId);
      if (election != null) {
        if (election.presentStatus != "Added") {
          return response.render("errorpage", {
            title: "Access Denied | Online Voting Platform",
            csrfToken: request.csrfToken(),
            isSignedIn: true,
            isAdmin,
            errormsg:
              "You can't access this page while election is launched/ended.",
          });
        } else {
          return response.render("createOptions", {
            title: "Add Options | Online Voting Platform",
            csrfToken: request.csrfToken(),
            isSignedIn: true,
            question,
            getOptions,
            election,
            isAdmin,
          });
        }
      } else {
        return response.render("errorpage", {
          title: "Error Page | Online Voting Platform",
          csrfToken: request.csrfToken(),
          isSignedIn: true,
          isAdmin,
          errormsg: "This is not the webpage you are looking for.",
        });
      }
    } catch (error) {
      console.log("Error message: ", error);
      return response.status(422).json(error);
    }
  }
);

// Create options
app.post(
  "/createOptions",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const { options, questionId } = request.body;
    try {
      await Answers.addOptions(options, questionId);
      return response.redirect(`/questions/${questionId}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

// Display add voters page
app.get(
  "/elections/:id/voters",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const admin = request.user;
      const adminId = admin.id;
      const isAdmin = checkAdmin(admin);
      const electionId = request.params.id;
      const election = await Election.getElection(electionId, adminId);
      const getVoters = await Voters.findAll({
        where: {
          electionId,
        },
      });
      if (election != null) {
        return response.render("addVoters", {
          title: "Add Voters | Online Voting Platform",
          csrfToken: request.csrfToken(),
          isSignedIn: true,
          election,
          getVoters,
          isAdmin,
        });
      } else {
        return response.render("errorpage", {
          title: "Error Page | Online Voting Platform",
          csrfToken: request.csrfToken(),
          isSignedIn: true,
          isAdmin,
          errormsg: "This is not the webpage you are looking for.",
        });
      }
    } catch (error) {
      console.log(error);
      response.status(422).json(error);
    }
  }
);

app.put(
  "/elections/:id/end",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const admin = request.user;
      const adminId = admin.id;
      const isAdmin = checkAdmin(admin);
      const electionId = request.params.id;
      const election = await Election.getElection(electionId, adminId);
      if (election != null) {
        await election.update({
          presentStatus: "Ended",
        });
        return response.redirect(`/elections/${electionId}`);
      } else {
        return response.render("errorpage", {
          title: "Error Page | Online Voting Platform",
          csrfToken: request.csrfToken(),
          isSignedIn: true,
          isAdmin,
          errormsg: "This is not the webpage you are looking for.",
        });
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

//Update the election status to launch
app.post(
  "/elections/:id/launch",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      console.log("Launch specific election.");
      const admin = request.user;
      const adminId = admin.id;
      const isAdmin = checkAdmin(admin);
      const electionId = request.params.id;
      const election = await Election.getElection(electionId, adminId);
      const questionsList = await Questions.getAllQuestions(electionId);
      const questionLength = questionsList.length;
      let questionId;
      if (election != null) {
        if (questionLength == 0) {
          request.flash("alert", "Your ballot is empty.");
          return response.redirect(`/elections/${electionId}`);
        } else {
          for (let i = 0; i < questionLength; i++) {
            questionId = questionsList[i].id;
            getOptions = await Answers.getAllAnswers(questionId);
            if (getOptions.length < 2) {
              console.log("Every options must have 2 options");
              request.flash("alert", "Questions must have 2 options");
              return response.redirect(`/elections/${electionId}`);
            }
          }
          const launch = await election.update({
            presentStatus: "Launched",
            url: `https://online-voting-08vr.onrender.com/elections/${electionId}/vote`,
          });
          response.redirect(`/elections/${electionId}`);
        }
      } else {
        return response.render("errorpage", {
          title: "Error Page | Online Voting Platform",
          csrfToken: request.csrfToken(),
          isSignedIn: true,
          isAdmin,
          errormsg: "This is not the webpage you are looking for.",
        });
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/elections/:id/previewBallot",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const admin = request.user;
      const adminId = admin.id;
      const isAdmin = checkAdmin(admin);
      const electionId = request.params.id;
      const election = await Election.getElection(electionId, adminId);
      const questions = await Questions.getAllQuestions(electionId);
      const questionLength = questions.length;
      let getOptions;
      let options = [];
      let questionId;
      for (let i = 0; i < questionLength; i++) {
        questionId = questions[i].id;
        getOptions = await Answers.getAllAnswers(questionId);
        options.push(getOptions);
      }
      return response.render("previewBallot", {
        title: "Preview Ballot | Online Voting Platform",
        csrfToken: request.csrfToken(),
        isSignedIn: true,
        election,
        questions,
        options,
        isAdmin,
      });
    } catch (error) {
      console.log(error);
      response.status(422).json(error);
    }

    // try {
    //   console.log("Hellow from prev 1")
    //   const admin = request.user;
    //   const adminId = admin.id;
    //   const isAdmin = checkAdmin(admin);
    //   const electionId = request.params.id;
    //   const election = await Election.getElection(electionId, adminId);
    //   const questions = await Questions.getAllQuestions(electionId);
    //   const questionLength = questions.length;
    //   let getOptions;
    //   let options = [];
    //   let questionId;
    //   if (isAdmin && election != null) {
    //   console.log("Hellow from prev 2")
    //     for (let i = 0; i < questionLength; i++) {
    //       questionId = questions[i].id;
    //       getOptions = await Answers.getAllAnswers(questionId);
    //       options.push(getOptions);
    //     }
    //   console.log("Hellow from prev 4")

    //     return response.render("previewBallot", {
    //       title: "Preview Ballot | Online Voting Platform",
    //       csrfToken: request.csrfToken(),
    //       isSignedIn: true,
    //       election,
    //       questions,
    //       options,
    //       isAdmin,
    //     });
    //   } else {
    //   console.log("Hellow from prev 3")
    //     return response.render("errorpage", {
    //       title: "Error Page | Online Voting Platform",
    //       csrfToken: request.csrfToken(),
    //       isSignedIn: true,
    //       isAdmin,
    //       errormsg: "This is not the webpage you are looking for.",
    //     });
    //   }
    // } catch (error) {
    //   console.log(error);
    //   return response.json(error);
    // }
  }
);

// View results after
app.get(
  "/elections/:id/viewResults",
  async (request, response) => {
    try {
      const electionId = request.params.id;
      const election = await Election.findByPk(electionId);
      const questions = await Questions.getAllQuestions(electionId);
      if(election.presentStatus == "Ended"){
        return response.render("viewResults", {
          title: "View Result | Online Voting Platform",
          csrfToken: request.csrfToken(),
          isSignedIn: false,
          election,
          questions,
        });
      }
      else{
        return response.render("errorpage", {
          title: "Access Denied | Online Voting Platform",
          csrfToken: request.csrfToken(),
          isSignedIn: false,
          isAdmin:false,
          errormsg: "The Election has not ended yet. Please wait for election to end to view results",
        });
      }
      
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

// End election
app.get(
  "elections/:id/endElection",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const admin = request.user;
      const adminId = admin.id;
      const isAdmin = checkAdmin(admin);
      const electionId = request.params.id;
      const election = await Election.getElection(electionId, adminId);
      return response.render("endElection", {
        title: "End Election | Online Voting Platform",
        csrfToken: request.csrfToken(),
        isSignedIn: true,
        election,
        isAdmin,
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
// Delete option
app.delete(
  "/options/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const id = request.params.id;
    try {
      const option = await Answers.destroy({
        where: {
          id,
        },
      });
      option ? response.json(true) : response.json(false);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/voters/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const { id } = request.params;
    try {
      const voter = await Voters.destroy({
        where: {
          id,
        },
      });
      voter ? response.json(true) : response.json(false);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/question/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      const questionId = request.params.id;
      const question = await Questions.findByPk(questionId);
      const electionId = question.electionId;
      const questionList = await Questions.findAll({
        where: {
          electionId,
        },
      });
      console.log("This is a question list length: ", questionList.length);
      if (questionList.length == 1) {
        request.flash("alert", "There must be one question in the ballot.");
        return response.redirect(`/elections/${electionId}/questions`);
      } else {
        await Answers.destroy({
          where: {
            questionId,
          },
        });
        const ques = await Questions.destroy({
          where: {
            id: questionId,
          },
        });
        response.redirect(`/elections/${electionId}/questions`);
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/question/:id/edit",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const questionId = request.params.id;
      const question = await Questions.findByPk(questionId);
      const electionId = question.electionId;
      const admin = request.user;
      const adminId = admin.id;
      const isAdmin = checkAdmin(admin);
      const election = await Election.getElection(electionId, adminId);
      response.render("editQuestion", {
        title: "Edit Question | Online Voting Platform",
        csrfToken: request.csrfToken(),
        isSignedIn: true,
        question,
        election,
        isAdmin,
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/updateQuestion/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const questionId = request.params.id;
      const { question, description } = request.body;
      const ques = await Questions.findByPk(questionId);
      const electionId = ques.electionId;
      ques.update({
        question,
        description,
      });
      return response.redirect(`/elections/${electionId}/questions`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/question/:questionId/editOption/:optionId",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const questionId = request.params.questionId;
      const question = await Questions.findByPk(questionId);
      const optionId = request.params.optionId;
      const electionId = question.electionId;
      const admin = request.user;
      const adminId = admin.id;
      const isAdmin = checkAdmin(admin);
      const election = await Election.getElection(electionId, adminId);
      const option = await Answers.findByPk(optionId);
      if (election != null) {
        if (election.presentStatus != "Added") {
          return response.render("errorpage", {
            title: "Access Denied | Online Voting Platform",
            csrfToken: request.csrfToken(),
            isSignedIn: true,
            isAdmin,
            errormsg:
              "You can't access this page while election is launched/ended.",
          });
        } else {
          return response.render("editOptions", {
            title: "Edit Option | Online Voting Platform",
            csrfToken: request.csrfToken(),
            isSignedIn: true,
            option,
            election,
            question,
            isAdmin,
          });
        }
      } else {
        return response.render("errorpage", {
          title: "Error Page | Online Voting Platform",
          csrfToken: request.csrfToken(),
          isSignedIn: true,
          isAdmin,
          errormsg: "This is not the webpage you are looking for.",
        });
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/updateOptions/:optionId",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const optionId = request.params.optionId;
      const options = request.body.option;
      const opt = await Answers.findByPk(optionId);
      const questionId = opt.questionId;
      opt.update({
        options,
      });
      return response.redirect(`/questions/${questionId}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

// Voters Section Below
app.get("/elections/:id/vote", async (request, response) => {
  try {
    console.log("Voters authentication page ");
    const electionId = request.params.id;
    request.app.set("csrfToken", request.csrfToken());
    request.app.set("electionId", electionId);
    return response.redirect("/login/voters");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/login/voters", async (request, response) => {
  try {
    const csrfToken = request.app.get("csrfToken");
    const electionId = request.app.get("electionId");
    const election = await Election.getVotersElection(electionId);
    if (election != null) {
      return response.render("votersLogin", {
        title: "Voters Login | Online Voting Platform",
        isSignedIn: false,
        csrfToken,
        election,
      });
    } else {
      return response.render("errorpage", {
        title: "Error Page | Online Voting Platform",
        csrfToken: request.csrfToken(),
        isSignedIn: false,
        isAdmin: false,
        errormsg: "This is not the webpage you are looking for.",
      });
    }
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get(
  "/elections/:id/vote/question",
  connectEnsureLogin.ensureLoggedIn("/login/voters"),
  async (request, response) => {
    try {
      console.log("Question page for voters");
      const electionId = request.params.id;
      const election = await Election.getVotersElection(electionId);
      const questions = await Questions.getAllQuestions(electionId);
      const presentStatus = election.presentStatus;
      const questionLength = questions.length;
      const user = request.user;
      const isVoter = checkVoter(user);
      let getOptions;
      let options = [];
      let questionId;
      if (isVoter) {
        for (let i = 0; i < questionLength; i++) {
          questionId = questions[i].id;
          getOptions = await Answers.getAllAnswers(questionId);
          options.push(getOptions);
        }
        if (presentStatus == "Launched") {
          if (user.voted) {
            request.app.set("presentStatus", presentStatus);
            return response.redirect("/voteCompleted");
          }
          return response.render("votersQuestion", {
            title: "Question | Online Voting Platform",
            csrfToken: request.csrfToken(),
            isSignedIn: true,
            election,
            questions,
            options,
          });
        } else if (presentStatus == "Ended") {
          request.app.set("election", election);
          return response.redirect("/electionEnded");
        } else {
          return response.redirect(`/elections/${electionId}/vote`);
        }
      } else {
        return response.render("errorpage", {
          title: "Error Page | Online Voting Platform",
          csrfToken: request.csrfToken(),
          isSignedIn: true,
          isAdmin: !isVoter,
          errormsg: "This is not the webpage you are looking for.",
        });
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/electionEnded",
  connectEnsureLogin.ensureLoggedIn("/login/voters"),
  (request, response) => {
    try {
      const user = request.user;
      const isVoter = checkVoter(user);
      if (isVoter) {
        const election = request.app.get("election");
        // const question =
        return response.render("electionEnded", {
          title: "Election Ended | Online Voting Platform",
          csrfToken: request.csrfToken(),
          isSignedIn: true,
          election,
        });
      } else {
        return response.render("errorpage", {
          title: "Error Page | Online Voting Platform",
          isSignedIn: true,
          isAdmin: !isVoter,
          errormsg: "This is not the webpage you are looking for.",
        });
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/voteCompleted",
  connectEnsureLogin.ensureLoggedIn("/login/voters"),
  (request, response) => {
    try {
      const presentStatus = request.app.get("presentStatus");
      return response.render("votingCompleted", {
        title: "Voting Completed | Online Voting Platform",
        csrfToken: request.csrfToken(),
        isSignedIn: true,
        presentStatus,
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/submitElection",
  connectEnsureLogin.ensureLoggedIn("/login/voters"),
  async (request, response) => {
    try {
      const user = request.user;
      const isVoter = checkVoter(user);
      if (isVoter) {
        const votersId = user.id;
        const { electionId } = request.body;
        const election = await Election.getVotersElection(electionId);
        const presentStatus = election.presentStatus;
        const questionsList = await Questions.getAllQuestions(electionId);
        const questionLength = questionsList.length;
        let questionId;
        let optionId;
        for (let i = 0; i < questionLength; i++) {
          let optIndex = `options${i}`;
          optionId = request.body[optIndex];
          questionId = questionsList[i].id;
          await Result.create({
            votersId,
            optionId,
            questionId,
            electionId,
          });
        }
        const voter = await Voters.findByPk(votersId);
        voter.update({
          voted: true,
        });
        request.app.set("presentStatus", presentStatus);
        return response.redirect("/voteCompleted");
      } else {
        return response.render("errorpage", {
          title: "Error Page | Online Voting Platform",
          csrfToken: request.csrfToken(),
          isSignedIn: true,
          isAdmin: !isVoter,
          errormsg: "This is not the webpage you are looking for.",
        });
      }
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

module.exports = app;
