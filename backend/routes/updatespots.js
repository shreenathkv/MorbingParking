const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const Joi = require('joi');

const { dbcreds } = require('../links');

//According to SOLID principle 
//S-> Single Responsibilty Priciple which means one module/class should only have one proper task/responsibility

/// api/updatespots protected(only gkeeper), updates the status of the parking spots of a parkinglot in the database

const schema = Joi.object({
  statusdata: Joi.object({
    locid: Joi.number().min(2).required(),
    spots: Joi.array().items(Joi.string()).required(),
    status: Joi.array().items(Joi.boolean()).required(),
  }).required(),
});

// Validation middleware function
function validate(req, res, next) 
{
  // Validate the data against the schema
  const { error } = schema.validate(req.body);

  if (error) 
  {
    // Return a 400 bad request, response with the validation error details
    return res.status(400).json({ error: error.details[0].message });
  }

  const {spots,status} = req.body.statusdata;
  console.log('typeof(spots)',spots,'typeof(status)',typeof(status));

  if( spots.length != status.length || (!spots.length) )
  {
    return res.status(400).json({"message":"Arrays can't be empty or of diffent lengths" });
  }

  // Proceed to the next middleware or route handler
  next();
}

router.post('/api/updatespots', validate ,async (req, res) => {


  // locid to which the the status is supposed to change
  // Create a MySQL connection

  const db = mysql.createConnection(dbcreds);
  
  try 
  {
    const { statusdata } = req.body;
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
    // update the status of the parking spots 

// Function to update a single spot
const updateSpot = (spot, newStatus, locid) => 
{
  return new Promise((resolve, reject) => 
  {
    const updateQuery = 'UPDATE parkingspots SET status = ? WHERE locid = ? AND spot = ?';
    db.query(updateQuery, [newStatus, locid, spot], (updateErr) => {
      if (updateErr) 
      {
        reject(updateErr);
      } 
      else 
      {
        console.log('success');
        resolve();
      }
    });
  });
};

// Perform updates using async/await
(async () => {
  const { locid, status, spots } = statusdata;
  
    db.beginTransaction();

    for (let i = 0; i < status.length; i++) {
      const spot = spots[i];
      const newStatus = status[i];
      updateSpot(spot, newStatus, locid);
    }

    db.commit();
    console.log('Updates were successfully committed.');
   
  })();

  return res.json({message:"Updated spots succesfully"}).status(200);

 }
  
  catch (err) 
  {
    // If an error is caught
    console.error('Catch Error:', err);
    return res.status(500).json({ message: 'Some server error: '});
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