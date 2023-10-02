const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { dbcreds, saltrounds } = require('../links');
const emailer = require('../emailer/emailservice');
const Joi = require('joi');


//According to SOLID principle 
//S -> Single Responsibilty Priciple which means one module/class should only have one proper task/responsibility

// /api/updatepw protected, updating password of anyone


// schema for validation

const schema = Joi.object({
   newpassword : Joi.string().min(5).required(),
});

function validate(req, res, next) 
{

  const {error} = schema.validate(req.body);

  if (error) {
    // Return a 400 Bad Request response with the validation error details
    return res.status(400).json({ error: error.details[0].message });
  }

  // Proceed to the next middleware or route handler
  next();

}

router.post('/api/updatepw',validate , async (req, res) => {

  const {newpassword} = req.body;
  const userid = req.user.userid;

  // Create a MySQL connection
  const db = mysql.createConnection(dbcreds);

  try {
    // Connect to the database

      await new Promise((resolve, reject) => {
        db.connect( (err) => {
        if (err) 
        {
          console.error('Error connecting to MySQL:', err);
          reject(err);
        } 
        else 
        {
          console.log('Connected to DB');
          resolve();
        }
      });
    });

    // hashing of the password    
    const hashedpw = bcrypt.hashSync(newpassword, saltrounds); 

    // update the password of the user
    const sql1 = 'UPDATE users SET password = ? WHERE userid=?';
    const sql2 = 'SELECT email FROM users WHERE userid=?';

    await new Promise((resolve, reject) => {
      db.query(sql1, [hashedpw,userid] ,(err) => {
        if (err) {
          console.error('Error executing query:', err);
          reject(err);
        } else {
          console.log('Inserted into the record');
          resolve();
        }
      });
    });

    const [email] = await new Promise((resolve, reject) => {
        db.query(sql2, [userid] ,(err,results) => {
          if (err) 
          {
            console.error('Error executing query:', err);
            reject(err);
          } 
          else 
          {
            console.log('Got the email');
            resolve(results);
          }
        });
      });

    console.log(email,userid);

    // send mail about password updated
    const txt = `Your password has been updated`;
    const emailsent = await emailer.gmailer(email.email,'Password update',txt);

    
    if (emailsent) {
        return res.status(200).json({ message: 'you password has been updated' });
      } else {
        return res.status(500).json({ message: 'Error sending password update email' });
      }

  }

  catch (err) 
  {
    // If an error is caught
    console.error('Catch Error:', err);
    return res.status(500).json({ message: 'Some server error ' });
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