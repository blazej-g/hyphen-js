#HyphenJs

HyphenJs is Angular module for easy implementing restfull api and building data model with offline mode support.

* **Robust Configuration:** With HyphenJs you can configure all your api routes in just a couple of minutes but you still need to spend some time on defining addtional stuff. HyphenJs is made to support build process of not trivial apps, to works with large amount of data and substantial complexity where not having data model become developers nightmare.
* **DataModel:** HyphenJs organize all your client side data, so need to build model by your own!. HyphenJs fascade the promise and http layer. Your controllers remain clear and from from http promises handling.
* **Agility and speed:** With HyphenJs you can define any number of indexes for each model, so you are always 100% sure that it will not slow down your app when you bind it using angular.
* **Transparency:** HyphenJs makes that your app can work in offline mode as well as in online mode.
* **Synchronization:** When your app return to online mode HyphenJs will synchronize all the entities created in offline mode.

### Examples

Basic live demo, [deployed to heroku](https://hyphen-js.herokuapp.com/#/sign_in) (this app allow user to register, sign in and create additionall users, still under construction but you can see HyphenJs In action)

[Basic live demo code ](https://github.com/blazej-g/hyphen-js-example)

###Installation
If you'd like to use npm, it's as easy as:
```html
npm install hyphen-js --save
```
or download source code with minified version from git hub:
[source code] (https://github.com/blazejgrzelinski/hyphen-js)

Add HyphenJs script to your html file, usaually it should looks like below (when installed with npm)

```html
<script src="node_modules/hyphen-js/dist/hyphen-js.js"></script>
```

### Prerequisites
Hyphen JS require Angular and Underscore.


###Configuration and setup

####Add HyphenJs to your Angular app as dependency
```javascript
var exampleApp = angular.module('exampleApp', ['jsHyphen']);
```

####Configure api calls
```javascript
exampleApp.run(['$rootScope', 'Hyphen', 'Environments', '$state',
function ($rootScope, Hyphen, Environments, $state) {

    var dataModel = [
        {
            model: "Users",
            priority: 0,
            sync: false,
            key: "_id",
            rest: [
                {name: "update", url: "/users/update", method: "put"},
                {name: "create", url: "/users/create", method: "post"},
                {name: "getAll", url: "/users", method: "get", cache: true},
                {name: "delete", url: "/users/:id", method: "delete"},
                {name: "getOne", url: "/users/:id", method: "get"},
            ],
        },
        {
            model: "Projects",
            key: "_id",
            sync: false,
            priority: 1,
            rest: [
                {name: "create", url: "/projects/create", method: "post"},
                {name: "getAll", url: "/projects", method: "get", cache: true},
            ],

        },

    ];
    }]);
```

####Configuration options
* model `[string]` - name of the model resposnible for the entity
* priority `[int]` - model synchronization priority (model with priotity 1 will be synchronized before model with priority 2)
* sync `[bool]` - enable model to work in offline mode and synchronize it 
* key `[unique identifier on model]` - can be any unique property on model.
* rest `[array]` - list of the rest calls

#####Rest options
* name  - name of the method
* url - api call path
* method - http method type



###Initializing HyphenJs

```javascript

exampleApp.run(['$rootScope', 'Hyphen', 'Environments', '$state',
function ($rootScope, Hyphen, Environments, $state) {
    var timestamp = new Date / 1e3 | 0;
    var configuration = {
        model: dataModel,
        baseUrl: Environments.settings.api,
        dbVersion: timestamp * 1000,
        dbName: 'JsHyphenDb',
        requestInterceptor: function (config) {
        },
        responseInterceptor: function (data, config, store) {
            return data;
        },
    }
    Hyphen.initialize(configuration);
}]);
```

###Initializing  HyphenJs IndexedDb database
Please be sure that you initiazlize IndexedDb when the current user is authenticated and has rights to perform api call. In the process of DB Initialization HyphenJs will try to sybchronize your offline data using api calls.

```javascript
 Hyphen.initializeDb("unique_identifier");
```

 `unique_identifier` - passed as parameter to function initializeDb ensure that db will be created for every user with unique id and offline data will be not messed up between users.
 
 
###Defining model entities

 
 ```javascript
 /* Users model */
 jsHyphen.factory('Users', ['Hyphen', function () {

    var User = function (data) {
      
    }

    User.prototype.getFullName = function () {
        return this.user_first_name + " " + this.user_last_name;
    }

    User.indexes =
    {
        _id: "Id",
        user_first_name: "FirstName"
    }

    User.groups =
    {
        user_first_name: "FirstName"
    }

    User.sort =
    {
        asc : "created_at"
    }
    }]);
    
    
    /*Projects model*/
    jsHyphen.factory('Projects', [function () {
    var Project = function () {}

    Project.indexes =
    {
        _id : "id"
    }
    }]);
 
 ```
 
###Using Hyphen.api and Hyphen.dataModel

 ```javascript
jsHyphen.controller('UsersCtrl', ['$scope', 'Hyphen', function ($scope, Hyphen) {
    $scope.Hyphen = Hyphen;
     //call api method which load all users
     Hyphen.Projects.api.getAll.call();
        
    //create new user using api call
    var user = {
        user_email: "test@gmail.com",
        user_first_name: "blazej",
        user_last_name: "grzelinski",
        user_password: "testpass"
     }
    Hyphen.Users.api.create.data = user;
    var p = Hyphen.Users.api.create.call();
      
        
    //get all users from users data model
    Hyphen.Users.dataModel.getAll();
    
    //get one user using index created on Id proprty
    Hyphen.Users.dataModel.getById(user_id);
        
        
    }]);
```

###Using Hyphen.dataModel in Angular template

```html
<div ng-controller="UsersCtrl">
        <span>Displays all users</span>
        <p>{{ Hyphen.Users.dataModel.getAll()}}</p>
        
        <span>Display one user</span>
        <p>{{ Hyphen.Users.dataModel.getById(user_id)}}</p>
</div>
```

