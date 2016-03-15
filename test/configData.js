var dataModel = [
    {
        syncMethod: {action: "sync", url: "users/sync", method: "put"},
        model: "Users",
        key: "_id",
        sync:true,
        rest: [
            {name: "signIn", url: "/users/login", method: "post", processResponse: false, offline: true},
            {name: "update", url: "/users/update", method: "put", offline: true},
            {name: "create", url: "/users/create", method: "post", offline: true},
            {name: "getAll", url: "/users", method: "get", offline: true},
            {name: "delete", url: "/users/:id", method: "delete", offline: true},
            {name: "getOne", url: "/users/:id", method: "get", offline: true},
            {name: "getUserComplexParams", url: "/users/:userId/project/:projectId?name=:firstName&age=:age", method: "get", offline: true},
            {name: "getUserWithParams", url: "/users/:userId/project/:projectId?age=:age", method: "get", offline: true},
            {name: "getUserTwoParams", url: "/users/:id/project/:projectId", method: "get", offline: true},
            {name: "removeAll", url: "/users/remove_all", method: "post", action: "delete", offline: true},
            {
                name: "getUserProjects",
                url: "/users/user_projects",
                method: "get",
                responseHandler: function (data, hyphenModels) {
                    var projects = data.projects;
                    hyphenModels.Projects.add(projects);
                    delete data.projects;
                    hyphenModels.Users.add(data);
                }
            },
        ],
    },
    {
        model: "Projects",
        key: "_id",
        rest: [
            {name: "create", url: "/projects/create", method: "post"},
            {name: "getAll", url: "/projects", method: "get"},
            {name: "removeAll", url: "/projects/remove_all", method: "post", action: "delete"},
        ],
    }
];

var user = {
    "_id": 1,
    memberId: 1,
    user_email: "test1@email.com",
    user_first_name: "Blazej",
    user_last_name: "Grzelinski",
    user_password: "some_password"
};
var user2 = {
    "_id": 2,
    memberId: 1,
    user_email: "test2@email.com",
    user_first_name: "Mike",
    user_last_name: "Collins",
    user_password: "some_other_password"
};
var user3 = {
    "_id": 3,
    memberId: 2,
    user_email: "test3@email.pl",
    user_first_name: "Antoni",
    user_last_name: "Star",
    user_password: "star_password"
};

var timestamp = new Date / 1e3 | 0;

var configuration = {
    model: dataModel,
    baseUrl: "",
    dbVersion:  _.now(),
    dbName: 'JsHyphenDb',
    requestInterceptor: function (config) {
        //intercept all request and provide authorization token
        var token = sessionStorage.getItem("token");
        config.headers = {Authorization: token};
        return config;
    },
    responseInterceptor: function (data, config) {
        return data;
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

    User.indexes =
    {
        _id: "Id",
        user_first_name: "FirstName"
    }

    User.groups =
    {
        memberId: "MemberId"
    }

    User.sort =
    {
        desc: "user_first_name"
    }

    User.createOffline = function (params, data, dataModel) {
        data._id = Math.random() * 10000;
        dataModel.Users.add(data);
        var d="fdf";
    };


    User.deleteOffline = function (params, data, dataModel) {
        var user = dataModel.Users.getById(params.id);
        if (user)
            dataModel.Users.remove(user);
    };

    User.updateOffline = function (params, data, dataModel) {
        dataModel.Users.add(data);
    }


    User.new = function (record) {
        delete record._id;
        Hyphen.Users.api.create.data = record;
        return Hyphen.Users.api.create.call()
    }

    return User;

}]);

jsHyphen.factory('Projects', ['$timeout', '$q', function ($timeout, $q) {
    var Project = function () {

    }
    Project.key = "_id";

    Project.indexes = {_id: "Id"}

    Project.synchronize = function () {
        var def = $q.defer();
        $timeout(function () {
            def.resolve("data resolvedd");
        }, 100);

        return def.promise;
    }

    return Project;

}]);