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
        Hyphen.Users.api.getAll();
        $httpBackend.flush();

        expect(Hyphen.Users.provider.findOne({_id: 1})._id).toBe(1);
        expect(Hyphen.Users.provider.findOne({_id: 2}).user_first_name).toBe("Mike");
        expect(Hyphen.Users.provider.getData().length).toBe(users.length);
    }));

    it('should update User name using api call', inject(function (Hyphen) {
        user.user_first_name = "BlazejNewName";
        $httpBackend.expectPUT("/users/update").respond(200, user);
        Hyphen.Users.api.update({_id: 1}, user);
        $httpBackend.flush();
        expect(Hyphen.Users.provider.findOne({_id: 1}).user_first_name).toBe("BlazejNewName");
    }));

    it('should create User using api call', inject(function (Hyphen) {
        $httpBackend.expectPOST("/users/create").respond(200, user);
        Hyphen.Users.api.create(null, user);
        $httpBackend.flush();
        expect(Hyphen.Users.provider.findOne({_id: 1}).user_first_name).toBe(user.user_first_name);
    }));

    it('should create and then delete User using api call', inject(function (Hyphen) {
        $httpBackend.expectPOST("/users/create").respond(200, user);
        Hyphen.Users.api.create(null, user);
        $httpBackend.flush();
        expect(Hyphen.Users.provider.findOne({_id: 1}).user_first_name).toBe(user.user_first_name);

        $httpBackend.expectDELETE("/users/1").respond(200, user);
        Hyphen.Users.api.delete({id: 1});
        $httpBackend.flush();
        expect(Hyphen.Users.provider.findOne({_id: 1})).toBeNull();
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
        Hyphen.Users.api.getUserProjects();
        $httpBackend.flush();
        expect(Hyphen.Users.provider.findOne({_id: 1}).user_first_name).toBe(user.user_first_name);
        expect(Hyphen.Users.provider.findOne({_id: 1}).projects).toBeUndefined();
        expect(Hyphen.Projects.provider.getData().length).toBe(2);
        expect(Hyphen.Projects.provider.findOne({_id: 100}).name).toBe("Hyphen tests");
    }));

    it('should be able to handle 2 level complex object using api call', inject(function (Hyphen) {
        var user = {
            "_id": 1,
            user_email: "test1@email.com",
            user_first_name: "Blazej",
            user_last_name: "Grzelinski",
            projects: [{_id: 100, name: "Hyphen tests"}, {
                _id: 200,
                name: "Hyphen projects",
                teams: [{_id: 10, name: "testTeam"}]
            }]
        };

        $httpBackend.expectGET("/users/user_projects_teams").respond(200, user);
        Hyphen.Users.api.getUserProjectsTeams();
        $httpBackend.flush();
        var t1 = Hyphen.Teams.provider.findOne({_id: 10}).name;
        var t2 = Hyphen.Teams.provider.findOne({_id: 10}).name;
        var t3 = Hyphen.Teams.provider.findOne({_id: 10}).name;
        expect(t1).toBe("testTeam");
    }));

    it('should be able to handle 2 level complex object using api call', inject(function (Hyphen) {
        var user = {
            "_id": 1,
            user_email: "test1@email.com",
            user_first_name: "Blazej",
            user_last_name: "Grzelinski",
            teams: [{_id: 11, name: "testTeam2"}],
            projects: [{_id: 100, name: "Hyphen tests"}, {
                _id: 200,
                name: "Hyphen projects",
                teams: [{_id: 10, name: "testTeam"}]
            }]
        };

        $httpBackend.expectGET("/users/user_projects_teams").respond(200, user);
        Hyphen.Users.api.getUserProjectsTeams();
        $httpBackend.flush();
        var teams = Hyphen.Teams.provider.getData();
        expect(teams.length).toBe(2);
    }));

    it('should be able to delete embed property', inject(function (Hyphen) {
        var user = {
            "_id": 1,
            user_email: "test1@email.com",
            user_first_name: "Blazej",
            user_last_name: "Grzelinski",
            projects: [{_id: 100, name: "Hyphen tests"}, {
                _id: 200,
                name: "Hyphen projects",
                teams: [{_id: 10, name: "testTeam"}]
            }]
        };

        $httpBackend.expectGET("/users/user_projects_teams").respond(200, user);
        Hyphen.Users.api.getUserProjectsTeams();
        $httpBackend.flush();
        var project = Hyphen.Projects.provider.findOne({_id: 100});
        console.log(project);
        expect(project.teams).toBeUndefined();
    }));

    it('should remove all 3 users using api call', inject(function (Hyphen) {
        $httpBackend.expectPOST("/users/create").respond(200, [user, user2, user3]);
        Hyphen.Users.api.create.call(null, [user, user2, user3]);
        $httpBackend.flush();

        expect(Hyphen.Users.provider.getData().length).toBe(3);
        $httpBackend.expectPOST("/users/remove_all").respond(200, [user, user2, user3]);
        Hyphen.Users.api.removeAll();
        $httpBackend.flush();

        expect(Hyphen.Users.provider.getData().length == 0);
    }));

    it('should use custom model for Users Entity and should have custom method on User model', inject(function ($injector, Hyphen) {
        $httpBackend.expectPOST("/users/create").respond(200, [user, user2, user3]);
        Hyphen.Users.api.create([user, user2, user3]);
        $httpBackend.flush();
        expect(Hyphen.Users.provider.data[0].getFullName).toBeDefined();
    }));

    it('should return Full User name nase on custom method', inject(function ($injector, Hyphen) {
        user.user_first_name = "Blazej";
        $httpBackend.expectPOST("/users/create").respond(200, [user, user2, user3]);
        Hyphen.Users.api.create([user, user2, user3]);
        $httpBackend.flush();

        expect(Hyphen.Users.provider.data[0].getFullName()).toBe("Blazej Grzelinski");
    }));

    it('should sort users', inject(function (Hyphen) {
        $httpBackend.expectPOST("/users/create").respond(200, [user, user2, user3]);
        Hyphen.Users.api.create([user, user2, user3]);
        $httpBackend.flush();
        expect(Hyphen.Users.provider.getData().length).toBe(3);

    }));

});


