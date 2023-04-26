var mysql = require('mysql2');
var express = require('express');
var session = require('express-session');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });

//From: https://gist.github.com/JeffPaine/3083347
const states = [ 'AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA',
           'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME',
           'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM',
           'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX',
           'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY'];
const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
var years = [];
var d = new Date();
let curYear = d.getFullYear();
for(var i = 0; i < 6; i++){
  years.push(curYear + i);
}
const shipping = 10.99;

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(session({secret: "4j4PtYwxHwYSSK7",name:'uniqueSessionID',saveUninitialized:false}));

const con = mysql.createConnection({
  host: "localhost",
  user: "yourusername",
  password: "yourpassword",
  database: "greenmart"
});

function correctEmail(email){
  return String(email) // Credit to https://stackoverflow.com/a/46181/21390768 for the email validator
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
}

function createAcc(name, email, pass){
  con.query('INSERT INTO account(name, email, password) VALUES(?,?,?)',[name, email, pass], function (err, result) {
    if (err) throw err;
    console.log("Account record inserted");
  });
}

function validateSignUp(name, email, pass, cpass) {
  if (name == "") {
    return "Name must be filled out";
  }

  if (email == "") {
    return "Email must be filled out";
  } else if (!correctEmail(email)) {
    return "Invalid email address";
  } 

  if(pass.length < 8){
    return "Password must be eight characters or longer";
  } else if (pass.localeCompare(cpass)){
    return "Passwords do not match";
  }

  return "Account created successfully"
} 

//Code from: https://stackoverflow.com/a/29767609/21390768
function validNumber(phone_number){
  const regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
  return phone_number.match(regex);
}

//Regex from: https://www.w3schools.blog/credit-card-validation-javascript-js
function validCard(cc,sc){
  const master = /^5[1-5][0-9]{14}$|^2(?:2(?:2[1-9]|[3-9][0-9])|[3-6][0-9][0-9]|7(?:[01][0-9]|20))[0-9]{12}$/;
  const americanEx = /^3[47][0-9]{13}$/;
  const visa = /^4[0-9]{12}(?:[0-9]{3})?$/;
  const discover = /^65[4-9][0-9]{13}|64[4-9][0-9]{13}|6011[0-9]{12}|(622(?:12[6-9]|1[3-9][0-9]|[2-8][0-9][0-9]|9[01][0-9]|92[0-5])[0-9]{10})$/;
  const maestro = /^(5018|5081|5044|5020|5038|603845|6304|6759|676[1-3]|6799|6220|504834|504817|504645)[0-9]{8,15}$/;
  const jcb = /^(?:2131|1800|35[0-9]{3})[0-9]{11}$/;
  const diners = /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/;
  if(cc.match(master) || cc.match(americanEx) || cc.match(visa) || cc.match(discover) || cc.match(maestro) || cc.match(jcb) || cc.match(diners)){
    if(sc.length == 3 && !isNaN(sc)){
      return true;
    }
  }
  return false;
}

function addZero(i) {
  if (i < 10) {i = "0" + i}
  return i;
}

app.get('/', function (req, res) {
  const query = 'SELECT * FROM products'
  con.query(query, function (err, result) {
    if (err) throw err;
    res.render(path.join(__dirname, '..', 'templates', 'home.html'),{products:result, loggedIn:req.session.loggedIn, cart:req.session.cart, response:""});
  });
})

app.post('/', urlencodedParser, function (req, res) {
  //console.log("ID: " + req.body.id + ", NAME: " + req.body.name + ", PRICE: " + req.body.price + ", QTY: " + req.body.qty);
  var found = false;
  var response = ""
  if(!req.session.cart){
    req.session.cart = [];
  }
  for(var i = 0; i < req.session.cart.length; i++){
    if (req.body.id == req.session.cart[i][0]){
      if(req.session.cart[i][1] == 8){
        response = "Item was not added to cart, there is a maximum of 8 per item";
      } else if (req.session.cart[i][1] + parseInt(req.body.qty) > 8){
        response = (8 - req.session.cart[i][1]) + " " + req.body.name + " added to cart";
      } else {
        response = req.body.qty + " " + req.body.name + " added to cart";
      }
      req.session.cart[i][1] = Math.min(req.session.cart[i][1] + parseInt(req.body.qty), 8);
      found = true;
    }
  }
  if (!found){
    response = req.body.qty + " " + req.body.name + " added to cart";
    req.session.cart.push([parseInt(req.body.id),parseInt(req.body.qty)]);
  }
  const query = 'SELECT * FROM products'
  con.query(query, function (err, result) {
    if (err) throw err;
    res.render(path.join(__dirname, '..', 'templates', 'home.html'),{products:result, loggedIn:req.session.loggedIn, cart:req.session.cart, response:response});
  });
})

app.get('/signup', function (req, res) {
  if (req.session.loggedIn){
    res.redirect("/")
  } else {
    res.render(path.join(__dirname, '..', 'templates', 'signup.html'),{response:"", cart:req.session.cart});
  }
})

