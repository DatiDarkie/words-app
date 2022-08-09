require('dotenv').config();

const express = require('express');
const session = require('express-session');
const mysql = require("mysql");
const mysqlQb = require('mysql-qb');
const app = express();

app.set('view engine', 'pug');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SECRET,
  saveUninitialized: true,
  resave: false
}));

app.use(express.static('assets'));

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.PASSWORD,
  database: "words_database",
});

connection.connect(function (err) {
  if (err) {
    throw new Error(err.message);
  }

  app.use('/', require('./routes')(new mysqlQb(connection)));
});

app.listen(process.env.PORT || 3000, () => {
  console.log('App started...');
});