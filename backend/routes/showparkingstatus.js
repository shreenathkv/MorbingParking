const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const Joi = require('joi');

const { dbcreds } = require('../links');

//According to SOLID principle 
//S-> Single Responsibilty Priciple which means one module/class should only have one proper task/responsibility

// /api/checkvn protected, checks availability of the parking spot based on the vehiclenum

const schema = Joi.object({
  locid : Joi.number().min(2).required(),
});


function validate(req, res, next) 
{

 const {error} = schema.validate(req.body);

 if (error) 
 {
   // Return a 400 Bad Request response with the validation error details
   return res.status(400).json({ error: error.details[0].message });
 }

 // Proceed to the next middleware or route handler
 next();

}

router.post('/api/showparkingstatus', validate , async (req, res) => 
{
  const { locid } = req.body ;
  // vehicle num, and locid to which they want to pull up is sent

  // Create a MySQL connection
  const db = mysql.createConnection(dbcreds);

  try 
  {
    // Connect to the database

      await new Promise((resolve, reject) => 
    {
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
    // collect details of the parking lot 

    const sql1 = 'SELECT status,spot FROM parkingspots  WHERE locid=?';
    const viewdata = await new Promise((resolve, reject) => {
      db.query(sql1, [locid], async (err, results) => {
        if (err) 
        {
          console.error('Error executing query:', err);
          reject(err);
        } 
        else 
        {
          console.log('Results:', results);
          resolve(results);
        }
      });
    });

    // parking view details not found 
    if (!viewdata || viewdata.length===0) 
    {
      console.log('parking view data not available');
      return res.status(404).json({ message: 'parking view data not available' });
    }
    
    console.log(viewdata);
    let status = [];
    let spot = [];

    for(let i=0; i<viewdata.length; i++)
    {
      status.push(viewdata[i].status);
      spot.push(viewdata[i].spot);
    }

    return res.json({ message: 'parking view data',status: status, spot: spot }).status(200);

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
    db.end((err) => {
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