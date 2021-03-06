const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");

//load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

//load user model
const User = require("../../models/User");

//@route POST api/users/register
//@desc Register user
//@access Public
router.post("/register", (req, res) => {
  //form validation
  const { errors, isValid } = validateRegisterInput(
    req.body
  );

  //check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ userName: req.body.userName }).then(
    (user) => {
      if (user) {
        return res
          .status(400)
          .json({ userName: "User name already exists" });
      } else {
        const newUser = new User({
          userName: req.body.userName,
          password: req.body.password,
          age: req.body.age,
        });

        //Hash password before saving in db
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(
            newUser.password,
            salt,
            (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              newUser
                .save()
                .then((user) => res.json(user))
                .catch((err) => console.log(err));
            }
          );
        });
      }
    }
  );
});

//@route POST api/users/login
//@desc Login User and return JWT token
//@access Public
router.post("/login", (req, res) => {
  //Form validation
  const { errors, isValid } = validateLoginInput(req.body);

  //Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const userName = req.body.userName;
  const password = req.body.password;

  //Find user by username
  User.findOne({ userName }).then((user) => {
    //Check if user exists
    if (!user) {
      return res.status(404).json({
        userNamenotfound: "User name is not found",
      });
    }

    //Check password
    bcrypt
      .compare(password, user.password)
      .then((isMatch) => {
        if (isMatch) {
          //User matched
          //Create JWT Payload
          const payload = {
            id: user.id,
            name: user.userName,
          };
          //Sign token
          jwt.sign(
            payload,
            keys.secretOrKey,
            {
              expiresIn: 31556926, //1 yr in s
            },
            (err, token) => {
              res.json({
                success: true,
                token: "Bearer " + token,
              });
            }
          );
        } else {
          return res.status(400).json({
            passwordincorrect: "Password incorrect",
          });
        }
      });
  });
});

//Export router
module.exports = router;