app.get('/logout', function (req, res) {
  if (req.session.loggedIn){
    req.session.loggedIn = false;
    req.session.username = "";
  }
  res.redirect("/signin");
})

app.post('/signup', urlencodedParser, function (req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var pass = req.body.pass;
  var cpass = req.body.cpass;
  var response = validateSignUp(name,email,pass,cpass,res);
  if (response != "Account created successfully"){
    res.render(path.join(__dirname, '..', 'templates', 'signup.html'), {response:response, cart:req.session.cart});
  } else {
    const query = 'SELECT * FROM account WHERE email = ' + mysql.escape(email);
    con.query(query, function (err, result) {
      if (err) throw err;
      if (result[0]){
        response = "This email address has already been taken";
        res.render(path.join(__dirname, '..', 'templates', 'signup.html'), {response:response, cart:req.session.cart});
      } else {
        createAcc(name, email, pass);
        req.session.message = response;
        res.redirect('/signin');
      }
    });
  }
})

app.get('/signin', function (req, res) {
  if (req.session.loggedIn){
    res.redirect("/");
  } else {
    var message = req.session.message;
    req.session.message = "";
    res.render(path.join(__dirname, '..', 'templates', 'signin.html'),{response:message, cart:req.session.cart});
  }
})

app.post('/signin', urlencodedParser, function (req, res) {
  var email = req.body.email;
  var pass = req.body.pass;
  const query = 'SELECT * FROM account WHERE email = ' + mysql.escape(email);
  con.query(query, function (err, result) {
    if (err) throw err;
    if (result[0]){
      const query = 'SELECT password FROM account WHERE email = ' + mysql.escape(email);
      con.query(query, function (err, result2) {
        if (result2[0]["password"] == pass){
          req.session.loggedIn = true;
          req.session.username = email;
          res.redirect('/');
        } else {
          res.render(path.join(__dirname, '..', 'templates', 'signin.html'),{response:"Invalid email or password", cart:req.session.cart});
        }
      });
    } else {
      res.render(path.join(__dirname, '..', 'templates', 'signin.html'),{response:"Invalid email or password", cart:req.session.cart});
    }
  });
})

app.get('/basket', function (req, res) {
  const query = 'SELECT * FROM products'
  if(!req.session.cart){
    req.session.cart = [];
  }
  con.query(query, function (err, result) {
    if (err) throw err;
    res.render(path.join(__dirname, '..', 'templates', 'Basket.html'),{products:result, loggedIn:req.session.loggedIn, shipping:shipping, cart:req.session.cart});
  });
})

app.post('/basket', urlencodedParser, function (req, res) {
  req.session.cart.splice(req.body.id,1);
  const query = 'SELECT * FROM products'
  con.query(query, function (err, result) {
    if (err) throw err;
    res.render(path.join(__dirname, '..', 'templates', 'Basket.html'),{products:result, loggedIn:req.session.loggedIn, shipping:shipping, cart:req.session.cart});
  });
})

app.get('/checkout', function (req, res) {
  if(!req.session.loggedIn){
    res.redirect('/signin');
  } else if(!req.session.cart || req.session.cart == []){
    res.redirect('/');
  } else {
    console.log(req.session.cart);
    const query = 'SELECT * FROM products'
    con.query(query, function (err, result) {
      if (err) throw err;
      res.render(path.join(__dirname, '..', 'templates', 'Checkout.html'),{products:result, loggedIn:req.session.loggedIn, cart:req.session.cart, states:states, months:months, years:years, shipping:shipping, response:""});
    });
  }
})

