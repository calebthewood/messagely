"use strict";

const Router = require("express").Router;
const User = require("../models/user");
const {SECRET_KEY} = require("../config");
const jwt = require("jsonwebtoken");
const { UnauthorizedError, BadRequestError } = require("../expressError");
const router = new Router();

/** POST /login: {username, password} => {token} */

router.post("/login", async function(req, res, next) {
    const {username, password} = req.body;

    if (await User.authenticate(username, password)){
        await User.updateLoginTimestamp;
        let payload = {username: username, password: password};
        let token = jwt.sign(payload, SECRET_KEY);

        return res.json({ token });
    }
    throw new UnauthorizedError("Invalid user/password");
});


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post("/register", async function(req, res, next){
    const {username, password, first_name, last_name, phone} = req.body;
    try{
        await User.register(username, password, first_name, last_name, phone);

        let payload = {username: username, password: password};
        let token = jwt.sign(payload, SECRET_KEY);

        return res.json({ token });
    }
    catch (err){
        throw err;
    }
})

module.exports = router;