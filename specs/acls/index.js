'use strict';

module.exports = () => [
	{ role: 'admin', path: '/*a', method: '*' },
	{ role: 'editor1', path: '/pets/:petId', method: 'put' },
	{ role: 'editor1', path: '/pets/:petId/toys/*_', method: 'put' },
	{ role: 'editor1', path: '/pets/:petId/toys/1/buy', method: 'post' },
	{ role: 'editor2', path: '/pets/:petId/toys/:toyId/buy', method: 'post' },
];
