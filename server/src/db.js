import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const dataDir=path.join(here,'../data');
fs.mkdirSync(dataDir,{recursive:true});
const file=path.join(dataDir,'auction.db');
const SQL=await initSqlJs();
const raw=new SQL.Database(fs.existsSync(file)?new Uint8Array(fs.readFileSync(file)):undefined);
raw.run('PRAGMA foreign_keys=ON');
let transactionDepth=0;
const persist=()=>{if(!transactionDepth)fs.writeFileSync(file,Buffer.from(raw.export()));};
export const db={
 exec(sql){raw.run(sql);persist();},
 prepare(sql){return {
  all(...params){const s=raw.prepare(sql);try{s.bind(params);const rows=[];while(s.step())rows.push(s.getAsObject());return rows;}finally{s.free();}},
  get(...params){const s=raw.prepare(sql);try{s.bind(params);return s.step()?s.getAsObject():undefined;}finally{s.free();}},
  run(...params){raw.run(sql,params);const changes=raw.getRowsModified();const lastInsertRowid=raw.exec('SELECT last_insert_rowid() AS id')[0]?.values[0][0];persist();return {changes,lastInsertRowid};}
 };},
 transaction(fn){return (...args)=>{raw.run('BEGIN');transactionDepth++;try{const value=fn(...args);raw.run('COMMIT');transactionDepth--;persist();return value;}catch(error){raw.run('ROLLBACK');transactionDepth--;throw error;}};}
};

db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'buyer', seller_status TEXT NOT NULL DEFAULT 'none', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, description TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS auctions(id INTEGER PRIMARY KEY, seller_id INTEGER NOT NULL REFERENCES users(id), category_id INTEGER REFERENCES categories(id), title TEXT NOT NULL, description TEXT NOT NULL, image TEXT NOT NULL, condition TEXT DEFAULT 'Very good', provenance TEXT DEFAULT '', starting_price INTEGER NOT NULL, current_price INTEGER NOT NULL, reserve_price INTEGER DEFAULT 0, bid_increment INTEGER DEFAULT 100, starts_at TEXT DEFAULT CURRENT_TIMESTAMP, ends_at TEXT NOT NULL, status TEXT DEFAULT 'live', winner_id INTEGER REFERENCES users(id), created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS bids(id INTEGER PRIMARY KEY, auction_id INTEGER NOT NULL REFERENCES auctions(id), bidder_id INTEGER NOT NULL REFERENCES users(id), amount INTEGER NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), message TEXT NOT NULL, read INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY, auction_id INTEGER NOT NULL REFERENCES auctions(id), buyer_id INTEGER NOT NULL REFERENCES users(id), amount INTEGER NOT NULL, status TEXT DEFAULT 'awaiting_payment', recipient_name TEXT DEFAULT '', phone TEXT DEFAULT '', address_line TEXT DEFAULT '', city TEXT DEFAULT '', state TEXT DEFAULT '', postal_code TEXT DEFAULT '', payment_method TEXT DEFAULT '', delivery_estimate TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP, confirmed_at TEXT, UNIQUE(auction_id));`);

// Add delivery fields to databases created by earlier versions of the project.
const orderColumns=new Set(db.prepare('PRAGMA table_info(orders)').all().map(column=>column.name));
for(const [name,type] of [['recipient_name',"TEXT DEFAULT ''"],['phone',"TEXT DEFAULT ''"],['address_line',"TEXT DEFAULT ''"],['city',"TEXT DEFAULT ''"],['state',"TEXT DEFAULT ''"],['postal_code',"TEXT DEFAULT ''"],['payment_method',"TEXT DEFAULT ''"],['delivery_estimate',"TEXT DEFAULT ''"],['confirmed_at','TEXT']]){
 if(!orderColumns.has(name))db.exec(`ALTER TABLE orders ADD COLUMN ${name} ${type}`);
}
// Earlier demo checkouts never collected money; make those demo wins available for COD confirmation.
db.prepare("UPDATE orders SET status='awaiting_payment' WHERE status='paid' AND payment_method=''").run();
db.prepare("UPDATE notifications SET message='Your earlier checkout was a simulation. Confirm delivery details and cash on delivery from My wins.' WHERE message LIKE 'Payment recorded for your winning lot.%'").run();

export const seed=()=>{
 const cats=['Weapons & Blades','Artifacts','Gemstones & Minerals','Coins & Currency','Jewelry','Manuscripts & Books','Sculptures & Decorative Items','Collectibles','Other Antiques'];
 const insertCat=db.prepare('INSERT OR IGNORE INTO categories(name) VALUES(?)');cats.forEach(c=>insertCat.run(c));
 const addUser=db.prepare('INSERT OR IGNORE INTO users(name,email,password_hash,role,seller_status) VALUES(?,?,?,?,?)');
 addUser.run('Aurelia House','admin@aurelia.test',bcrypt.hashSync('demo1234',10),'admin','approved');
 addUser.run('Edmund Vale','seller@aurelia.test',bcrypt.hashSync('demo1234',10),'seller','approved');
 addUser.run('Clara Bennett','buyer@aurelia.test',bcrypt.hashSync('demo1234',10),'buyer','none');
 if(db.prepare('SELECT COUNT(*) n FROM auctions').get().n)return;
 const seller=db.prepare("SELECT id FROM users WHERE email='seller@aurelia.test'").get().id;
 const rows=[
 [2,'Brass Astrolabe, c. 1890','A finely engraved brass navigational instrument with a warm, honest patina. The rotating rete and alidade remain intact.','https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=85','Very good','From a private collection in Bath; acquired in the 1970s.',4200,7800,9000,300,5],
 [5,'Mughal Revival Pendant','A richly detailed gold-tone pendant set with garnet-coloured glass. A striking example of early 20th century revival craftsmanship.','https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1000&q=85','Excellent','Formerly in the collection of a London jeweller.',8500,12600,0,500,8],
 [6,'Persian illuminated folio','A single leaf with delicate calligraphic script and hand-painted floral margins, mounted archivally.','https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1000&q=85','Good','Private family collection, documented provenance supplied.',12000,18400,22000,500,2],
 [7,'Bronze temple bell','Small cast bronze bell with a clear tone and subtle age wear, likely from a domestic shrine.','https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1000&q=85','Very good','Acquired in Jaipur in 1982.',6400,6400,0,300,12],
 [8,'Victorian pocket chronometer','A handsome gilt brass pocket timepiece with engraved case and Roman numeral dial.','https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1000&q=85','Good','Estate of a retired naval officer.',15000,22500,0,1000,1],
 [3,'Blue john mineral specimen','A polished Derbyshire Blue John freeform, displaying distinctive banding and translucency.','https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=85','Excellent','Collected at Treak Cliff Cavern, Derbyshire.',3200,4900,0,200,6]
 ];
 const now=Date.now();const add=db.prepare('INSERT INTO auctions(seller_id,category_id,title,description,image,condition,provenance,starting_price,current_price,reserve_price,bid_increment,ends_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
 for(const [cat,title,desc,image,condition,prov,start,current,reserve,inc,hours] of rows)add.run(seller,cat,title,desc,image,condition,prov,start,current,reserve,inc,new Date(now+hours*3600e3).toISOString());
};
seed();
