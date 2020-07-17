const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const db = require('./data/userDb');

const app = express();

app.use(express.json());
app.use(cors());

//session
app.use(
	session({
		name: 'sid',
		secret: 'correct horse battery staple!',
		cookie: {
			maxAge: 1 * 24 * 60 * 60 * 1000,
			secure: process.env.NODE_ENV === 'production'
		},
		httpOnly: true,
		resave: false,
		saveUninitialized: false
	})
);

app.post('/api/register', validateUser, async (req, res) => {
	try {
		const data = {
			username: req.body.username,
			password: bcrypt.hashSync(req.body.password, 10)
		};
		const newUser = await db.createUser(data);
		res.status(201).json(newUser);
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: 'Failed to create user' });
	}
});

app.post('/api/login', validateLogin, async (req, res) => {
	try {
		const user = await db.getUserByUsername(req.body.username);
		if (!user) {
			return res.status(422).json({ error: 'you shall not pass!' });
		}
		//username matched
		if (!bcrypt.compareSync(req.body.password, user.password)) {
			return res.status(422).json({ error: 'you shall not pass!' });
		}
		req.session.userId = user.id;
		req.session.save();
		res.status(200).end();
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: 'you shall not pass!' });
	}
});

app.use('/api/users', loadUserFromSession);

app.get('/api/users', async (req, res) => {
	try {
		const users = await db.getAllUsers();
		res.status(200).json(users);
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: 'Failed to load users!' });
	}

	return res.status(403).json({
		error: 'you shall not pass!'
	});
});

// middleware

//validateUser
function validateUser(req, res, next) {
	if (!req.body.username || !req.body.password) {
		return res.status(422).json({
			error: 'Username and password are required to create a user'
		});
	}
	if (req.body.password !== req.body.confirmPassword) {
		return res.status(422).json({
			error: 'please make sure password and confirm password are matching'
		});
	}
	next();
}

//validateLogin
function validateLogin(req, res, next) {
	if (!req.body.username || !req.body.password) {
		return res.status(422).json({
			error: 'username and password are required to login'
		});
	}
	next();
}

//load user from session
async function loadUserFromSession(req, res, next) {
	if (!req.session.userId) {
		console.log('no user id');
		return res.status(403).json({
			error: 'you shall not pass!'
		});
	}
	try {
		const user = await db.getUserById(req.session.userId);
		req.user = user;
		next();
	} catch (e) {
		console.error(e);
		res.status(403).json({ error: 'you shall not pass!' });
	}
}

const port = process.env.PORT || 4040;

console.log(`Server listening on port ${port}`);
app.listen(port);
