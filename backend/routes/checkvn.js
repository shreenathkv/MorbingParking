const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const Joi = require('joi');

const { dbcreds } = require('../links');

//According to SOLID principle 
//S-> Single Responsibilty Priciple which means one module/class should only have one proper task/responsibility

// /api/checkvn protected, checks availability of the parking spot based on the vehiclenum

const schema = Joi.object({
  vehiclenum : Joi.string().max(15).required(),
  locid : Joi.number().min(2).required(),
});

function validate(req, res, next) {

 const {error} = schema.validate(req.body);

 if (error) {
   // Return a 400 Bad Request response with the validation error details
   return res.status(400).json({ error: error.details[0].message });
 }

 // Proceed to the next middleware or route handler
 next();

}

router.post('/api/checkvn',validate ,async (req, res) => {
  const { vehiclenum, locid } = req.body;
  // vehicle num, and locid to which they want to pull up is sent

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

    // check what's the limit for the parking lot

    const sql0 = 'SELECT lancerlimit FROM parkinglimit WHERE locid = ?';
    const [lancerlimit] = await new Promise((resolve, reject) => 
    {
      db.query(sql0, [locid], async (err, results) => {
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

    if(!lancerlimit || lancerlimit.length==0)
    {
       console.log('there seems to be no limit here then lancerlimit = 0');
       lancerlimit.lancerlimit = 0;
    }

    // Use parameterized query to avoid SQL injection
    // find location id of the user vehicle

    const sql1 = 'SELECT locid,roleid FROM users WHERE (vehiclenum1 = ? OR vehiclenum2 = ?)';
    const [user] = await new Promise((resolve, reject) => {
      db.query(sql1, [vehiclenum,vehiclenum], async (err, results) => {
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

    // user not found 
    if (!user || user.length===0) 
    {
      console.log('No such vehicle number');
      return res.status(404).json({ message: 'No such vehicle number' });
    }
    
    
    console.log('Found vehicle number');

    // to check whether the user should be allowed or not
    // check count of available spots 

    const sql2 = 'SELECT (SELECT count(*) FROM parkingspots WHERE locid=? AND status = true) AS available_spots,\
                         (SELECT count(*) FROM parkingspots WHERE locid=?) AS total_spots';

    const [counts] = await new Promise((resolve, reject) => {
      db.query(sql2, [locid,locid], async (err, results) => {
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

    const as = counts.available_spots;
    const ts = counts.total_spots;
    let status,open=false;
    

    if(as===0 || ts===0) 
      { 
         status = 'not';
         // no available parking spaces or non existant
      }
    else if((locid!=user.locid && (as/ts)>=lancerlimit.lancerlimit) || locid==user.locid || user.roleid == 5)
      { 
        status = 'is';
        open = true;
        // freelancer allowed if % availability is more, staff allowed even if one is free 
      }
    else 
      { 
        status = 'not'; 
        console.log(user.locid,locid,lancerlimit);
        // %availablity is less no entry for freelancer
        console.log(as/ts);
      }
     

res.json({"message":`Parking ${status} available`,"ratio":[as,ts],"vnum":vehiclenum,
          "open":open}).status(200);

// if the user is staff of an org he gets previlliges only in his yard, he is considered a freelancer elsewhere
  } 
  
  catch (err) 
  {
    // If an error is caught
    console.error('Catch Error:', err);
    return res.status(500).json({ message: 'Some server error: ' + err.message });
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