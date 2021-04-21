require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fetch = require("node-fetch");

const passport = require("passport");
const session = require("express-session");
const passport_lcl_mongo = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");

const app = express();
app.set({'view-engine': 'ejs'});
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
	secret: "This is our Little Secret.",
	saveUninitialized: false,
	resave: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_DB_URL);
mongoose.set('useCreateIndex', true);
const userSchema = new mongoose.Schema({
	name : String,
	username: String,
	password: String,
	Cryptos: Array
});

userSchema.plugin(passport_lcl_mongo);
userSchema.plugin(findOrCreate);

var l_aarr =[];
var name = "";

userCollection = mongoose.model("user", userSchema);


passport.use(userCollection.createStrategy());
passport.serializeUser(function(user, done) {
	done(null, user.username);
});
passport.deserializeUser(userCollection.deserializeUser());


app.get("/", function(req, res) {
	res.render("index.ejs", {"show": "Register"});
});

app.post("/login", function(req, res) {

	const user_login = new userCollection({
		username: req.body.username,
		password: req.body.password
	});

	req.login(user_login, function(err) {
		if(err) {
			console.log(err);
			res.redirect("/");
		} else {
			passport.authenticate("local")(req, res, function(){
				res.redirect("/home");
			});
		}
	});
});

app.route("/register")
	.get(function(req, res) {
		res.render("register.ejs", {"show": "LogIn"})
	})
	.post(function(req, res) {
		full_name = req.body.name;
		username = req.body.username;
		password = req.body.password;
		c_password = req.body.c_password;

		if (c_password === password) {
			new_user = new userCollection({
				name: full_name,
				username: username,
			});
			console.log(new_user, password);
			userCollection.register(new_user, password, function(err, user) {
				if(err) {
					console.log(err);
					res.redirect("/register");
				} else {
					passport.authenticate("local")(req, res, function () {
						name = full_name;
						res.redirect("/home",);
					})
				}
			});
		}
		else 
			res.redirect("/register");
	}
);

app.get("/logout", function(req, res) {
	req.logout();
	res.redirect('/');
});

app.post("/addCoin", function(req, res) {
	coin = req.body.coinSelected;
	console.log(coin);
	if (coin==="null" || req.user.Cryptos.includes(coin)) {
		res.redirect("/home");
		return;
	}
	req.user.Cryptos.push(coin);
	userCollection.findOneAndUpdate({username: req.user.username}, req.user, {upsert: true}, function(err, result) {
		if(err)
			console.log(err);
		else
			console.log(result);
	});
	res.redirect("/home");
});

app.get('/home', function(req, response) {
	l_aarr=[];
	if (!req.isAuthenticated()) {
		response.redirect("/");
		return;
	}
	leng = req.user.Cryptos.length;

	async function getCoinInfo(coin) {
		url="https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?CMC_PRO_API_KEY="+process.env.API_KEY+"&slug="+coin+"&convert=inr";
		const res = await fetch(url);
		const json = await res.json();
		var value;
		Object.keys(json.data).forEach(function(key) {
			value = json.data[key];
			l_aarr.push({
				id: value['id'],
				name: value['name'],
				symbol: value['symbol'],
				price: value['quote']['INR']['price'],
				market_supply: value['circulating_supply']
			});
		});
		console.log(coin, req.user.Cryptos, leng);
		// if (coin===req.user.Cryptos[req.user.Cryptos.length-1])
		if(l_aarr.length===leng)
			response.render("home.ejs", {"fullName": req.user.name, "show": "Logout", "coins_arr": l_aarr})
		return l_aarr;
	}
	if (leng===0)
		response.render("home.ejs", {"fullName": req.user.name, "show": "Logout", "coins_arr": []})

	req.user.Cryptos.forEach((coin)=>{
		console.log(getCoinInfo(coin));
	});
	//res.render("home.ejs", {"fullName": req.user.name, "show": "Logout", "coins_arr": arr})

});


app.listen(process.env.PORT || 3000, function() {
	console.log("server Running at specified Port");
})
