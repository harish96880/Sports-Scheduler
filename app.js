const express = require("express");
const app = express();
const {
  Todo,
  User,
  Sports,
  sessions,
  SessionsV3,
  players,
  sessionDateTime,
} = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
const { Model, Op } = require("sequelize");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
var csurf = require("tiny-csrf");
var cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const user = require("./models/user");
const fs = require("fs");
const { log } = require("console");
const { Session } = require("inspector");

const saltRounds = 10;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csurf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(flash());
app.use(
  session({
    secret: "my-super-secret-key-21728172615261562",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({
        where: {
          email: username,
        },
      })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        })
        .catch((error) => {
          return done(null, false, {
            message: "Account doesn't exist for this mail id",
          });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.set("view engine", "ejs");

app.get("/", async (request, response) => {
  response.render("index", {
    title: "Sports-Scheduler",
    "csrfToken": request.csrfToken(), //prettier-ignore
  });
});

app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const overdueTodoItems = await Todo.overdueTodo(loggedInUser);
    const duetodayTodoItems = await Todo.duetodayTodo(loggedInUser);
    const duelaterTodoItems = await Todo.duelaterTodo(loggedInUser);
    const completedTodoItems = await Todo.markAsCompletedItems(loggedInUser);
    // const getUserName = await User.getName(loggedInUser);
    if (request.accepts("html")) {
      response.render("todo", {
        title: "Harish Todo-Manager",
        overdueTodoItems,
        duelaterTodoItems,
        duetodayTodoItems,
        completedTodoItems,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({ overdueTodoItems, duetodayTodoItems, duelaterTodoItems });
    }
  }
);

// app.get("/signup", (request, response) => {
//   response.render("signup", {
//     title: "Signup",
//     "csrfToken": request.csrfToken(), //prettier-ignore
//   });
// });

app.get("/login", (request, response) => {
  response.render("index", {
    title: "Login",
    "csrfToken": request.csrfToken(), //prettier-ignore
  });
});

app.get("/signout", (request, response) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.post("/users", async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  console.log(hashedPwd);
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(error);
      }
      response.redirect("/todos");
    });
  } catch (error) {
    console.log(error);
  }
});

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "images")));

app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  // FILL IN YOUR CODE HERE

  // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
  // Then, we have to respond with all Todos, like:
  // response.send(todos)
  try {
    const todo = await Todo.getTodo();
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log(request.user);
    try {
      const todo = await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id,
      });
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.put(
  "/todos/:id/markAsCompleted",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("we have to update a todo with ID:", request.params.id);
    const todo = await Todo.findByPk(request.params.id);
    try {
      const updatedtodo = await todo.setCompletionStatus(
        request.body.completed
      );
      return response.json(updatedtodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const todo = await Todo.findByPk(request.params.id);
    try {
      const updatedTodo = await todo.setCompletionStatus(
        request.body.completed
      );
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a Todo with ID: ", request.params.id);

    try {
      await Todo.remove(request.params.id, request.user.id);
      return response.json(true);
    } catch (error) {
      return response.status(422).json(error);
    }
  }
);

//***************************************Sports Scheduler*********************************************
app.get(
  "/Sports/:name/deleteSession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const deleteSessionId = request.params.id;
    const nameofSport = request.params.name;
    const deletePlayer = await sessions.destroy({
      where: {
        id: deleteSessionId,
      },
    });
    return response.redirect(`/Sports/${nameofSport}`);
  }
);

app.get(
  "/Sports/:name/sessionDetail/delete/:id/sessionid/:sessionid",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const deletePlayerId = request.params.id;
    const nameofSport = request.params.name;
    const sessionId = request.params.sessionid;
    const deletePlayer = await players.destroy({
      where: {
        id: deletePlayerId,
      },
    });
    return response.redirect(
      `/Sports/${nameofSport}/sessionDetail/${sessionId}`
    );
  }
);

app.post(
  "/Sports/:name/sessionDetail/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sportName = request.params.name;
    const sportId = request.params.id;
    const playerName = request.body.playerNames;
    const create = await players.create({
      playerNames: playerName,
      sportmatch: sportName,
      sessionId: sportId,
    });
    return response.redirect(`/Sports/${sportName}/sessionDetail/${sportId}`);
  }
);

