import {db} from './db.js';
import bcrypt from 'bcryptjs';
const users=[['Aurelia House','admin@aurelia.test','admin'],['Edmund Vale','seller@aurelia.test','seller'],['Clara Bennett','buyer@aurelia.test','buyer']];
for(const [name,email,role] of users) db.prepare('INSERT OR IGNORE INTO users(name,email,password_hash,role,seller_status) VALUES(?,?,?,?,?)').run(name,email,bcrypt.hashSync('demo1234',10),role,role==='seller'||role==='admin'?'approved':'none');
console.log('Seed complete. Demo accounts use password demo1234.');

