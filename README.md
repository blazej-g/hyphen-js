#HyphenJs

HyphenJs, an Angular module made to simplify data model creation for Angular app.

###Installation
If you'd like to use npm, it's as easy as:
```html
npm install hyphen-js --save
```

```html
bower install hyphen-js --save
```

or download source code with minified version from git hub:
[source code] (https://github.com/blazejgrzelinski/hyphen-js)

Add HyphenJs script to your html file, usaually it should looks like below (when installed with npm)

```html
<script src="node_modules/hyphen-js/dist/hyphen-js.js"></script>
```

### Prerequisites
Hyphen JS require Angular and Underscore.

### Add Hyphen dependency to Angular app

```javascript
var exampleApp = angular.module('timeMinder', ['jsHyphen']);
```

### Data models and configuration

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
