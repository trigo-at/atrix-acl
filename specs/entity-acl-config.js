module.exports = () => [
	{
		entity: 'budget',
		route: '/events/:id/budget/:bid(/*_)',
		idParam: 'bid',
	}, {
		entity: 'budget',
		route: '/persons/:id/budget/:bid(/*_)',
		idParam: 'bid',
	},
];
