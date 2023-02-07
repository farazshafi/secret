//jshint esversion:6
require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


const User = new mongoose.model("User", userSchema);

app.get("/", ((req, res) => {
    res.render("home");
}))

app.get("/login", ((req, res) => {
    res.render("login");
}))

app.post("/login", function (req, res) {
    const userName = req.body.username;
    const userPassword = md5(req.body.password);

    User.findOne({ email: userName }, ((err, foundedOne) => {
        if (err) {
            res.send("You Have an erro while finding Your data , The error is " + err);
        } else {
            if (foundedOne) {
                if (foundedOne.password === userPassword) {
                    res.render("secrets")
                }else{
                    res.send("Your Password is wrong , Please check your password again")
                }
            };
        };
    }));

})

app.get("/register", ((req, res) => {
    res.render("register");

}));

app.post("/register", function (req, res) {
    const newuser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    })
    newuser.save((err) => {
        if (err) {
            res.send("You have a error While saving user data" + err);
        } else {
            res.render("secrets");
        }
    });
});






app.listen(3000, function () {
    console.log("Server started on port 3000");
})