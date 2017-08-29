# Atrix ACL

Atrix plugin providing Access Control Lists to requests to specific routes.

## Configuration

Sample Configuration:
```
acl: {
	aclDefinition: path.join(__dirname, './acls'),
	allowInject: true,
	tokenResourceAccessRoleKey: 'pathfinder-app',
	endpoints: [
		'^(?!(/alive|/reset))',
	],
}
```

- aclDefinition - path to the aclDefinition file, should return a method which returns an array of ACLs
- allowInject - allow hapi-inject routes, without applying ACLs
- tokenResourceAccessRoleKey - name of the default app in the JWT-token
- endpoints - endpoints which should be ignored


## ACL Definitions
Example:
```
{	role: 'admin', path: '/*a', method: '*' }
```
Allow user with role _admin_ to access all _paths_ with all _methods_


```
{ role: 'editor1', path: '/pets/:petId', method: 'put' }
```
Allow user with role _editor1_ access to path _/pets/:petId_ with PUT method

```
{ userId: 'editor1', path: '/pets/:petId', method: 'put' }
```
Allow user with role _editor1_ access to path _/pets/:petId_ with PUT method
