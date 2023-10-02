const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const Joi = require('joi');

const { dbcreds } = require('../links');

//According to SOLID principle 
//S-> Single Responsibilty Priciple which means one module/class should only have one proper task/responsibility

/// api/completerecord protected(only gkeeper), completes a record into the parkingrecords table

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

router.post('/api/completerecord', validate ,async (req, res) => {
  const { vehiclenum, locid} = req.body;
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


    // select entrytime of the record we want to update

    const sql0 = 'SELECT entrytime,userid FROM parkingrecord WHERE exittime IS ? AND vehiclenum=? AND locid=?';
    const [record] = await new Promise((resolve, reject) => {
      db.query(sql0, [null,vehiclenum,locid], (err, results) => {
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

    console.log(record);

    if(!record || record.length == 0)
       return res.json({"message":"No record of entry"}).status(404);

    const userid = record.userid;

    // convert entrytime in mySQL to jstime
    // Create a JavaScript Date object for the current date and time
    // calculate the minutes for which the guy is parking

    let entry = new Date(record.entrytime+'Z'); 
    const now = new Date();
    const currentDate = new Date(now.getTime()+5.5*3600*1000);

    const duration = (currentDate-entry)/60000;

    const mysqlTimestamp = currentDate.toISOString().slice(0, 19).replace('T', ' ');
    console.log(mysqlTimestamp,duration); 

    // calulate the cost for which he parked

    const sql1 = 'SELECT charge FROM parkingcharges WHERE locid=? AND \
                  roleid=(SELECT roleid FROM users WHERE userid=?)';

    const [charge] = await new Promise((resolve,reject)=>{

      db.query(sql1,[locid,userid],(err,results)=>{

         if(err)
          { console.log(err);
            reject(err);
          }
          else
          {
            console.log(results);
            resolve(results);
          }

      });
    });

    console.log('charge :', typeof(charge));
    let cost = duration*charge.charge;
    console.log('cost :',cost);

    // update exittime,timeparked,amountpayable,paymentstatus

    const sql2 = 'UPDATE parkingrecord SET exittime=?,timeparked=?,amountpayable=?,paymentstatus=?\
                  WHERE userid=? AND entrytime=? AND exittime IS NULL';

      await new Promise((resolve, reject) => {
      db.query(sql2, [mysqlTimestamp,duration,cost,false,userid,record.entrytime],(err) => {
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

     res.json({"message":`Successfully updated the record`}).status(200);


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