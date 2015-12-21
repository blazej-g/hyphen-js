var jsHyphen = angular.module('jsHyphen', []);

(function () {

    //var publicApi = {};
    //jsHyphen.value('jsHyphen', publicApi);

    jsHyphen.provider("Hyphen", [function () {
        var provider = {};
        provider.initialize = function () {

        }
        provider.$get = ['$http', '$q', 'HyphenIndexDb', 'ModelsAbstractFactory', 'BasicModel', 'HyphenIndexDb', '$injector', function ($http, $q, HyphenIndexDb, ModelsAbstractFactory, BasicModel, HyphenIndexDb, $injector) {
            var service = {};
            var listOfenqueueList = [];
            var hyphenConfiguration;
            var hyphenIndexDb;
            var stores = [];
            service.initialize = function (configuration) {
                var self = this;
                hyphenConfiguration = configuration;

                configuration.model.forEach(function (entity) {
                    service[entity.model] = new BasicModel(entity, configuration);
                    stores.push({name: entity.model, key: entity.key});
                });

                hyphenIndexDb = new HyphenIndexDb(configuration.dbName, configuration.dbVersion, stores);
                HyphenIndexDb.upgradeEvent(function (event) {
                    _(stores).each(function (st) {
                        if (!_(event.target.transaction.db.objectStoreNames).contains(st.name)) {
                            HyphenIndexDb.createStore(st.name, st.key);
                        } else {
                            console.log("Store " + st + "already exist");
                        }
                    })
                });

                HyphenIndexDb.openEvent(function (event) {
                    var readPromises = [];
                    _(event.target.result.objectStoreNames).each(function (store) {
                        var indexReadPromise = HyphenIndexDb.getStoreData(store);
                        readPromises.push(indexReadPromise);
                    });

                    $q.all(readPromises).then(function (result) {
                        var syncQue = [];
                        _(result).each(function (dbData) {
                            var entityModel = $injector.get(dbData.model);
                            if (!entityModel.synchronize)
                                throw Error("Not defined synchronise method for model " + dbData.store);

                            syncQue.push(entityModel.synchronize(dbData.data));
                        })

                        $q.all(syncQue).then(function (result) {
                            _(event.target.result.objectStoreNames).each(function (store) {
                                HyphenIndexDb.clear(store);
                            });
                            loadData();
                            console.log("Load data and start app");
                        });
                        console.log("open");
                    });
                });

            };

            window.addEventListener('online', function () {
                var stores = HyphenIndexDb.getStores();
                var readPromises = [];
                _(stores).each(function (store) {
                    var indexReadPromise = HyphenIndexDb.getStoreData(store);
                    readPromises.push(indexReadPromise);
                });

                $q.all(readPromises).then(function (result) {
                    var syncQue = [];
                    _(result).each(function (dbData) {
                        var entityModel = $injector.get(dbData.model);
                        if (!entityModel.synchronize)
                            throw Error("Not defined synchronise method for model " + dbData.store);

                        syncQue.push(entityModel.synchronize(dbData.data));
                    });

                    $q.all(syncQue).then(function (result) {
                        console.log("Sync finished");
                    });
                    console.log("open");
                });
                console.log("Is online");
            });

            window.addEventListener('offline', function () {
                console.log("is offline");
            });

            var loadData = function () {
                _(listOfenqueueList).each(function (enqueueList) {
                    _(enqueueList).each(function (data) {
                        var method = data.method;
                        var params = data.params;
                        method.data = data.data;
                        method.call(params).then(function (data) {
                            self.defer.resolve(data);
                        }, function (reason) {
                            self.defer.reject(reason);
                        });
                    });
                })
            }

            service.enqueue = function (enqueueList) {
                self.defer = $q.defer();
                listOfenqueueList.push(enqueueList);
                return self.defer.promise;
            }

            return service;
        }];
        return provider;
    }]);

    jsHyphen.factory("HyphenDataStore", ['HyphenDataModel', function (HyphenDataModel) {
        var HyphenDataStore = function (store, entityModel) {
            HyphenDataStore.prototype.stores[store] = new HyphenDataModel(entityModel, store);
        }

        HyphenDataStore.prototype.stores = {};

        HyphenDataStore.saveResult = function (data, store, options) {
            if (options.processResponse != false) {
                if (options.responseHandler) {
                    options.responseHandler(result, HyphenDataStore.prototype.stores);

                } else {
                    if (options.method == "delete" || options.action == "delete") {
                        if (navigator.onLine && !window.hjom) {
                            HyphenDataStore.prototype.stores[store].removeDataOnline(data);
                        }
                        else {
                            HyphenDataStore.prototype.stores[store].removeDataOffline(data);
                        }
                    }
                    else {
                        HyphenDataStore.prototype.stores[store].addData(data);
                    }
                }
            }
        }

        HyphenDataStore.getStores = function () {
            return HyphenDataStore.prototype.stores;
        }

        return HyphenDataStore;
    }]);

    jsHyphen.factory('DefaultModel', [function () {
        var DefaultModel = function (data) {
        }

        DefaultModel.key = "_id";
        DefaultModel.indexes = [{name: "Id", key: "id"}, {name: "_Id", key: "_id"}];
        return DefaultModel;

    }]);

    jsHyphen.factory("BasicModel", ['ApiCallFactory', 'HyphenDataStore', '$injector', 'HyphenSynchronizer', '$q', function (ApiCallFactory, HyphenDataStore, $injector, HyphenSynchronizer, $q) {
        var promises = [];
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
            console.log(promises);
            var promises = [];
            _(modelData.rest).each(function (rest) {
                var self = this;
                var apiCall = apiCallFactory.createApiCall(rest, configuration, modelData.model);
                this.api[rest.name] = {};
                self.api[rest.name].loading = false;

                this.api[rest.name].call = function (params) {
                    apiCall.dataSet = self.api[rest.name].data;
                    var promise = apiCall.invoke.call(apiCall, params);
                    self.api[rest.name].loading = true;
                    promise.then(function (result) {
                        self.api[rest.name].loading = false;
                        HyphenDataStore.saveResult(result.data, modelData.model, rest);
                    }, function () {
                        self.api[rest.name].loading = false;
                    });

                    promises.push(promise);
                    $q.all(promises);
                    return promise;
                };
            }, this);
        };

        BasicModel.getPromises = function () {
            return promises;
        }

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