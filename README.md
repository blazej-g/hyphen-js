#HyphenJs

HyphenJs is Angular module for easy implementing restfull api and building data model with offline mode support.

* **Robust Configuration:** With HyphenJs you can configure all your api routes in just a couple of minutes.
* **DataModel:** HyphenJs organize all your client side data, so need to build model by your own!. HyphenJs fascade the promise and http layer so no need to pollute your controllers with promise.then(function(...
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
            sync: true,
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
            sync: true,
            priority: 1,
            rest: [
                {name: "create", url: "/projects/create", method: "post"},
                {name: "getAll", url: "/projects", method: "get", cache: true},
                {name: "removeAll", url: "/projects/remove_all", method: "post", action: "delete"},
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
* action - change the default method behaviour which is add or update for GET, POST and PUT




