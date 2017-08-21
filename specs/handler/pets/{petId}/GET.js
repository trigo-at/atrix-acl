module.exports = (req, reply) => reply({
	id: req.params.petId,
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
});
