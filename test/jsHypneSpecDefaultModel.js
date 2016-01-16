describe("Hyphen JS", function () {

    beforeEach(module('jsHyphen', function (HyphenProvider) {

    }));

    //beforeEach(function (done) {
    beforeEach(inject(function ($injector, Hyphen) {
        Hyphen.initialize(configuration);
        $httpBackend = $injector.get('$httpBackend');
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
        expect(Hyphen.Users.dataModel.getById).toBeDefined();
    }));

    it('should be defined Users index "Id"', inject(function (Hyphen) {
        expect(Hyphen.Users.dataModel.getById).toBeDefined();
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


    it("should api method return promise", function (done) {
        inject(function (Hyphen) {
            var users = [user, user2, user3];
            setTimeout(function () {
                var promise=Hyphen.Users.api.getAll.call();
                $httpBackend.expectGET("/users").respond(200, users);
                $httpBackend.flush();
                expect(promise.toBeDefined);
                done();
            }, 100);
        })
    }, 200);

    it("should get all users", function (done) {
        inject(function (Hyphen) {
            var users = [user, user2, user3];
            setTimeout(function () {
                Hyphen.Users.api.getAll.call();
                $httpBackend.expectGET("/users").respond(200, users);
                $httpBackend.flush();

                expect(Hyphen.Users.dataModel.toBeDefined);
                expect(Hyphen.Users.dataModel.getById(1)._id).toBe(1);
                expect(Hyphen.Users.dataModel.getById(2).user_first_name).toBe("Mike");
                expect(Hyphen.Users.dataModel.getData().length).toBe(users.length);

                done();
            }, 100);

        })

    }, 200);

    it("should load all Users using api call and store them in the Users array", function (done) {
        inject(function (Hyphen) {
            var users = [user, user2, user3];
            setTimeout(function () {
                Hyphen.Users.api.getAll.call();
                $httpBackend.expectGET("/users").respond(200, users)

                $httpBackend.flush();
                expect(Hyphen.Users.dataModel.getById(1)._id).toBe(1);
                expect(Hyphen.Users.dataModel.getById(2).user_first_name).toBe("Mike");
                expect(Hyphen.Users.dataModel.getData().length).toBe(users.length);
                done();
            }, 100);
        })
    }, 200);

    it('should load single users using api call', function (done) {
        inject(function (Hyphen) {
            setTimeout(function () {
                $httpBackend.expectGET("/users/1").respond(200, user)
                Hyphen.Users.api.getOne.call(1);
                $httpBackend.flush();
                expect(Hyphen.Users.dataModel.getById(1)._id).toBe(1);
                done();
            }, 100);
        });
    }, 200);

    it('should create User using api call', function (done) {
        inject(function (Hyphen) {
            setTimeout(function () {
                $httpBackend.expectPOST("/users/create").respond(200, user);
                Hyphen.Users.api.update.data = user;
                Hyphen.Users.api.create.call();
                $httpBackend.flush();
                expect(Hyphen.Users.dataModel.getById(1).user_first_name).toBe(user.user_first_name);
                done();
            }, 100);
        });
    }, 200);

    it('should delete User using api call', function (done) {
        inject(function (Hyphen) {
            setTimeout(function () {
                $httpBackend.expectDELETE("/users/1").respond(200, user);
                Hyphen.Users.api.delete.call(1);
                $httpBackend.flush();

                expect(Hyphen.Users.dataModel.getById(1)).toBeUndefined();
                done();
            }, 100);
        });
    }, 200);

    it('should be able to handle complex object using api call', function (done) {
        inject(function (Hyphen) {
            setTimeout(function () {
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
                expect(Hyphen.Users.dataModel.getById(1).user_first_name).toBe(user.user_first_name);
                expect(Hyphen.Users.dataModel.getById(1).projects).toBeUndefined();
                expect(Hyphen.Projects.dataModel.getData().length).toBe(2);
                expect(Hyphen.Projects.dataModel.getById(100).name).toBe("Hyphen tests");
                done();
            }, 100);
        });
    }, 200);

    it('should use custom model for Users Entity and should have custom index created', function (done) {
        inject(function (Hyphen) {
            setTimeout(function () {
                $httpBackend.expectPOST("/users/create").respond(200, [user, user2, user3]);
                Hyphen.Users.api.update.data = [user, user2, user3];
                Hyphen.Users.api.create.call();
                $httpBackend.flush();

                expect(Hyphen.Users.dataModel.getByFirstName).toBeDefined();
                done();
            }, 100);
        });
    }, 200);

    it('should use custom model for Users Entity and should have custom method on User model', function (done) {
        inject(function (Hyphen) {
            setTimeout(function () {
                $httpBackend.expectPOST("/users/create").respond(200, [user, user2, user3]);
                Hyphen.Users.api.update.data = [user, user2, user3];
                Hyphen.Users.api.create.call();
                $httpBackend.flush();

                expect(Hyphen.Users.dataModel.data[0].getFullName).toBeDefined();
                done();
            }, 100);
        });
    }, 200);

    //project tests
    it('should have defined "Projects" entity', inject(function (Hyphen) {
        expect(Hyphen.Projects).toBeDefined();
    }));

});


