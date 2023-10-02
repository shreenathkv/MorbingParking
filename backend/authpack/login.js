const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const { dbcreds, secretkey } = require('../links');

//According to SOLID principle 
//S -> Single Responsibilty Priciple which means one module/class should only have one proper task/responsibility
// /api/login unprotected, only logs in the user, sends back a token


// validation schema for the login request
// essesntial to enforce standard data formats

const schema = Joi.object({
  email: Joi.string().max(40).required(),
  password: Joi.string().required(),
});

// Validation middleware
function validateLogin(req, res, next) {
  // Validate the request body against the login schema
  const { error } = schema.validate(req.body);

  if (error) {
    // Return a 400 Bad Request response with the validation error details
    return res.status(400).json({ error: error.details[0].message });
  }

  // Proceed to the next middleware or route handler
  next();
}

// actual router before that middleware 

router.post('/api/login', validateLogin , async (req, res) => {
  const { email, password } = req.body;

  // Create a MySQL connection
  const db = mysql.createConnection(dbcreds);

  try {
    // Connect to the database

      await new Promise((resolve, reject) => {
        db.connect( (err) => {
        if (err) {
          console.error('Error connecting to MySQL:', err);
          reject(err);
        } else {
          console.log('Connected to DB');
          resolve();
        }
      });
    });


    // Use parameterized query to avoid SQL injection
    const sql1 = 'SELECT roleid, userid, email, password FROM users WHERE email = ?';

    // Execute the query to retrieve user data
    const [row] = await new Promise((resolve, reject) => {
      db.query(sql1, [email], async (err, results) => {
        if (err) {
          console.error('Error executing query:', err);
          reject(err);
        } else {
          console.log('Results:', results);
          resolve(results);
        }
      });
    });

    // Check if a user was found
    if (!row) {
      console.log('No such user');
      return res.status(404).json({ message: 'No such user' });
    }

    // Now you can safely access the user data
    const hashedPassword = row.password;
    const userid = row.userid;
    console.log(userid);
    const roleid = row.roleid;
    // Compare the hashed password with the input password using bcrypt
    
    if (await bcrypt.compare(password, hashedPassword)) 
    {
      console.log('Login success as ',roleid);

      // Generate a JWT token with the user's information
      const token = jwt.sign({ "userid":userid, "roleid":roleid}, secretkey, { expiresIn: '5h' });

      // Send the token as part of the response
      return res.status(200).json({ message: 'Login success', token });
    } 
    else 
    {
      console.log('Login failed: Incorrect password');
      return res.status(401).json({ error: 'Incorrect password' });
    }
  } 
  catch (err) 
  {
    // If an error is caught
    console.error('Catch Error:', err);
    return res.status(500).json({ message: 'Some server error: ' });
  } 
  finally 
  {
    // Close the database connection
    db.end((err) => {
      if (err) {
        console.error('Error closing database connection:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
});

module.exports = router;
