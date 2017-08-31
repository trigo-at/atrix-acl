module.exports = (req, reply) => reply([{
	id: 42,
	name: 'Pet 42',
	photoUrls: ['http://pet_42.pic'],
	_links: {
		self: {
			href: '/pets/242',
			method: 'get',
		},
		update:	{
			href: '/pets/242',
			method: 'patch',
		},
		cancel:	{
			href: '/pets/242/cancellation',
			method: 'put',
		},
		'assign:venue:request': {
			href: '/pets/242/venue-requests',
			method: 'post',
		},
		'cancel:speaker': {
			href: '/pets/242/speaker-requests/{requestId}/cancellation',
			method: 'delete',
		},
	},
},
{
	id: 242,
	name: 'Pet 242',
	photoUrls: ['http://pet_42.pic'],
	_links: {
		self: {
			href: '/pets/242',
			method: 'get',
		},
		update:	{
			href: '/pets/242',
			method: 'patch',
		},
		cancel:	{
			href: '/pets/242/cancellation',
			method: 'put',
		},
		'assign:venue:request': {
			href: '/pets/242/venue-requests',
			method: 'post',
		},
		'cancel:speaker': {
			href: '/pets/242/speaker-requests/{requestId}/cancellation',
			method: 'delete',
		},
	},
}]);
