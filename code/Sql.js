var mysql = require('mysql2');

var con = mysql.createConnection({
  host: "localhost",
  user: "yourusername",
  password: "yourpassword",
  database: "greenmart"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  //var sql = "CREATE TABLE account (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), password VARCHAR(255))";
  //var sql = "DROP TABLE purchase";
  //var sql = "CREATE TABLE products (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), price FLOAT(6), img VARCHAR(255))";
  var sql = 'INSERT INTO products(name, price, img) VALUES(?,?,?)'
  //var sql = "CREATE TABLE purchase (id INT AUTO_INCREMENT PRIMARY KEY, accountID INT(255), shipping FLOAT(6), date VARCHAR(255), time VARCHAR(255), status VARCHAR(255), deliveryDate VARCHAR(255), deliveryTime VARCHAR(255), fname VARCHAR(255), lname VARCHAR(255), phone VARCHAR(255), address VARCHAR(255), zip VARCHAR(255), state VARCHAR(255), creditcard VARCHAR(255), security VARCHAR(255), month VARCHAR(255), year VARCHAR(255))"; //total: 17
  //var sql = "CREATE TABLE purchasedItems (id INT AUTO_INCREMENT PRIMARY KEY, purchaseID INT(255), productID INT(255), price FLOAT(6), qty INT(255))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Item added");
  });
});