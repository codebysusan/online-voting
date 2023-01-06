/* eslint-disable no-unused-vars */
const express = require('express');
const app = express();
const { Election } = require('./models');
const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.get("/", (request,response)=>{
    console.log("Home page");
    response.send("Hello World");
});

app.get("/elections", (request,response)=>{
    
});

// Display create election page
app.get("/elections/new", (request,response)=>{
    console.log("To create the elections");
    response.render("", {
        title: "Create New Election",
      });
});

// Create a election
app.post("/elections/create", async(request,response) =>{
    const title = request.body.title;
    try {
        const election = await Election.addElection(title);
        return response.json(election);
    } catch (error) {
        console.log(error);
        return response.status(422).json(error);
    }
});

// Display election single page w details
app.get("/elections/:id", async (request,response)=>{
    console.log("Election page details");
    const election = await Election.findByPk(request.params.id);
    const {title} = election;
    response.render("",{
        title: title
    });
});

// Display election title and add question
app.get("/elections/:id/questions", async (request,response)=>{
    console.log("Manage question single page + add question ");
    const election = await Election.findByPk(request.params.id);
    const {title} = election;
    response.render("",{
        title: title
    });
});

// Create a add question form and submit through w corresponding 
app.get("/elections/:id/questions/new", async (request,response)=>{
    console.log("Add question submit form");
    const election = await Election.findByPk(request.params.id);
    const {title} = election;
    response.render("",{
        title: title
    });
});

app.post("/elections/:id/questions/new/create", async (request,response)=>{
    console.log("Add question submit form");
    // const question = request.body.question
    const {question , description} = request.body;
});

// Add options for a question with corresponding id 
app.get("/questions/:id", (request,response)=>{
    console.log("Add option for particular question must have minimum 2 options.")
});

// Display + add voters 
app.get("/elections/:id/voters", (request,response)=>{
    console.log("Addition of new voters and ")
});

// 
app.put("/elections/:id/launch", async (request,response)=>{
    console.log("Launch specific election.");

    const election = await Election.findByPk(request.params.id);

    try {
        const launch = await election.update({
            status: "Launch"
        });
        return response.json(launch);
    } catch (error) {
        console.log(error);
        return response.status(422).json(error);
    } 
});



module.exports = app;