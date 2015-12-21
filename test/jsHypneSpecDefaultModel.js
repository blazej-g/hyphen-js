describe('JsHyphenDefaultModel', function () {
    beforeEach(module('jsHyphen', function (HyphenProvider) {

    }));

    var $httpBackend = null;
    beforeEach(inject(function ($injector, Hyphen) {
        // Set up the mock http service responses

        jsHyphen.factory('Users', ['Hyphen', function (Hyphen) {
            var User = function (data) {
                //console.log(data);
            }
            User.key = "_id";
            User.prototype.getFullName = function () {
                return this.user_first_name + " " + this.user_last_name;
            }
            User.indexes = [{name: "Id", key: "_id"}, {name: "_Id", key: "_id"}, {name: "FirstName", key: "user_first_name"}];
            return User;
        }]);
        $httpBackend = $injector.get('$httpBackend');
        Hyphen.initialize(configuration);
    }));

    it('should have initialize function', inject(function (Hyphen) {
        expect(Hyphen.initialize).toBeDefined(Function);
    }));

    it('should have defined "Users" entity', inject(function (Hyphen) {
        expect(Hyphen.Users).toBeDefined();
    }));

    it('should have defined "signIn" method on "Users" entity', inject(function (Hyphen) {
        expect(Hyphen.Users.api.signIn).toBeDefined();
    }));

    it('should have defined "update" method on "Users" entity', inject(function (Hyphen) {
        expect(Hyphen.Users.api.update).toBeDefined();
    }));

    it('should have defined "getAll" method on "Users" entity', inject(function (Hyphen) {
        expect(Hyphen.Users.api.getAll).toBeDefined();
    }));

    it('should have defined "getOne" method on "Users" entity', inject(function (Hyphen) {
        expect(Hyphen.Users.api.getOne).toBeDefined();
    }));

    it('should have defined "removeAll" method on "Users" entity', inject(function (Hyphen) {
        expect(Hyphen.Users.api.removeAll).toBeDefined();
    }));

    it('should have defined "getUserProjects" method on "Users" entity', inject(function (Hyphen) {
        expect(Hyphen.Users.api.getUserProjects).toBeDefined();
    }));

    it('should have defined "delete" method on "Users" entity', inject(function (Hyphen) {
        expect(Hyphen.Users.api.delete).toBeDefined();
    }));

    it('should be defined Users "dataModel"', inject(function (Hyphen) {
        expect(Hyphen.Users.dataModel).toBeDefined();
    }));

    it('should be defined Users index on "_Id"', inject(function (Hyphen) {
        expect(Hyphen.Users.dataModel.getBy_Id).toBeDefined();
    }));

    it('should be defined Users index "Id"', inject(function (Hyphen) {
        expect(Hyphen.Users.dataModel.getById).toBeDefined();
    }));

    it('should load all Users using api call and store them in the Users array', inject(function (Hyphen) {
        var users = [user, user2, user3];
        $httpBackend.expectGET("/users").respond(200, users)
        Hyphen.Users.api.getAll.call();
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.getBy_Id(1)._id).toBe(1);
        expect(Hyphen.Users.dataModel.getBy_Id(2).user_first_name).toBe("Mike");
        expect(Hyphen.Users.dataModel.getData().length).toBe(users.length);
    }));

    it('should load single users using api call', inject(function (Hyphen) {
        $httpBackend.expectGET("/users/1").respond(200, user)
        Hyphen.Users.api.getOne.call(1);
        $httpBackend.flush();
        expect(Hyphen.Users.dataModel.getBy_Id(1)._id).toBe(1);
    }));

    it('should update User name using api call', inject(function (Hyphen) {
        user.user_first_name = "BlazejNewName";

        $httpBackend.expectPUT("/users/update").respond(200, user);
        Hyphen.Users.api.update.data = user;
        Hyphen.Users.api.update.call();
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.getBy_Id(1).user_first_name).toBe(user.user_first_name);
    }));

    it('should create User using api call', inject(function (Hyphen) {
        $httpBackend.expectPOST("/users/create").respond(200, user);
        Hyphen.Users.api.update.data = user;
        Hyphen.Users.api.create.call();
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.getBy_Id(1).user_first_name).toBe(user.user_first_name);
    }));

    it('should create and then delete User using api call', inject(function (Hyphen) {
        $httpBackend.expectPOST("/users/create").respond(200, user);
        Hyphen.Users.api.update.data = user;
        Hyphen.Users.api.create.call();
        $httpBackend.flush();
        expect(Hyphen.Users.dataModel.getBy_Id(1).user_first_name).toBe(user.user_first_name);

        $httpBackend.expectDELETE("/users/1").respond(200, user);
        Hyphen.Users.api.delete.call(1);
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.getBy_Id(1)).toBeUndefined()
    }));

    it('should be able to handle complex object using api call', inject(function (Hyphen) {
        var user = {
            "_id": 1,
            user_email: "test1@email.com",
            user_first_name: "Blazej",
            user_last_name: "Grzelinski",
            projects: [{_id: 100, name: "Hyphen tests"}, {_id: 200, name: "Hyphen projects"}]
        };

        $httpBackend.expectGET("/users/user_projects").respond(200, user);
        Hyphen.Users.api.getUserProjects.call();
        $httpBackend.flush();
        expect(Hyphen.Users.dataModel.getBy_Id(1).user_first_name).toBe(user.user_first_name);

        expect(Hyphen.Users.dataModel.getBy_Id(1).projects).toBeUndefined();
        expect(Hyphen.Projects.dataModel.getData().length).toBe(2);
        expect(Hyphen.Projects.dataModel.getBy_Id(100).name).toBe("Hyphen tests");

    }));

    it('should remove all 3 users using api call', inject(function (Hyphen) {
        $httpBackend.expectPOST("/users/create").respond(200, [user, user2, user3]);
        Hyphen.Users.api.update.data = [user, user2, user3];
        Hyphen.Users.api.create.call();
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.getData().length).toBe(3);
        $httpBackend.expectPOST("/users/remove_all").respond(200, [user, user2, user3]);
        Hyphen.Users.api.removeAll.call();
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.getData().length == 0);
    }));

    it('should have defined addFactory method', inject(function ($injector, Hyphen) {
        //expect(Hyphen.addFactory).toBeDefined();
    }));

    it('should use custom model for Users Entity and should have custom index created', inject(function ($injector, Hyphen) {
        $httpBackend.expectPOST("/users/create").respond(200, [user, user2, user3]);
        Hyphen.Users.api.update.data = [user, user2, user3];
        Hyphen.Users.api.create.call();
        $httpBackend.flush();


        expect(Hyphen.Users.dataModel.getByFirstName).toBeDefined();
    }));

    it('should use custom model for Users Entity and should have custom method on User model', inject(function ($injector, Hyphen) {
        $httpBackend.expectPOST("/users/create").respond(200, [user, user2, user3]);
        Hyphen.Users.api.update.data = [user, user2, user3];
        Hyphen.Users.api.create.call();
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.data[0].getFullName).toBeDefined();
    }));

    it('should return Full User name nase on custom method', inject(function ($injector, Hyphen) {
        user.user_first_name = "Blazej";
        $httpBackend.expectPOST("/users/create").respond(200, [user, user2, user3]);
        Hyphen.Users.api.update.data = [user, user2, user3];
        Hyphen.Users.api.create.call();
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.data[0].getFullName()).toBe("Blazej Grzelinski");
    }));





    //project tests
    it('should have defined "Projects" entity', inject(function (Hyphen) {

        expect(Hyphen.Projects).toBeDefined();
    }));

})