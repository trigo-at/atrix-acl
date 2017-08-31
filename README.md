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

- **aclDefinition** - path to the aclDefinition file, should return a method which returns an array of ACLs
- **allowInject** - allow hapi-inject routes, without applying ACLs
- **tokenResourceAccessRoleKey** - name of the default app in the JWT-token
- **endpoints** - endpoints which should be ignored


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
{ userId: '242', path: '/pets/123', method: 'get' }
```
Allow user with userId _242_ access to specific resource path _/pets/123_ with GET method

```
{ userId: '242', transition: 'cancel:speaker', method: '*' }
```
Allow user with userId _242_ to perform transition 'cancel:speaker'

```
{ userId: '242', transition: 'cancel:(*_)', method: '*' }
```
Allow user with userId _242_ to perform any transition starting with 'cancel:'


The AtrixACL uses [route-parser](https://www.npmjs.com/package/route-parser) npm package, to test incoming paths against the defined routes (similar to Hapi route definition).

## Rules / Token

The user role is extracted from the JWToken via the authorization header. The AtrixACL plugin assumes the following format of a token:

```
credentials: {
	preferred_username: "john.doe",
	email: "john.doe@test.com",
	name: "John Doe",
	resource_access: {
		voegb: { roles: ['admin'] },
		ak: { roles: ['admin'] },
		'pathfinder-app': { roles: ['super-admin'] },
	}
}
```

Given a configuration with the **tokenResourceAccessRoleKey** set to **pathfinder-app**, the AtrixACL uses this value as the default-role for the user (in the example above: 'super-admin')

If a **x-pathfinder-tenant-ids** header field is present, all the corresponding (tenant-specific) roles are extracted from the token and also tested agains the ACLs.


## Requests
The AtrixACL plugin hooks into two handlers of the hapi request-lifecycle:
- onPreHandler
- onPreResponse

### onPreHandler
The plugins checks if the current user/role has access to the requested route.
If not, it returns status-code 401.
The options **allowInject** and **endpoints** are taken into consideration.

### onPreResponse
The plugins checks if a **_links** object is present in the response (or, if response-body is an array, in every item of the array) and manipulates the response-body.
If present, every link/href in the hatr-links object is tested agains the ACLs and set to false, if the user/role has no access to a specific action/transition.
