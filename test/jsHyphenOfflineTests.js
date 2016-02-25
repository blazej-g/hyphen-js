describe("Hyphen JS", function () {

    beforeEach(module('jsHyphen', function (HyphenProvider) {

    }));

    //beforeEach(function (done) {
    beforeEach(inject(function ($injector, Hyphen, _$rootScope_) {
        Hyphen.initialize(configuration);
        Hyphen.initializeDb(1);
        $httpBackend = $injector.get('$httpBackend');
        $rootScope = _$rootScope_;
        spyOn($rootScope, '$broadcast');
    }));


    it('should switch Hyphen to offline mode', inject(function (Hyphen) {
        Hyphen.switchToOffline();
        var state = Hyphen.getState();
        expect(state).toBe(false);
    }));

    it('should switch Hyphen to online mode', inject(function (Hyphen) {
        Hyphen.switchToOnline();
        var state = Hyphen.getState();
        expect(state).toBe(true);
    }));

    it('should switch Hyphen to offline and then to online mode', inject(function (Hyphen) {
        Hyphen.switchToOffline();
        Hyphen.switchToOnline();
        var state = Hyphen.getState();
        expect(state).toBe(true);
    }));


    it('should switch Hyphen to offline and then to online mode', inject(function (Hyphen) {
        Hyphen.switchToOffline();
        expect($rootScope.$broadcast).toHaveBeenCalledWith('hyphenOffline');
    }));

    it('should switch Hyphen to offline and then to online mode', inject(function (Hyphen) {
        Hyphen.switchToOnline();
        expect($rootScope.$broadcast).toHaveBeenCalledWith('hyphenOnline');
    }));


    it("should create new user in offline mode", function (done) {
        inject(function (Hyphen) {
            Hyphen.switchToOffline();
            setTimeout(function () {
                Hyphen.Users.api.create.data = {user_first_name: "blazej"};
                Hyphen.Users.api.create.call();
                expect(Hyphen.Users.dataModel.getData().length).toBe(1);
                done();
            }, 100);
        })
    }, 200);


    it("should create two new user in offline mode", function (done) {
        inject(function (Hyphen) {
            Hyphen.switchToOffline();
            setTimeout(function () {
                Hyphen.Users.api.create.data = {user_first_name: "blazej"};
                Hyphen.Users.api.create.call();
                Hyphen.Users.api.create.data = {user_first_name: "blazej"};
                Hyphen.Users.api.create.call();
                expect(Hyphen.Users.dataModel.getData().length).toBe(2);
                done();
            }, 100);
        })
    }, 200);


    it("should create two new user in offline mode", function (done) {
        inject(function (Hyphen) {
            Hyphen.switchToOffline();
            setTimeout(function () {
                Hyphen.Users.api.create.data = {user_first_name: "blazej"};
                Hyphen.Users.api.create.call();
                Hyphen.Users.api.create.data = {user_first_name: "marta"};
                Hyphen.Users.api.create.call();
                Hyphen.Users.api.create.data = {user_first_name: "tymon"};
                Hyphen.Users.api.create.call();
                Hyphen.Users.api.create.data = {user_first_name: "tomek"};
                Hyphen.Users.api.create.call();
                expect(Hyphen.Users.dataModel.getData().length).toBe(4);
                done();
            }, 100);
        })
    }, 200);

    it("should delete user with name 'blazej'", function (done) {
        inject(function (Hyphen) {
            Hyphen.switchToOffline();
            setTimeout(function () {
                Hyphen.Users.api.create.data = {user_first_name: "blazej"};
                Hyphen.Users.api.create.call();
                Hyphen.Users.api.create.data = {user_first_name: "marta"};
                Hyphen.Users.api.create.call();
                Hyphen.Users.api.create.data = {user_first_name: "tymon"};
                Hyphen.Users.api.create.call();
                Hyphen.Users.api.create.data = {user_first_name: "tomek"};
                Hyphen.Users.api.create.call();

                var blazej = Hyphen.Users.dataModel.getByFirstName("blazej");
                Hyphen.Users.api.delete.call({id: blazej._id});
                expect(Hyphen.Users.dataModel.getData().length).toBe(3);
                done();
            }, 100);
        })
    }, 200);


    it("should update user with name 'blazej' to new name 'gerard", function (done) {
        inject(function (Hyphen) {
            Hyphen.switchToOffline();
            setTimeout(function () {
                Hyphen.Users.api.create.data = {user_first_name: "blazej"};
                Hyphen.Users.api.create.call();
                Hyphen.Users.api.create.data = {user_first_name: "blazej"};
                Hyphen.Users.api.create.call();
                Hyphen.Users.api.create.data = {user_first_name: "blazej"};
                Hyphen.Users.api.create.call();
                Hyphen.Users.api.create.data = {user_first_name: "blazej"};
                var blazej = Hyphen.Users.dataModel.getByFirstName("blazej");
                blazej.user_first_name="gerard";
                Hyphen.Users.api.update.data = blazej;
                Hyphen.Users.api.update.call();
                expect(Hyphen.Users.dataModel.getByFirstName("gerard").user_first_name).toBe("gerard");
                done();
            }, 100);
        })
    }, 200);


    /*

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
    */


});