app.get(
  "/Sports/:name/sessionDetail/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sessionSportName = request.params.name;
    const sessionSportId = request.params.id;
    const getSessionDetail = await sessions.findOne({
      where: {
        id: sessionSportId,
      },
    });
    const getPlayers = await players.findAll({
      where: {
        sessionId: sessionSportId,
        sportmatch: sessionSportName,
      },
    });
    const getPlayersCount = await players.count({
      where: {
        sessionId: sessionSportId,
        sportmatch: sessionSportName,
      },
    });
    response.render("sessionDetailPage", {
      "csrfToken": request.csrfToken(), //prettier-ignore
      sessionSportName,
      sessionSportId,
      getSessionDetail,
      getPlayers,
      getPlayersCount,
    });
  }
);

app.get(
  "/SportDetail",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    return response.render("sportDetailPage2");
  }
);

app.get(
  `/delete/:id`,
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const idSport = await Sports.findByPk(request.params.id);
    const sportsItems = await Sports.findAll();
    try {
      console.log("====================================");
      console.log(idSport.Sports_Name);
      console.log("====================================");
      await sessions.destroy({
        where: {
          sportname: idSport.Sports_Name,
        },
      });
      await Sports.destroy({
        where: {
          id: request.params.id,
        },
      });
      return response.redirect("/admin");
    } catch (error) {
      console.log(error);
    }
  }
);

app.get(
  "/Sports/:name",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const SportsName = request.params.name;
    const getSportName = await sessions.getSport(SportsName);
    // const getSessionsTime = await SessionsV3.findOne({
    //   where: {
    //     sportname2: SportsName,
    //   },
    // });

    console.log(getSportName);
    return response.render("sportDetailPage", {
      name: SportsName,
      "csrfToken": request.csrfToken(), //prettier-ignore
      getSportName,
    });
  }
);

app.post("/Sports/:name", async (request, response) => {
  const Date = request.body.session;
  const name = request.params.name;
  const time = request.body.time;
  const address = request.body.Address;
  const playersCount = request.body.numberOfPlayers;
  try {
    const inputData = await sessions.create({
      sportname: request.params.name,
      session: Date,
      time: time,
      Address: address,
      countOfPlayers: playersCount,
    });
    const PlayersName = await players.create({
      playerNames: request.body.players,
      sportname: name,
    });
    console.log(inputData);
    console.log("====================================");
    console.log(PlayersName);
    console.log("====================================");
    return response.redirect(`/Sports/${name}`);
  } catch (error) {
    console.log(error);
  }
});

app.get("/Sports/:name/NewSession", async (request, response) => {
  return response.render("sessionCreation", {
    title: request.params.name,
    "csrfToken": request.csrfToken(), //prettier-ignore
  });
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (request, response) => {
    console.log(request.user);
    if (
      request.body.email === "adminhari@gmail.com" &&
      request.body.password === "admin9843"
    ) {
      return response.redirect("/admin");
    }
    response.redirect("/todos");
  }
);

app.get(
  "/admin",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sportsItems = await Sports.findAll();
    const sportsItemsUser = await Sports.findOne();
    if (request.accepts("html")) {
      response.render("adminHomePage", {
        sportsItems: sportsItems,
        "csrfToken": request.csrfToken(), //prettier-ignore
        user: sportsItemsUser,
      });
    }
  }
);

app.get(
  "/sportsCreation",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    return response.render("sportsCreation", {
      "csrfToken": request.csrfToken(), //prettier-ignore
    });
  }
);

app.post("/newsport", async (request, response) => {
  const inputFieldNewSport = request.body.Sports_Name;
  const existingSport = await Sports.findOne({
    where: { Sports_Name: inputFieldNewSport },
  });
  if (existingSport) {
    response.send("Already Exist in the database");
  } else {
    try {
      const inputData = await Sports.create({
        Sports_Name: inputFieldNewSport,
      });
      console.log(inputData);
      return response.redirect("/admin");
    } catch (error) {
      console.log(error);
    }
  }
});

app.get("/newsport", async (request, response) => {
  const getSingleSport = await Sports.findOne({
    where: {
      Sports_Name: "Check",
    },
  });
  try {
    return response.render("sportDetailPage", {
      getSingleSport,
      name: getSingleSport.Sports_Name,
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = app;
