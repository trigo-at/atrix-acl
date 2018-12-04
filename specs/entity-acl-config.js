module.exports = () => [
    {
        entity: 'budget',
        path: '/events/:id/budget/:bid(/*_)',
        idParam: 'bid',
    },
    {
        entity: 'budget',
        path: '/persons/:id/budget/:bid(/*_)',
        idParam: 'bid',
    },
];
