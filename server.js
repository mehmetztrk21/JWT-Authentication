require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");

const posts = [
    {
        username: "mehmet",
        title: "post 1"
    },
    {
        username: "ahmet",
        title: "post 2"
    }
]

let refreshTokens = [];


const app = express();
app.use(express.json());

app.get("/posts", authenticateToken, (req, res) => {
    console.log(req.user)
    const user = req.user;
    res.json({ posts: posts.filter(i => i.username === user.username) });
});

app.post("/token", (req, res) => {
    const refreshToken = req.body.token;
    if (refreshToken == null) return res.sendStatus(401);
    if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = generateAccessToken({ username: user.username });
        res.json({ accessToken: accessToken });

    });
})

app.post("/login", (req, res) => {
    const username = req.body.username;
    const user = { username: username };

    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
    refreshTokens.push(refreshToken);
    res.json({ accessToken: accessToken, refreshToken: refreshToken })
});

app.delete("/logout", (req, res) => {
    console.log(req.body.token, refreshTokens)
    refreshTokens = refreshTokens.filter(i => i != req.body.token);
    console.log(req.body.token);
    return res.sendStatus(204);
})

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.status(401).json({ message: "Unauthorized." });

    jwt.verify(token, process.env.ACCES_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCES_TOKEN_SECRET);
}

app.listen(3000);