"use strict";

const Router = require("express").Router;
const router = new Router();
const User = require("../models/user");

const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");


// any logged-in user can see the list of users
// only the sender or recipient of a message can view the message-detail route
// only the recipient of a message can mark it as read
// any logged in user can send a message to any other user
// only that user can view their get-user-detail route, or their from-messages or to-messages routes.


/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name}, ...]}
 *
 **/

router.get("/",
  ensureLoggedIn,
  async function (req, res, next) {

    const users = await User.all();

    return res.json({ users });
  });



/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get("/:username",
  ensureLoggedIn,
  async function (req, res, next) {
    const username = req.query.username;
    const user = await User.get(username);

    return res.json({ user });
  });




/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get("/:username/to",
  ensureLoggedIn,
  ensureCorrectUser,
  async function (req, res, next) {
    const username = req.query.username;
    const messages = await User.messagesTo(username);

    return res.json({ messages });
  });



/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get("/:username/from",
  ensureLoggedIn,
  ensureCorrectUser,
  async function (req, res, next) {
    const username = req.query.username;
    const messages = await User.messagesFrom(username);

    return res.json({ messages });
  });

module.exports = router;