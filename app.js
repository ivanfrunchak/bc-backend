import { createRequire } from "module";
const require = createRequire(import.meta.url);
global.require = require;

import express from 'express';
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import path from 'path'
// Import Routers.
import mongoose from 'mongoose'


const router = express.Router();


const app = express();

app.use(cors());
app.use(function (req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	res.setHeader('Access-Control-Allow-Credentials', true);
	next();
});

app.use(cookieParser());
const origLog = console.log;
console.log = function (obj, ...placeholders) {
  if (typeof obj === "string")
    placeholders.unshift("[" + new Date().toISOString() + "] " + obj);
  else {
    // This handles console.log( object )
    placeholders.unshift(obj);
    placeholders.unshift("[" + new Date().toISOString() + "] %j");
  }

  origLog.apply(this, placeholders);
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('frontend/build'));

app.use(session({
	key: 'user_sid',
	secret: 'somerandonstuffs',
	resave: true,
	saveUninitialized: true,
	cookie: {
		expires: 600000
	}
}));

import userRoute from './routes/user.route.js'
import { startServer } from "./services/socket.js";

app.use('/', router);
app.use('/user', userRoute);

app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});
const portNumber = process.env.PORT || 3000;
const server = app.listen(portNumber, '0.0.0.0', () => {
	console.log('Http Server is up and running on port numner', portNumber);
});
// mongoose.connect('mongodb://localhost:27017/bc', {
// 	useNewUrlParser: true,
// 	useUnifiedTopology: true
// }).then(async () => {
// 	console.log('Database connected');
// });

startServer(server)