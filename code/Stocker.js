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
  //var sql = 'INSERT INTO products(name, price, img) VALUES(?,?,?)'
  //var sql = 'DELETE FROM products WHERE id = ' + mysql.escape(4)
  var sql = "UPDATE products SET id = 5 WHERE id = 6";
  con.query(sql,['Orange',1.0,"Orange.png"], function (err, result) {
    if (err) throw err;
    console.log("Product added");
  });
});