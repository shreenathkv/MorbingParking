const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const Joi = require('joi');

const { dbcreds } = require('../links');

//According to SOLID principle 
//S-> Single Responsibilty Priciple which means one module/class should only have one proper task/responsibility

/// api/record protected(only gkeeper), creates a record into the parkingrecords table with some values Null

const schema = Joi.object({
  vehiclenum : Joi.string().max(15).required(),
  locid : Joi.number().min(2).required(),
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

router.post('/api/recordpark', validate ,async (req, res) => 
{
  const { vehiclenum, locid } = req.body;
  // vehicle num, locid to which he's pulling up, userid of the vehicle owner to which they want to pull up is sent

  // Create a MySQL connection
  const db = mysql.createConnection(dbcreds);

  try 
  {
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

    // find the userid of the vehiclenum user

    const sql0 = 'SELECT userid FROM users WHERE vehiclenum1 = ? OR vehiclenum2 = ?';
    const [userid] = await new Promise((resolve, reject) => 
    {
        db.query(sql0,[vehiclenum,vehiclenum] ,(err, results) => 
        {
           if(err)
              reject(err);
           else
            {  
              console.log(results);
              resolve(results);
            }  
        });
    });

    console.log(userid);

    // if userid not available 

    if(!userid.userid || userid.userid == undefined)
    {
      return res.json({message:"Unregistered user vehicle"}).status(404);
    }

    // Use parameterized query to avoid SQL injection
    // INSERT a new ROW of details of a parking record
    // Create a JavaScript Date object for the current date and time

    const now = new Date();
    const indianTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

    // Format the date as a MySQL TIMESTAMP string
    const mysqlTimestamp = indianTime.toISOString().slice(0, 19).replace('T', ' ');

    console.log(mysqlTimestamp); // Print the MySQL TIMESTAMP string

    const sql1 = 'INSERT INTO parkingrecord (locid,userid,vehiclenum,entrytime) VALUES (?,?,?,?)';

      await new Promise((resolve, reject) => {
      db.query(sql1, [locid,userid.userid,vehiclenum,mysqlTimestamp], async (err) => {
        if (err) 
        {
          console.error('Error executing query:', err);
          reject(err);
        } 
        else 
        {
          console.log('Inserted record :',vehiclenum);
          resolve();
        }
      });
    });

   return res.json({"message":`Successfully inserted the record`}).status(200);

// if the user is staff of an org he gets previlliges only in his yard, he is considered a freelancer elsewhere
  } 
  
  catch (err) 
  {
    // If an error is caught
    console.error('Catch Error:', err);
    return res.status(500).json({ message: 'Some server error'});
  } 
  
  finally 
  {
    // Close the database connection
    db.end((err) => 
    {
      if (err) 
      {
        console.error('Error closing database connection:', err.message);
      } 
      else 
      {
        console.log('Database connection closed');
      }
    });
  }
});

module.exports = router;