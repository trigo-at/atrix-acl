'use strict';

const getResource = (petId, tenantId) => {
	return {
		id: petId,
		name: 'Pet 42',
		tenantId: tenantId || 'ak',
		photoUrls: ['http://pet_42.pic'],
		_embedded: {
			toys: [{
				id: 42,
				name: 'foo',
				tenantId: tenantId || 'ak',
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
			}, {
				id: 32,
				tenantId: 'tenant2',
				name: 'bar',
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
			}, {
				id: 42,
				name: 'foo',
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
				_embedded: {
					toys: [{
						id: 42,
						name: 'foo',
						tenantId: tenantId || 'ak',
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
					}, {
						id: 32,
						tenantId: 'tenant2',
						name: 'bar',
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
					}, {
						id: 42,
						name: 'foo',
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
					}, {
						id: 42,
						name: 'foo',
						tenantId: 'tenant2',
						// _acl: {
							// tenantIds: ['ak'],
						// },
						_links: {
							self: {
								href: '/pets/42',
								method: 'get',
							},
							update:	{
								href: '/pets/42',
								method: 'patch',
							},
							cancel:	{
								href: '/pets/42/cancellation',
								method: 'put',
							},
							'assign:venue:request': {
								href: '/pets/42/venue-requests',
								method: 'post',
							},
							'cancel:speaker': {
								href: '/pets/42/speaker-requests/{requestId}/cancellation',
								method: 'delete',
							},
						},
					}, {
						id: 43,
						name: 'foo',
						tenantId: 'tenant2',
						// _acl: {
							// roles: ['ak:user'],
						// },
						_links: {
							self: {
								href: '/pets/43',
								method: 'get',
							},
							update:	{
								href: '/pets/43',
								method: 'patch',
							},
							cancel:	{
								href: '/pets/43/cancellation',
								method: 'put',
							},
							'assign:venue:request': {
								href: '/pets/43/venue-requests',
								method: 'post',
							},
							'cancel:speaker': {
								href: '/pets/43/speaker-requests/{requestId}/cancellation',
								method: 'delete',
							},
						},
					}],
					food: {
						id: 123,
						tenantId: 'tenant2',
						name: 'salami',
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
				},
			}],
			beer: {
				id: 123,
				name: 'salami',
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
				_embedded: {
					vine: {
						id: 123,
						name: 'salami',
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

				},
			},
			food: {
				id: 123,
				tenantId: 'tenant2',
				name: 'salami',
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
		},
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
	};
};

module.exports = (req, reply) => {
	const res = getResource(req.params.petId, req.query.tenantId);
	if (req.query.tenantId === '__delete__') delete res.tenantId;
	reply(res);
};
