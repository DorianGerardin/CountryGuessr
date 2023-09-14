/* _____ ______ _______      ________ _____  
  / ____|  ____|  __ \ \    / /  ____|  __ \ 
 | (___ | |__  | |__) \ \  / /| |__  | |__) |
  \___ \|  __| |  _  / \ \/ / |  __| |  _  / 
  ____) | |____| | \ \  \  /  | |____| | \ \ 
 |_____/|______|_|  \_\  \/   |______|_|  \_\  */

                                             
const express = require('express'); //Import the express dependency
const app = express();              //Instantiate an express app, the main work horse of this server
const port = process.env.PORT || 8080;                  //Save the port number where your server will be listening

//Idiomatic expression in express to route and respond to a client request
app.get('/', (req, res) => {        //get requests to the root ("/") will route here
    res.sendFile('index.html', {root: __dirname});      //server responds by sending the index.html file to the client's browser
                                                        //the .sendFile method needs the absolute path to the file, see: https://expressjs.com/en/4x/api.html#res.sendFile 
});

app.get('/guess', function (req, res) {

  res.header("Content-Type",'application/json');

})

app.use("/static", express.static('./static/'));

app.listen(port, () => {            //server starts listening for any attempts from a client to connect at port: {port}
    console.log(`Now listening on port ${port}`); 
});
