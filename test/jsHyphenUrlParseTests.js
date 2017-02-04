describe("Hyphen JS", function () {

    beforeEach(module('jsHyphen', function (HyphenProvider) {

    }));

    //beforeEach(function (done) {
    beforeEach(inject(function ($injector, Hyphen) {
        Hyphen.initialize(configuration);
        $httpBackend = $injector.get('$httpBackend');
    }));

    it('should load single user using api call', inject(function (Hyphen) {
        $httpBackend.expectGET("/users/1").respond(200, user);
        Hyphen.Users.api.getOne({id: 1}).save();
        $httpBackend.flush();
        expect(Hyphen.Users.provider.findOne({_id: 1})._id).toBe(1);
    }));

    it('should be able to handle two params with double dot notation', inject(function (Hyphen) {
        $httpBackend.expectGET("/users/1/project/3").respond(200, user);
        Hyphen.Users.api.getUserTwoParams({id: 1, projectId: 3});
        $httpBackend.flush();
    }));

    it('should be able to handle dot and question params', inject(function (Hyphen) {
        $httpBackend.expectGET("/users/1/project/3?age=100").respond(200, user);
        Hyphen.Users.api.getUserWithParams({userId: 1, projectId: 3, age: 100});
        $httpBackend.flush();
    }));

    it('should be able to handle complex url params', inject(function (Hyphen) {
        ///users/:id/:projectId?name=firstName&age=age
        $httpBackend.expectGET("/users/1/project/3?name=blazej&age=100").respond(200, user)
        Hyphen.Users.api.getUserComplexParams({userId: 1, projectId: 3, age: 100, firstName: "blazej"});
        $httpBackend.flush();
    }));

});
