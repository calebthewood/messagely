"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const bcrypt = require("bcrypt");
const {BCRYPT_WORK_FACTOR} = require("../config")


/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register( username, password, first_name, last_name, phone ) {
    console.log(password, BCRYPT_WORK_FACTOR);
    let hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
       VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
       RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone],
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

      return user && await bcrypt.compare(password, user.password);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {

    const result = await db.query(
      `UPDATE users
        SET last_login_at = current_timestamp
        WHERE username = $1
        RETURNING username, last_login_at`,
      [username]);

    const user = result.rows[0];

    // const test = await db.query(`
    // SELECT last_login_at
    // FROM users
    // WHERE`)

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

    const result = await db.query(
      `SELECT m.id,
              m.from_username,
              m.to_username,
              t.first_name AS to_first_name,
              t.last_name AS to_last_name,
              t.phone AS to_phone,
              m.body,
              m.sent_at,
              m.read_at
         FROM messages AS m
                JOIN users AS f ON m.from_username = f.username
                JOIN users AS t ON m.to_username = t.username
         WHERE m.from_username = $1`,
      [username]);

    let messages = result.rows.map(row => {
      return {
        id: row.id,
        body: row.body,
        sent_at: row.sent_at,
        read_at: row.read_at,
        to_user: {
          username: row.to_username,
          first_name: row.to_first_name,
          last_name: row.to_last_name,
          phone: row.to_phone
        }
      }
    });

    return messages;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {

    const result = await db.query(
      `SELECT m.id,
              m.from_username,
              f.first_name AS from_first_name,
              f.last_name AS from_last_name,
              f.phone AS from_phone,
              m.to_username,
              m.body,
              m.sent_at,
              m.read_at
         FROM messages AS m
                JOIN users AS f ON m.from_username = f.username
                JOIN users AS t ON m.to_username = t.username
         WHERE m.to_username = $1`,
      [username]);

    let messages = result.rows.map(row => {
      return {
        id: row.id,
        body: row.body,
        sent_at: row.sent_at,
        read_at: row.read_at,
        from_user: {
          username: row.from_username,
          first_name: row.from_first_name,
          last_name: row.from_last_name,
          phone: row.from_phone
        }
      }
    });

    return messages;
  }
}

module.exports = User;

