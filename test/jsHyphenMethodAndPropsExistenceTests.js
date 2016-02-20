describe("Hyphen JS", function () {

    beforeEach(module('jsHyphen', function (HyphenProvider) {

    }));

    //beforeEach(function (done) {
    beforeEach(inject(function ($injector, Hyphen) {
        Hyphen.initialize(configuration);
        $httpBackend = $injector.get('$httpBackend');
    }));


    //users
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

    it('should be defined Users index "Id"', inject(function (Hyphen) {
        expect(Hyphen.Users.dataModel.getById).toBeDefined();
    }));

    it('should be defined Users index "Id"', inject(function (Hyphen) {
        expect(Hyphen.Users.dataModel.getByFirstName).toBeDefined();
    }));

    it('should be false loading property on Users entity', inject(function (Hyphen) {
        expect(Hyphen.Users.dataModel.loading).toBeFalsy();
    }));

    it('should define method like getGroupByMemberId', inject(function (Hyphen) {
        expect(Hyphen.Users.dataModel.getGroupByMemberId).toBeDefined();
    }));


    //project tests
    it('should have defined "Projects" entity', inject(function (Hyphen) {
        expect(Hyphen.Projects).toBeDefined();
    }));

    it('should have defined "Projects" api object', inject(function (Hyphen) {
        expect(Hyphen.Projects.api).toBeDefined();
    }));

    it('should have defined "Projects" dataModel', inject(function (Hyphen) {
        expect(Hyphen.Projects.dataModel).toBeDefined();
    }));

    it('should be false "loading" property on Projects entity', inject(function (Hyphen) {
        expect(Hyphen.Projects.dataModel.loading).toBeFalsy();
    }));

    it('should have defined "create" method on "Projects" entity', inject(function (Hyphen) {
        expect(Hyphen.Projects.api.create).toBeDefined();
    }));

    it('should have defined "removeAll" method on "Projects" entity', inject(function (Hyphen) {
        expect(Hyphen.Projects.api.removeAll).toBeDefined();
    }));

    it('should have defined "getAll" method on "Projects" entity', inject(function (Hyphen) {
        expect(Hyphen.Projects.api.getAll).toBeDefined();
    }));

});