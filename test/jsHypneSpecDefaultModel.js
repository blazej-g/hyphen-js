describe("Hyphen JS", function () {

    beforeEach(module('jsHyphen', function (HyphenProvider) {

    }));

    //beforeEach(function (done) {
    beforeEach(inject(function ($injector, Hyphen) {
        Hyphen.initialize(configuration);
        $httpBackend = $injector.get('$httpBackend');
    }));



    it('should load all Users using api call and store them in the Users array', inject(function (Hyphen) {
        var users = [user, user2, user3];
        $httpBackend.expectGET("/users").respond(200, users)
        Hyphen.Users.api.getAll.call();
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.getById(1)._id).toBe(1);
        expect(Hyphen.Users.dataModel.getById(2).user_first_name).toBe("Mike");
        expect(Hyphen.Users.dataModel.getData().length).toBe(users.length);
    }));


    it('should update User name using api call', inject(function (Hyphen) {
        user.user_first_name = "BlazejNewName";

        $httpBackend.expectPUT("/users/update").respond(200, user);
        Hyphen.Users.api.update.data = user;
        Hyphen.Users.api.update.call();
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.getById([1]).user_first_name).toBe(user.user_first_name);
    }));

    it('should create User using api call', inject(function (Hyphen) {
        $httpBackend.expectPOST("/users/create").respond(200, user);
        Hyphen.Users.api.update.data = user;
        Hyphen.Users.api.create.call();
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.getById([1]).user_first_name).toBe(user.user_first_name);
    }));

    it('should create and then delete User using api call', inject(function (Hyphen) {
        $httpBackend.expectPOST("/users/create").respond(200, user);
        Hyphen.Users.api.update.data = user;
        Hyphen.Users.api.create.call();
        $httpBackend.flush();
        expect(Hyphen.Users.dataModel.getById([1]).user_first_name).toBe(user.user_first_name);

        $httpBackend.expectDELETE("/users/1").respond(200, user);
        Hyphen.Users.api.delete.call({id:1});
        $httpBackend.flush();

        expect(Hyphen.Users.dataModel.getById([1])).toBeUndefined()
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
        expect(Hyphen.Users.dataModel.getById([1]).user_first_name).toBe(user.user_first_name);

        expect(Hyphen.Users.dataModel.getById([1]).projects).toBeUndefined();
        expect(Hyphen.Projects.dataModel.getData().length).toBe(2);
        expect(Hyphen.Projects.dataModel.getById([100]).name).toBe("Hyphen tests");

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


    it('should sort users', inject(function (Hyphen) {
        $httpBackend.expectPOST("/users/create").respond(200, [user, user2, user3]);
        Hyphen.Users.api.update.data = [user, user2, user3];
        Hyphen.Users.api.create.call();
        $httpBackend.flush();

        console.log(Hyphen.Users.dataModel.getData());
        expect(Hyphen.Users.dataModel.getData().length).toBe(3);


    }));


});


