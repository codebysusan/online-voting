const app = require('./app');
const port = 4000;

app.get("/", (request,response)=>{
    response.send("Hello World");
});

app.listen(port, ()=>{
    console.log("Express server is started at port: "+ port );
});