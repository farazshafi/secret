//jshint esversion:6
require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


const app = express();

mongoose.set('strictQuery', false);

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: "Our Little Secret",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session())

mongoose.connect("mongodb://127.0.0.1:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId : String,
    secret : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user,done){
    done(null, user.id);
});

passport.deserializeUser(function(id,done){
    User.findById(id,function(err,user){
        done(err,user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    }); 
  }
));

app.get("/", ((req, res) => {
    res.render("home");
}))

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] 
}));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secret.
    res.redirect('/secrets');
  });

app.get("/login", ((req, res) => {
    res.render("login");
}))

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            })
        }
    })

})



app.get("/register", ((req, res) => {
    res.render("register");

}));

app.get("/secrets", function (req, res) {

    User.find({"secret":{$ne:null}},((err,foundedUser)=>{
        if(err){
            console.log(err);
        }else{
            
            if(foundedUser){
                res.render("secrets",{foundedUser:foundedUser});
            }
        }
    }))


})

app.get("/submit",((req,res)=>{
    if (req.isAuthenticated()){
        res.render("submit")
    }else{
        res.redirect("/login");
    }
}))

app.post("/submit",((req,res)=>{
    const userSecret = req.body.secret;

    User.findById(req.user.id,((err,foundeduser)=>{
        if(err){
            console.log(err);
        }else{
            if(foundeduser){
                foundeduser.secret = userSecret;
                foundeduser.save(()=>{
                    res.redirect("/secrets")
                });
            }
        }
    }))
    console.log(req.user.id);
}))

app.get("/logout", function (req, res) {
    req.logout((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/")
        }
    });

})

app.post("/register", function (req, res) {

    User.register({ username: req.body.username }, req.body.password, function (err, result) {
        if (err) {
            console.log(err);
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            })
        }
    })

});






app.listen(3000, function () {
    console.log("Server started on port 3000");
})