describe("Hyphen JS", function () {

    beforeEach(module('jsHyphen', function (HyphenProvider) {

    }));

    //beforeEach(function (done) {
    beforeEach(inject(function ($injector, Hyphen) {
        Hyphen.initialize(configuration);
        $httpBackend = $injector.get('$httpBackend');
    }));

    it('should load single users using api call', inject(function (Hyphen) {
        $httpBackend.expectGET("/users/1").respond(200, user)
        Hyphen.Users.api.getOne.call({id: 1});
        $httpBackend.flush();
        expect(Hyphen.Users.dataModel.getById(1)._id).toBe(1);
    }));

    it('should be able to handle two params with double dot notation', inject(function (Hyphen) {
        $httpBackend.expectGET("/users/1/project/3").respond(200, user)
        Hyphen.Users.api.getUserTwoParams.call({id: 1, projectId: 3});
        $httpBackend.flush();
    }));

    it('should be able to handle dot and question params', inject(function (Hyphen) {
        $httpBackend.expectGET("/users/1/project/3?age=100").respond(200, user)
        Hyphen.Users.api.getUserWithParams.call({userId: 1, projectId: 3, age: 100});
        $httpBackend.flush();
    }));

    it('should be able to handle complex url params', inject(function (Hyphen) {
        ///users/:id/:projectId?name=firstName&age=age
        $httpBackend.expectGET("/users/1/project/3?name=blazej&age=100").respond(200, user)
        Hyphen.Users.api.getUserComplexParams.call({userId: 1, projectId: 3, age: 100, firstName: "blazej"});
        $httpBackend.flush();
    }));

});

/*
 it('should load all Users using api call and store them in the Users array', inject(function (Hyphen) {
 var users = [user, user2, user3];
 $httpBackend.expectGET("/users").respond(200, users)
 Hyphen.Users.api.getAll.call();
 $httpBackend.flush();

 expect(Hyphen.Users.dataModel.getById(1)._id).toBe(1);
 expect(Hyphen.Users.dataModel.getById(2).user_first_name).toBe("Mike");
 expect(Hyphen.Users.dataModel.getData().length).toBe(users.length);
 }));


 it("should api method return promise", function (done) { inject(function (Hyphen) {
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
 Hyphen.Users.api.getOne.call([1]);
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
 Hyphen.Users.api.delete.call([1]);
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

 */