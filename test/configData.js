var dataModel = [
    {
        syncMethod: {action: "sync", url: "users/sync", method: "put"},
        model: "Users",
        key: "_id",
        rest: [
            {name: "signIn", url: "users/login", method: "post", processResponse: false},
            {name: "update", url: "users/update", method: "put"},
            {name: "create", url: "users/create", method: "post"},
            {name: "getAll", url: "users", method: "get"},
            {name: "delete", url: "users/:id", method: "delete"},
            {name: "getOne", url: "users/:id", method: "get"},
            {name: "removeAll", url: "users/remove_all", method: "post", action: "delete"},
            {name: "getUserProjects", url: "users/user_projects", method: "get", responseHandler: function(data, hyphenModels){
                var projects= data.projects;
                hyphenModels.Projects.addData(projects);
                delete data.projects;
                hyphenModels.Users.addData(data);
            }},
        ],
    },
    {
        model: "Projects",
        key: "_id",
        rest: [
            {name: "create", url: "projects/create", method: "post"},
            {name: "getAll", url: "projects", method: "get"},
            {name: "removeAll", url: "projects/remove_all", method: "post", action: "delete"},
        ],
    }
];

var user = {
    "_id": 1,
    user_email: "test1@email.com",
    user_first_name: "Blazej",
    user_last_name: "Grzelinski",
    user_password: "some_password"
};
var user2 = {
    "_id": 2,
    user_email: "test2@email.com",
    user_first_name: "Mike",
    user_last_name: "Collins",
    user_password: "some_other_password"
};
var user3 = {
    "_id": 3,
    user_email: "test3@email.pl",
    user_first_name: "Nathan",
    user_last_name: "Star",
    user_password: "star_password"
};

var timestamp = new Date / 1e3 | 0;

var configuration = {
    model: dataModel,
    baseUrl: "",
    dbVersion: timestamp * 1000,
    dbName: 'JsHyphenDb',
    requestInterceptor: function (config) {
        //intercept all request and provide authorization token
        var token = sessionStorage.getItem("token");
        config.headers = {Authorization: token};
        return config;
    },
    responseInterceptor: function () {
        throw new Error("Not implemented");
    }
};

jsHyphen.factory('Users', ['Hyphen', '$timeout', '$q', function (Hyphen, $timeout, $q) {

    var User = function (data) {
        //console.log(data);
    }

    User.key = "_id";

    User.prototype.getFullName = function () {
        return this.user_first_name + " " + this.user_last_name;
    }

    User.indexes = [{name: "Id", key: "_id"}, {name: "FirstName", key: "user_first_name"}];

    User.synchronize = function(data){
        var def= $q.defer();
        $timeout(function(){
            console.log("synchronize user")
            def.resolve("data resolvedd");
        }, 100);

        return def.promise;
    }

    return User;

}]);

jsHyphen.factory('Projects', ['$timeout', '$q', function ($timeout, $q) {
    var Project = function () {

    }

    Project.key = "_id";

    Project.indexes = [{name: "Id", key: "_id"}];

    Project.synchronize = function(){
        var def= $q.defer();
        $timeout(function(){
            def.resolve("data resolvedd");
        }, 100);

        return def.promise;
    }


    return Project;

}]);