
console.log('start');
const bcrypt = require('bcrypt');

const {saltrounds} = require('./links');
const plainPassword = 'CJS@1strank';

// Generate a salt and hash the plain password

const hashedPassword = bcrypt.hashSync(plainPassword, saltrounds); 
// The second argument is the saltRounds (cost factor)

console.log(`Hashed Password with ${saltrounds} saltrounds:`, hashedPassword);