app.post('/checkout', urlencodedParser, function (req, res) {
  var fname = req.body.fname;
  var lname = req.body.lname;
  var phone = req.body.phone;
  var address = req.body.address;
  var zipc = req.body.zip;
  var cc = req.body.creditcard;
  var sc = req.body.security;
  var state = req.body.states;
  var month = req.body.month;
  var year = req.body.year;
  const query = 'SELECT * FROM products'
  con.query(query, function (err, result) {
    if (err) throw err;
    if (fname != "" && lname != ""){
      if(validNumber(phone)){
        if(address != ""){
          if(zipc.length == 5 && !isNaN(zipc)){
            if(state != null){
              if(validCard(cc,sc)){
                if(month != null && year != null){
                  d = new Date();
                  if(String(d.getFullYear()) == year && parseInt(month) < d.getMonth() + 1){
                    res.render(path.join(__dirname, '..', 'templates', 'Checkout.html'),{products:result, loggedIn:req.session.loggedIn, cart:req.session.cart, states:states, months:months, years:years, shipping:shipping, response:"Your card has expired"});
                  } else {
                    const query = 'SELECT id FROM account WHERE email = ' + mysql.escape(req.session.username);
                    con.query(query, function (err, result3) {
                      if (err) throw err;
                      var id = result3[0]["id"];
                      var date = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
                      let h = addZero(d.getHours());
                      let m = addZero(d.getMinutes());
                      let s = addZero(d.getSeconds());
                      let time = h + ":" + m + ":" + s;
                      const status = "Processing";
                      console.log(id, shipping, date, time, status,"","",fname, lname, phone, address, zipc, state, cc, sc, month, year);
                      con.query('INSERT INTO purchase(accountID, shipping, date, time, status, deliveryDate, deliveryTime, fname, lname, phone, address, zip, state, creditcard, security, month, year) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[id, shipping, date, time, status, "", "", fname, lname, phone, address, zipc, state, cc, sc, month, year], function (err, result2) {
                        if (err) throw err;
                        console.log("Purchase record inserted");
                        for(var i = 0; i < req.session.cart.length; i++){
                          con.query('INSERT INTO purchasedItems(purchaseID, productID, price, qty) VALUES(?,?,?,?)',[result2.insertId, req.session.cart[i][0],result[req.session.cart[i][0]-1]["price"], req.session.cart[i][1]], function (err, result) {
                            if (err) throw err;
                            console.log("Item record inserted");
                            if(i == req.session.cart.length){
                              req.session.cart=[];
                              req.session.message = "Purchase successful";
                              res.redirect("/orders");
                            }
                          });
                        }
                      });
                    });
                  }
                } else {
                  res.render(path.join(__dirname, '..', 'templates', 'Checkout.html'),{products:result, loggedIn:req.session.loggedIn, cart:req.session.cart, states:states, months:months, years:years, shipping:shipping, response:"Please enter a month or date"});
                }
              } else {
                res.render(path.join(__dirname, '..', 'templates', 'Checkout.html'),{products:result, loggedIn:req.session.loggedIn, cart:req.session.cart, states:states, months:months, years:years, shipping:shipping, response:"Invalid card number or security code"});
              }
            } else {
              res.render(path.join(__dirname, '..', 'templates', 'Checkout.html'),{products:result, loggedIn:req.session.loggedIn, cart:req.session.cart, states:states, months:months, years:years, shipping:shipping, response:"Please enter a state"});
            }
          } else {
            res.render(path.join(__dirname, '..', 'templates', 'Checkout.html'),{products:result, loggedIn:req.session.loggedIn, cart:req.session.cart, states:states, months:months, years:years, shipping:shipping, response:"Invalid zip code"});
          }
        } else {
          res.render(path.join(__dirname, '..', 'templates', 'Checkout.html'),{products:result, loggedIn:req.session.loggedIn, cart:req.session.cart, states:states, months:months, years:years, shipping:shipping, response:"Address is blank"});
        }
      } else {
        res.render(path.join(__dirname, '..', 'templates', 'Checkout.html'),{products:result, loggedIn:req.session.loggedIn, cart:req.session.cart, states:states, months:months, years:years, shipping:shipping, response:"Invalid phone number"});
      }
    } else {
      res.render(path.join(__dirname, '..', 'templates', 'Checkout.html'),{products:result, loggedIn:req.session.loggedIn, cart:req.session.cart, states:states, months:months, years:years, shipping:shipping, response:"Name fields are blank"});
    }
  });
})

app.get('/orders', function (req, res) {
  if(!req.session.loggedIn){
    res.redirect('/signin');
  } else {
    const query = 'SELECT id FROM account WHERE email = ' + mysql.escape(req.session.username);
    con.query(query, function (err, result3) {
      if (err) throw err;
      const query = 'SELECT * FROM purchase WHERE accountID = ' + mysql.escape(result3[0]["id"]);
      con.query(query, function (err, result) {
        if (err) throw err;
        var ids = ""
        if (result.length > 0){
          ids += "purchaseID = " + mysql.escape(result[0]["id"]);
          for(var i = 1; i < result.length; i++){
            ids += " OR purchaseID = " + mysql.escape(result[i]["id"]);
          }
          const query = 'SELECT * FROM purchasedItems WHERE ' + ids;
          con.query(query, function (err, result2) {
            if (err) throw err;
            const query = 'SELECT * FROM products'
            con.query(query, function (err, result4) {
              if (err) throw err;
              var message = req.session.message;
              req.session.message = "";
              res.render(path.join(__dirname, '..', 'templates', 'Orders.html'),{products:result4, purchases:result2, loggedIn:req.session.loggedIn, shippingInfo:result, response:message, cart:req.session.cart});
            });
          });
        } else {
          res.render(path.join(__dirname, '..', 'templates', 'Orders.html'),{products:"", purchases:"", loggedIn:req.session.loggedIn, shippingInfo:result, response:"", cart:req.session.cart});
        }
      });
    });
  }
})

app.use(express.static(path.join(__dirname, '..')));

var server = app.listen(8080, function () {
  var host = server.address().address
  var port = server.address().port
  
  console.log("Example app listening at http://%s:%s", host, port)
})