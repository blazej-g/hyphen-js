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
            {name: "removeAll", url: "/users/remove_all", method: "post"},
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

var configuration = {
    model: dataModel,
    baseUrl: "",
};

jsHyphen.factory('Users', ['Hyphen', '$timeout', '$q', function (Hyphen, $timeout, $q) {
    var User = function (data) {
    };

    User.prototype.getFullName = function () {
        return this.user_first_name + " " + this.user_last_name;
    };

    return User;
}]);

jsHyphen.factory('Projects', ['$timeout', '$q', function ($timeout, $q) {
    var Project = function () {

    };

    return Project;
}]);

jsHyphen.factory('Teams', ['$timeout', '$q', function ($timeout, $q) {
    var Teams = function () {

    };

    return Teams;

}]);