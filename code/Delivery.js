var mysql = require('mysql2');

var con = mysql.createConnection({
  host: "localhost",
  user: "yourusername",
  password: "yourpassword",
  database: "greenmart"
});

function addZero(i) {
  if (i < 10) {i = "0" + i}
  return i;
}

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  /*var sql = "UPDATE customers SET status = 'Out for delivery' WHERE id = '1'";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Item added");
  });*/
  d = new Date();
  var date = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
  let h = addZero(d.getHours());
  let m = addZero(d.getMinutes());
  let s = addZero(d.getSeconds());
  let time = h + ":" + m + ":" + s;
  var sql = "UPDATE purchase SET status = ?, deliveryDate = ?, deliveryTime = ? WHERE id = '7'";
  con.query(sql, ['Delivered',date,time], function (err, result) {
    if (err) throw err;
    console.log("Delivery status changed");
  });
});