# HyphenJs

HyphenJs, an Angular module made to simplify data model creation for Angular app.

### Installation
If you'd like to use npm, it's as easy as:
```html
npm install hyphen-js --save
```

```html
bower install hyphen-js --save
```

or download source code with minified version from git hub:
[source code] (https://github.com/blazejgrzelinski/hyphen-js)

Add HyphenJs script to your html file, usually it should looks like below (when installed with npm)

```html
<script src="node_modules/hyphen-js/dist/hyphen-js.js"></script>
```

### Prerequisites
Hyphen JS require Angular 1.x and Underscore.

### Add Hyphen dependency to Angular app

```javascript
var exampleApp = angular.module('example', ['jsHyphen']);
```

### Defining Hyphen models

```javascript
jsHyphen.factory('Users', [function () {
    var User = function (data) {
    };

    User.prototype.getFullName = function () {
        return this.user_first_name + " " + this.user_last_name;
    };

    return User;
}]);

jsHyphen.factory('Projects', [function () {
    var Project = function () {

    };

    return Project;
}]);

jsHyphen.factory('Teams', [function () {
    var Project = function () {

    };

    return Project;
}]);
```

### Data models and configuration

Data model is an object containing defined model, each model has to have:

    * model - point the model for the entity
    * key - obigarory key field
    * embedObjects - hyphen js will traverse the data and automatically populate the models
    
    For example for following json which is User entity, it will create one user, two projects and one team

    
   ```javascript
    {
                "_id": 1,
                user_email: "test1@email.com",
                user_first_name: "Blazej",
                user_last_name: "Grzelinski",
                projects: [{_id: 100, name: "Hyphen project tests"}, {
                    _id: 200,
                    name: "Hyphen projects",
                    teams: [{_id: 10, name: "testTeam"}]
                }]
            }
    ```
    
```javascript
var dataModel = {
    "Teams": {
        model: "Teams",
        key: "_id",
        rest: [{name: "getAll", url: "/teams", method: "get"}],
    },
    "Users": {
        model: "Users",
        key: "_id",
        embedObjects: {projects: "Projects", teams: "Teams"},
        rest: [
            {name: "signIn", url: "/users/login", method: "post"},
            {name: "update", url: "/users/update", method: "put"},
            {name: "create", url: "/users/create", method: "post"},
            {name: "getAll", url: "/users", method: "get"},
            {name: "delete", url: "/users/:id", method: "delete"},
            {name: "getOne", url: "/users/:id", method: "get"},
            {name: "getUserWithParams", url: "/users/:userId/project/:projectId?age=:age", method: "get"},
            {name: "getUserTwoParams", url: "/users/:id/project/:projectId", method: "get"},
            {name: "removeAll", url: "/users/remove_all", method: "post", action: "delete"},
            {name: "getUserProjects", url: "/users/user_projects", method: "get"},
            {name: "getUserProjectsTeams", url: "/users/user_projects_teams", method: "get"},
            {name: "getUserComplexParams", url: "/users/1/project/3?name=blazej&age=100", method: "get"},
        ],
    },
    "Projects": {
        model: "Projects",
        key: "_id",
        embedObjects: {teams: "Teams"},
        rest: [
            {name: "create", url: "/projects/create", method: "post"},
            {name: "getAll", url: "/projects", method: "get"},
            {name: "removeAll", url: "/projects/remove_all", method: "post"},
        ],
    }
};

```

### Initializing Hyphen

```javascript
  Hyphen.initialize(configuration);
```

### Calling api rest methods and binding to data

#### Getting all users
```javascript
     Hyphen.Users.api.getAll().save();
     //save method saves the result in data model
```

#### Binding to model data
```html
     <!--getting user with id=1-->
     <div>{{Hyphen.Users.provider.findOne({_id: 1})}}</div>
     
     <!--displaying user full name (getFullName method is defined on user model)-->
     <div>{{Hyphen.Users.provider.findOne({_id: 1}).getFullName()}}</div>
    
```

### Updating user with _id=1
```javascript
     Hyphen.Users.api.update({_id: 1}, user).save();
```

### Get users and save them in Users collection
```javascript
    Hyphen.Users.api.getUsers().save("Users");
```


### Getting all users with name 'Alex'
```html
     <div>{{Hyphen.Users.provider.where({'name': 'Alex'})}}</div>
```
