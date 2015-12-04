describe('JsHyphen', function () {
    beforeEach(module('jsHyphen', function (HyphenProvider) {

    }));
    var dataModel = [
        {
            syncMethod: {action: "sync", url: "users/sync", method: "put"},
            model: "Users",
            rest: [
                {name: "getUserProjects", url: "users/user_projects", method: "get", authorize: true},
                {name: "signIn", url: "users/login", method: "post", processResponse: false},
                {name: "update", url: "users/update", method: "put"},
                {name: "create", url: "users/create", method: "post"},
                {name: "registerUser", url: "users/register", method: "post"},
                {name: "getAll", url: "users", method: "get"},
                {name: "delete", url: "users/:id", method: "delete"},
                {name: "getOne", url: "users/:id", method: "get"},
                {name: "removeAll", url: "users/remove_all", method: "post", action: "delete"},
                {name: "getUserProjects", url: "users/user_projects", method: "get", responseHandler: function(response, hyphenModels){
                    var projects= response.data.projects;
                    hyphenModels.Projects.addData(projects);
                    delete response.data.projects;
                    hyphenModels.Users.addData(response.data);
                }},
            ],
        },
        {
            model: "Projects",
            rest: [
                {name: "create", url: "projects/create", method: "post"},
                {name: "getAll", url: "projects", method: "get"},
                {name: "removeAll", url: "projects/remove_all", method: "post", action: "delete"},
            ],
        }
    ];

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

    var $httpBackend = null;
    beforeEach(inject(function ($injector, Hyphen) {
        // Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend');
        Hyphen.initialize(configuration);
    }));

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

    it('should have initialize function', inject(function (Hyphen) {
        expect(Hyphen.initialize).toBeDefined(Function);
    }));

    it('should have defined "Users" entity', inject(function (Hyphen) {
        expect(Hyphen.Users).toBeDefined();
    }));

    it('should have defined "Projects" entity', inject(function (Hyphen) {
        expect(Hyphen.Projects).toBeDefined();
    }));

    it('should have defined "getAll" method on "Users" entity', inject(function (Hyphen) {
        Hyphen.initialize(configuration);
        expect(Hyphen.Users.api.getAll).toBeDefined();
    }));

    it('should load all Users and and them to Users entity', inject(function (Hyphen) {
        var users = [user, user2, user3];
        $httpBackend.expectGET("/users").respond(200, users)
        Hyphen.Users.api.getAll.call();
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.getBy_Id(1)._id).toBe(1);
        expect(Hyphen.Users.dataModel.getBy_Id(2).user_first_name).toBe("Mike");
        expect(Hyphen.Users.dataModel.getData().length).toBe(users.length);
    }));

    it('should load single users using Api call', inject(function (Hyphen) {
        $httpBackend.expectGET("/users/1").respond(200, user)
        Hyphen.Users.api.getOne.call(1);
        $httpBackend.flush();
        expect(Hyphen.Users.dataModel.getBy_Id(1)._id).toBe(1);
    }));

    it('should update User name', inject(function (Hyphen) {
        user.user_first_name = "BlzejNewName";

        $httpBackend.expectPUT("/users/update").respond(200, user);
        Hyphen.Users.api.update.data = user;
        Hyphen.Users.api.update.call();
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.getBy_Id(1).user_first_name).toBe( user.user_first_name);
    }));

    it('should create User', inject(function (Hyphen) {
        $httpBackend.expectPOST("/users/create").respond(200, user);
        Hyphen.Users.api.update.data = user;
        Hyphen.Users.api.create.call();
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.getBy_Id(1).user_first_name).toBe( user.user_first_name);
    }));

    it('should create and then delete User', inject(function (Hyphen) {
        $httpBackend.expectPOST("/users/create").respond(200, user);
        Hyphen.Users.api.update.data = user;
        Hyphen.Users.api.create.call();
        $httpBackend.flush();
        expect(Hyphen.Users.dataModel.getBy_Id(1).user_first_name).toBe( user.user_first_name);

        $httpBackend.expectDELETE("/users/1").respond(200, user);
        Hyphen.Users.api.delete.call(1);
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.getBy_Id(1)).toBeUndefined()
    }));

    it('should be able to handle complex object', inject(function (Hyphen) {
        var user = {
            "_id": 1,
            user_email: "test1@email.com",
            user_first_name: "Blazej",
            user_last_name: "Grzelinski",
            projects: [{_id: 100, name: "Hyphen tests"}, {_id:200, name:"Hyphen projects"}]
        };

        $httpBackend.expectGET("/users/user_projects").respond(200, user);
        Hyphen.Users.api.getUserProjects.call();
        $httpBackend.flush();
        expect(Hyphen.Users.dataModel.getBy_Id(1).user_first_name).toBe( user.user_first_name);

        expect(Hyphen.Users.dataModel.getBy_Id(1).projects).toBeUndefined();
        expect(Hyphen.Projects.dataModel.getData().length).toBe(2);
        expect(Hyphen.Projects.dataModel.getBy_Id(100).name).toBe("Hyphen tests");

    }));

})