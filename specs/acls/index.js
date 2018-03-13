'use strict';

module.exports = () => [
	{tenant: '*', role: 'admin', path: '/*a', method: '*'},
	{tenant: '*', role: 'editor1', path: '/with-inject', method: 'get'},
	{tenant: '*', role: 'editor1', path: '/pets/:petId', method: 'put'},
	{tenant: '*', role: 'editor1', path: '/pets/:petId/toys/*_', method: 'put'},
	{
		tenant: '*',
		role: 'editor1',
		path: '/pets/:petId/toys/1/buy',
		method: 'post',
	},
	{
		tenant: '*',
		role: 'editor2',
		path: '/pets/:petId/toys/:toyId/buy',
		method: 'post',
	},
];
