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

    it('should have dispose function', inject(function (Hyphen) {
        expect(Hyphen.dispose).toBeDefined(Function);
    }));

    //users
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

    it('should be defined Users "provider"', inject(function (Hyphen) {
        expect(Hyphen.Users.provider).toBeDefined();
    }));

    it('should be defined Where method"', inject(function (Hyphen) {
        expect(Hyphen.Users.provider.where).toBeDefined();
    }));

    it('should be false loading property on Users entity', inject(function (Hyphen) {
        expect(Hyphen.Users.provider.loading).toBeFalsy();
    }));

    //project tests
    it('should have defined "Projects" entity', inject(function (Hyphen) {
        expect(Hyphen.Projects).toBeDefined();
    }));

    it('should have defined "Projects" api object', inject(function (Hyphen) {
        expect(Hyphen.Projects.api).toBeDefined();
    }));

    it('should have defined "Projects" provider', inject(function (Hyphen) {
        expect(Hyphen.Projects.provider).toBeDefined();
    }));

    it('should be false "loading" property on Projects entity', inject(function (Hyphen) {
        expect(Hyphen.Projects.provider.loading).toBeFalsy();
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