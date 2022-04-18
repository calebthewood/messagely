"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { UnauthorizedError, NotFoundError } = require("../expressError");


/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING username, password, first_name, last_name, phone`,
      [username, bcrypt.hash(password, 12), first_name, last_name, phone],
    );
    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
         FROM users
         WHERE username = $1`,
      [username]);
    const user = result.rows[0];

    if (user) {
      if (await bcrypt.compare(password, user.password) === true) {
        return true;
      }
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {

    const result = await db.query(
      `UPDATE users
       SET last_login_at = current_timestamp
         WHERE id = $1;`,
      [username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No such user: ${username}`);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {

    const usersList = await db.query(`
    SELECT username, first_name, last_name
      FROM users
      ORDER BY username;
    `);

    return usersList.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {

    const results = await db.query(`
    SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username = $1;
    `, [username]);

    const user = results.rows[0];
    if (!user) throw new NotFoundError(`No such user: ${username}`);

    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {

    const results = await db.query(`
      SELECT id, to_username, body, sent_at, read_at
        FROM messages
        WHERE from_username = $1
        ORDER BY sent_at DESC
    `, [username]);


    const fromMessages = results.rows.map( row => {
      row.to_user = await User.get(row.to_username);
    });


  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
  }
}


module.exports = User;
