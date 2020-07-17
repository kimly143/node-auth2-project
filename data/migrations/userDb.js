const db = require('./db');

const getAllUsers = () => {
	return db('users');
};

const createUser = (user) => {
	return db('users').insert(user).then(([ id ]) => getUserById(id));
};

const getUserById = (id) => {
	return db('users').where('id', id).first();
};

const getUserByUsername = (username) => {
	return db('users').where('username', username).first();
};

module.exports = { getAllUsers, getUserById, getUserByUsername, createUser };
