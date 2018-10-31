jsHyphen.factory("HyphenAPI", ['ApiCallFactory', '$injector', '$q', function (ApiCallFactory, $injector, $q) {
    // Seems to act like APIService + BaseClassFactory
    var HyphenAPI = function (Hyphen, modelConfiguration, globalConfiguration) {
        this.hyphen = Hyphen;
        this.loading = 0;
        this.modelConfiguration = modelConfiguration;
        this.globalConfiguration = globalConfiguration;
        var hyphenApi = this;

        _(modelConfiguration.rest).each(function (apiCallConfiguration) {
            var self = this;
            var apiCallFactory = new ApiCallFactory(apiCallConfiguration, globalConfiguration, modelConfiguration.name);

            this[apiCallConfiguration.name] = function (params, data) {
                var actionPromise = $q.defer();

                actionPromise.promise.save = function (model, property) {
                    actionPromise.promise.then(function (response) {
                        if (!model) {
                            model = hyphenApi.modelConfiguration.model;
                        }

                        var data = response.data;
                        if (property) {
                            data = response.data[property];
                        }
                        Hyphen[hyphenApi.modelConfiguration.name].provider.addData(data, model);
                    })

                    return actionPromise.promise;
                };

                actionPromise.promise.delete = function (model, property) {
                    actionPromise.promise.then(function (response) {
                        if (!model) {
                            model = hyphenApi.modelConfiguration.model;
                        }

                        var data = response.data;
                        if (property) {
                            data = response.data[property];
                        }

                        Hyphen[hyphenApi.modelConfiguration.name].provider.deleteData(data, model);
                    });

                    return actionPromise.promise;
                };

                var promise = apiCallFactory.getApiCall(params, data);

                self[apiCallConfiguration.name].loading++;
                self.loading++;
                self[apiCallConfiguration.name].loaded = false;

                promise.then(function (response) {
                    self[apiCallConfiguration.name].loading--;
                    self.loading--;
                    self[apiCallConfiguration.name].loaded = true;
                    actionPromise.resolve(response);
                }, function (reason) {
                    self.loading--;
                    self[apiCallConfiguration.name].loading--;
                    actionPromise.reject(reason);
                }, function (event) {
                    actionPromise.notify(event);
                });

                return actionPromise.promise;
            };

            self[apiCallConfiguration.name].loading = 0;
        }, this);
    };

    return HyphenAPI;
}]);