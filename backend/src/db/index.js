const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_PATH = path.join(DATA_DIR, 'users.json');

function loadUsers() {
  if (!fs.existsSync(USERS_PATH)) return [];
  return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
}

function saveUsers(users) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

let _users = null;

function getUsers() {
  if (!_users) _users = loadUsers();
  return _users;
}

function findUser(username) {
  return getUsers().find(u => u.username === username) || null;
}

function init() {
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const users = loadUsers();
  if (!users.find(u => u.username === adminUser)) {
    users.push({
      id: 1,
      username: adminUser,
      password_hash: bcrypt.hashSync(adminPass, 10),
      role: 'admin',
    });
    saveUsers(users);
    _users = users;
    console.log(`Admin user "${adminUser}" created.`);
  } else {
    _users = users;
  }
}

module.exports = { findUser, init };
