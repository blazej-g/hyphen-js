var jsHyphen = angular.module('jsHyphen', []);

(function () {

    //var publicApi = {};
    //jsHyphen.value('jsHyphen', publicApi);

    jsHyphen.provider("Hyphen", [function () {
        var provider = {};
        provider.initialize = function () {

        }
        provider.$get = ['$http', '$q', 'HyphenIndexDb', 'ModelsAbstractFactory', 'BasicModel', function ($http, $q, HyphenIndexDb, ModelsAbstractFactory, BasicModel) {
            var service = {};
            service.initialize = function (configuration) {
                configuration.model.forEach(function (entity) {
                    var modelsAbstractFactory = new ModelsAbstractFactory();
                    modelsAbstractFactory.registerModel(entity.model, BasicModel);
                    service[entity.model] = modelsAbstractFactory.getModel(entity, configuration);
                });
            };

            window.addEventListener('online', function () {
                console.log("Is online");
            });
            window.addEventListener('offline', function () {
                console.log("is offline");
            });
            return service;
        }];
        return provider;
    }]);

    jsHyphen.factory("HyphenDataStore", ['HyphenDataModel', function (HyphenDataModel) {
        var HyphenDataStore = function (store, entityModel) {
            HyphenDataStore.prototype.stores[store] = new HyphenDataModel(entityModel, store);
        }

        HyphenDataStore.prototype.stores = {};

        HyphenDataStore.saveResult = function (promise, store, restDef) {
            if (restDef.processResponse != false) {
                promise.then(function (result) {
                    if (restDef.responseHandler) {
                        restDef.responseHandler(result, HyphenDataStore.prototype.stores);

                    } else {
                        if (restDef.method == "delete" || restDef.action == "delete")
                            HyphenDataStore.prototype.stores[store].removeData(result.data);
                        else
                            HyphenDataStore.prototype.stores[store].addData(result.data);
                    }
                });
            }
        }

        return HyphenDataStore;
    }]);

    jsHyphen.factory('DefaultModel', ['Hyphen', function (Hyphen) {
        var DefaultModel = function (data) {
        }

        DefaultModel.key = "_id";
        DefaultModel.indexes = [{name: "Id", key: "id"}, {name: "_Id", key: "_id"}];
        return DefaultModel;

    }]);


    jsHyphen.factory("BasicModel", ['ApiCallFactory', 'HyphenDataStore', '$injector', function (ApiCallFactory, HyphenDataStore, $injector) {
        var BasicModel = function (modelData, configuration) {
            var entityModel = null;
            try {
                entityModel = $injector.get(modelData.model);
            } catch (e) {
                 entityModel = $injector.get('DefaultModel');
            }
            var dataStore = new HyphenDataStore(modelData.model, entityModel);

            //entities public properties
            this.dataModel = dataStore.stores[modelData.model];
            this.api = {};

            var apiCallFactory = new ApiCallFactory();
            _(modelData.rest).each(function (rest) {
                var self = this;
                var apiCall = apiCallFactory.createApiCall(rest, configuration, modelData.model);
                this.api[rest.name] = {};
                self.api[rest.name].loading = false;

                this.api[rest.name].call = function (params) {
                    apiCall.dataSet = self.api[rest.name].data;
                    var promise = apiCall.invoke.call(apiCall, params);
                    self.api[rest.name].loading = true;
                    promise.then(function () {
                        self.api[rest.name].loading = false;
                    }, function () {
                        self.api[rest.name].loading = false;
                    });

                    self.api[rest.name].promise = promise;

                    HyphenDataStore.saveResult(promise, modelData.model, rest);
                    return promise;
                };
            }, this);
        };

        return BasicModel;

    }]);

    jsHyphen.factory("ModelsAbstractFactory", [function () {
        var ModelsAbstractFactory = function () {
            this.types = {};
        }

        ModelsAbstractFactory.prototype.registerModel = function (type, model) {
            var proto = model.prototype;
            //if (proto.dataModel
            this.types[type] = model;

        }

        ModelsAbstractFactory.prototype.getModel = function (modelData, configuration) {
            var model = this.types[modelData.model];
            return model ? new model(modelData, configuration) : null;
        }

        return ModelsAbstractFactory;
    }]);

    jsHyphen.factory("ApiCallFactory", ['HyphenPost', 'HyphenGet', 'HyphenPut', 'HyphenDelete', function (HyphenPost, HyphenGet, HyphenPut, HyphenDelete) {
        var ApiCallFactory = function () {

        }
        ApiCallFactory.prototype.callType = HyphenGet;
        ApiCallFactory.prototype.createApiCall = function (options, configuration, dataModel) {

            switch (options.method) {
                case "get":
                    this.callType = HyphenGet;
                    break;
                case "post":
                    this.callType = HyphenPost;
                    break;
                case "put":
                    this.callType = HyphenPut;
                    break;
                case "delete":
                    this.callType = HyphenDelete;
                    break;
            }

            return new this.callType(options, configuration, dataModel);
        }

        return ApiCallFactory;
    }])

})
();