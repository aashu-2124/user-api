const express = require('express');
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const userService = require("./user-service.js");

dotenv.config();

const HTTP_PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET;

// Setup JWT strategy
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, function(jwt_payload, done) {
    // Find user by ID in the payload
    userService.findUserById(jwt_payload._id)
        .then(user => {
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        })
        .catch(err => {
            return done(err, false);
        });
}));

app.use(express.json());
app.use(cors());
app.use(passport.initialize());

// Login route
app.post("/api/user/login", (req, res) => {
    userService.checkUser(req.body)
        .then(user => {
            // Generate JWT token
            const payload = {
                _id: user._id,
                userName: user.userName
            };
            const token = jwt.sign(payload, JWT_SECRET);
            res.json({ message: "Login successful", token: token });
        })
        .catch(msg => {
            res.status(422).json({ message: msg });
        });
});

// Protected routes
app.get("/api/user/favourites", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.getFavourites(req.user._id)
        .then(data => {
            res.json(data);
        })
        .catch(msg => {
            res.status(422).json({ error: msg });
        });
});

// Define other protected routes...

userService.connect()
    .then(() => {
        app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
    })
    .catch((err) => {
        console.log("Unable to start the server: " + err);
        process.exit();
    });
