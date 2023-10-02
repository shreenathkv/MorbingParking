const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const { dbcreds, saltrounds } = require('../links');
const emailer = require('../emailer/emailservice');

//According to SOLID principle 
//S -> Single Responsibilty Priciple which means one module/class should only have one proper task/responsibility
// /api/register unprotected, registration for freelancer

const schema = Joi.object({
  email: Joi.string().max(40).email().required(),
  vehiclenum: Joi.string().max(15).required(),
  name: Joi.string().max(20).required(),
  password : Joi.string().required(),
  mob : Joi.string().max(10).optional(),
});

// Validation middleware
function validate(req, res, next) {
  // Validate the request body against the login schema
  const { error } = schema.validate(req.body);

  if (error) {
    // Return a 400 Bad Request response with the validation error details
    return res.status(400).json({ error: error.details[0].message });
  }

  // Proceed to the next middleware or route handler
  next();
}

router.post('/api/register', validate , async (req, res) => {

  //  otp has to be actually generated somewhere based on email, then the db should store the otp 
  //  validate otp here, read from database
  //  after successful creation remove the session data from db

  const {name,mob,email,password,vehiclenum} = req.body;
  const roleid = 4; // everyone is a default freelancer;
  const locid = 1; // freelancer is universal;

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

    // check for already existing user
    
    sql0 = 'SELECT count(email) AS count FROM users WHERE email = ?';

    const [count] = await new Promise((resolve, reject) => {

     db.query(sql0,[email],(err,results)=>{

        if(err) 
          reject(err);
        else
          resolve(results);

     });

    });

    if(count.count===1)
       return res.json({message:"Email already exists"}).status(400);

    // mobile number can be null 

    let mobil;
    if(mob==undefined) 
    {
        mobil=null;
    }
    else
       mobil = mob;


    // hashing of the password    
    const hashedpw = bcrypt.hashSync(password, saltrounds); 

    // create a new user in users table with freelancer preferance

    const sql1 = 'INSERT INTO users (locid,name,mob,email,password,roleid,vehiclenum1) VALUES (?,?,?,?,?,?,?)';

    await new Promise((resolve, reject) => {
      db.query(sql1, [locid,name,mobil,email,hashedpw,roleid,vehiclenum], async (err) => {
        if (err) {
          console.error('Error executing query:', err);
          reject(err);
        } else {
          console.log('Inserted into the record');
          resolve();
        }
      });
    });

    const txt = `Thank you ${name} for registering to morbing parking systems ltd`;
    const emailsent = await emailer.gmailer(email,'Registered',txt);

    
    if (emailsent) {
        return res.status(200).json({ message: 'THANK YOU FOR REGISTERING' });
      } else {
        return res.status(500).json({ message: 'SOME SERVER ERROR' });
      }

  }

  catch (err) 
  {
    // If an error is caught
    console.error('Catch Error:', err);
    return res.status(500).json({ message: 'Some server error' });
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