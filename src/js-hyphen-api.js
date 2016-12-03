jsHyphen.factory("HyphenAPI", ['ApiCallFactory', '$injector', '$q', function (ApiCallFactory, $injector, $q) {
    // Seems to act like APIService + BaseClassFactory
    var HyphenAPI = function (_Hyphen, modelConfiguration, globalConfiguration, configuration) {
        this._Hyphen = _Hyphen;
        this.loading = 0;
        this.modelConfiguration = modelConfiguration;
        this.globalConfiguration = globalConfiguration;
        var selfApi = this;

        _(modelConfiguration.rest).each(function (apiCallConfiguration) {
            var self = this;
            var apiCallFactory = new ApiCallFactory(apiCallConfiguration, globalConfiguration, modelConfiguration.name);

            this[apiCallConfiguration.name] = function (params, data) {
                var actionPromise = $q.defer();
                var promise = apiCallFactory.getApiCall(params, data);

                self[apiCallConfiguration.name].loading++;
                self.loading++;
                self[apiCallConfiguration.name].loaded = false;

                var interceptor = $injector.has(modelConfiguration.name + "Interceptor") ? $injector.get(modelConfiguration.name + "Interceptor") : null;

                if (interceptor && interceptor[apiCallConfiguration.name + "Post"]) {
                    interceptor[apiCallConfiguration.name + "Post"](actionPromise.promise, modelConfiguration.name, apiCallConfiguration);
                } else if (globalConfiguration.responseInterceptor) {
                    globalConfiguration.responseInterceptor(actionPromise.promise, modelConfiguration.name, apiCallConfiguration);
                }
                else {
                    actionPromise.promise.then(function (response) {
                        self.saveResult(selfApi._Hyphen, selfApi.modelConfiguration, apiCallConfiguration, response.data);
                    });
                }

                promise.then(function (response) {
                    self[apiCallConfiguration.name].loading--;
                    self.loading--;
                    self[apiCallConfiguration.name].loaded = true;
                    actionPromise.resolve(response);
                }, function (reason) {
                    actionPromise.reject(reason);
                }, function (event) {
                    actionPromise.notify(event);
                });

                return actionPromise.promise;
            };

            self[apiCallConfiguration.name].loading = 0;
        }, this);
    };

    HyphenAPI.prototype.saveResult = function (providers, model, apiCallConfiguration, data) {
        var self = this;
        var data = Array.isArray(data) ? data : [data];
        _(data).each(function (record) {
            for (var key in model.embedObjects) {
                var embedModel = model.embedObjects[key];
                if (record[key]) {
                    var embedData = Array.isArray(record[key]) ? record[key] : [record[key]];
                    self.saveResult(providers, self.globalConfiguration.model[embedModel], apiCallConfiguration, embedData);
                    delete record[key];
                }
            }
            providers[model.name].provider[apiCallConfiguration.method](record);
        });
        self._Hyphen[self.modelConfiguration.name].provider.clearIndexes();
    };

    return HyphenAPI;
}]);