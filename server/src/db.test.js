import {test} from 'node:test';import assert from 'node:assert/strict';import {db} from './db.js';
test('seed creates demo users, categories and live lots',()=>{assert.ok(db.prepare("SELECT COUNT(*) n FROM users WHERE email='admin@aurelia.test'").get().n);assert.ok(db.prepare('SELECT COUNT(*) n FROM categories').get().n>=8);assert.ok(db.prepare("SELECT COUNT(*) n FROM auctions WHERE status='live'").get().n>=1)});
test('database enforces unique email',()=>{assert.throws(()=>db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run('Duplicate','buyer@aurelia.test','x'));});

