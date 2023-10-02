const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const emailer = require('../emailer/emailservice');
const Joi = require('joi');

const { dbcreds, saltrounds } = require('../links');
const pwgenerator = require('./pwgenerator');

//According to SOLID principle 
//S -> Single Responsibilty Priciple which means one module/class should only have one proper task/responsibility
// /api/register unprotected, change anyone's password

const schema = Joi.object({
  email: Joi.string().max(40).required(),
  vehiclenum: Joi.string().max(15).required(),
});

// Validation middleware
function validate(req, res, next) 
{
  // Validate the request body against the login schema
  const { error } = schema.validate(req.body);

  if (error) {
    // Return a 400 Bad Request response with the validation error details
    return res.status(400).json({ error: error.details[0].message });
  }

  // Proceed to the next middleware or route handler
  next();
}

// actual router callback cannot run without the middleware validation

router.post('/api/forgotpw', validate , async (req, res) => {

  const {email,vehiclenum} = req.body;

  // Create a MySQL connection
  const db = mysql.createConnection(dbcreds);

  try {
    // Connect to the database
      await new Promise((resolve, reject) => {
        db.connect( (err) => {
        if (err) {
          console.error('Error connecting to DB:');
          reject(err);
        } else {
          console.log('Connected to DB');
          resolve();
        }
      });
    });

    // check whether the user creds are right

    const sql0 = 'SELECT count(*) AS user FROM users WHERE email=? AND (vehiclenum1=? OR vehiclenum2=?)';

    // Execute the query to retrieve user data
    const [user] = await new Promise((resolve, reject) => {
    db.query(sql0, [email,vehiclenum,vehiclenum], async (err,results) => {
        if (err) {
          console.error('Error executing query:', err);
          reject(err);
        } else {
          console.log('Results',results);
          resolve(results);
        }
      });
    });

    console.log(user);
    // if user not exist send 404 user not found
    if(!user.user)
    {
        return res.json({message:"Wrong email,or vehiclenum"}).status(404);
    }

    // generate a password

    const newpassword = pwgenerator.genpw();
    console.log(newpassword);

    // store the newpassword in the database

    const hashedpw = bcrypt.hashSync(newpassword,saltrounds);

    // update the password by newpassword
    const sql1 = 'UPDATE users SET password = ? WHERE email=? AND (vehiclenum1=? OR vehiclenum2=?)';

    // Execute the query to retrieve user data
    await new Promise((resolve, reject) => {
    db.query(sql1, [hashedpw,email,vehiclenum,vehiclenum], async (err) => {
        if (err) {
          console.error('Error executing query:', err);
          reject(err);
        } else {
          console.log('Updated the password');
          resolve();
        }
      });
    });

    const txt = `Your new Password for parking management system is ${newpassword}`;
    const emailsent = await emailer.gmailer(email,'Password Reset',txt);

    if (emailsent) {
      return res.status(200).json({ message: 'Password reset email sent successfully' });
    } else {
      return res.status(500).json({ message: 'Error sending password reset email' });
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
