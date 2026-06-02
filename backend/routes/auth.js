const express = require("express");
const router = express.Router();
const pool = require("../config/db");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExist = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (userExist.rows.length > 0) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    const newUser = await pool.query(
      `INSERT INTO users(name,email,password)
       VALUES($1,$2,$3)
       RETURNING *`,
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: "User Registered",
      user: newUser.rows[0]
    });

  } catch (error) {
    res.status(500).json(error.message);
  }
});

router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    const validPassword =
      await bcrypt.compare(
        password,
        user.rows[0].password
      );

    if (!validPassword) {
      return res.status(400).json({
        message: "Wrong Password"
      });
    }

    const token = jwt.sign(
      {
        id: user.rows[0].id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.json({
      message: "Login Success",
      token
    });

  } catch (error) {
    res.status(500).json(error.message);
  }

});

module.exports = router;
