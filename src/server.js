/* eslint-env node */

var express = require("express")
var app = express()

/*
app.get("/", function (req, res) {
  res.send("Hello World!")
})
*/

app.use(express.static(__dirname + "/ui"))

app.listen(3000, function () {
    console.log("Twirlip7 app listening on port 3000")
    console.log("http://localhost:3000/")
})