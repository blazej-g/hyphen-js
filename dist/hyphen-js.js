/**
 * Hyphen Js - generic Angular App data layer
 * @version v0.0.95 - 2016-01-11 * @link 
 * @author Blazej Grzelinski
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */var jsHyphen = angular.module('jsHyphen', []);

(function () {

    //var publicApi = {};
    //jsHyphen.value('jsHyphen', publicApi);

    jsHyphen.provider("Hyphen", [function () {
        var provider = {};
        provider.initialize = function () {

        }
        provider.$get = ['$http', '$q', 'HyphenIndexDb', 'BasicModel', 'HyphenIndexDb', '$injector', '$timeout', 'CacheService', function ($http, $q, HyphenIndexDb, BasicModel, HyphenIndexDb, $injector, $timeout, CacheService) {
            var service = {};
            var enqueuedActionsList = [];
            var hyphenConfiguration;
            var hyphenIndexDb;
            var stores = [];
            var syncStart, syncEnd;

            service.syncStartEvent = function (fun) {
                syncStart = fun;
            };
            service.syncEndEvent = function (fun) {
                syncEnd = fun;
            }

            service.initialize = function (configuration) {
                var self = this;
                this.configuration = configuration;
                hyphenConfiguration = configuration;

                configuration.model.forEach(function (entity) {
                    service[entity.model] = new BasicModel(entity, configuration);
                    stores.push({name: entity.model, key: entity.key, priority: entity.priority, sync: entity.sync});
                });
            };

            service.dispose = function () {
                CacheService.clearCache();
                HyphenIndexDb.closeDb();
            };

            service.initializeDb = function (identifier) {
                if (!identifier)
                    throw new Error("Db identifier not provided for initializeDb function")
                if (!HyphenIndexDb.isInitialized()) {
                    var dbName = this.configuration.dbName + identifier;
                    hyphenIndexDb = new HyphenIndexDb(dbName, this.configuration.dbVersion, stores, identifier);
                    HyphenIndexDb.upgradeEvent(function (event) {
                        _(stores).each(function (st) {
                            if (!_(event.target.transaction.db.objectStoreNames).contains(st.name)) {
                                HyphenIndexDb.createStore(st.name, st.key);
                            } else {
                                console.log("Store " + st + "already exist and will be not created again");
                            }
                        })
                    });

                    HyphenIndexDb.openEvent(function (event) {

                        var prom = readFromIndexDb(stores);
                        prom.then(function (data) {
                            _(stores).each(function (store) {
                                HyphenIndexDb.clear(store.name);
                            });

                            HyphenIndexDb.initialized = true;
                            loadData();
                            console.log("Load data and start app");
                        }, function (reason) {
                            //clear stores even when sync fail
                            _(stores).each(function (store) {
                                HyphenIndexDb.clear(store.name);
                            });
                            console.log(reason);
                        });

                    });
                } else {
                    console.log("db already initialized");
                }
            }

            window.addEventListener('online', function () {
                if (hyphenIndexDb) {
                    $timeout(function () {
                        var prom = readFromIndexDb(stores);
                        prom.then(function (data) {
                            _(stores).each(function (store) {
                                HyphenIndexDb.clear(store.name);
                            });
                            console.log("synchronize");
                        }, function (reason) {
                            console.log(reason);
                        });
                    }, 5000);
                }
            });

            window.addEventListener('offline', function () {
                console.log("is offline");
            });

            var syncModelsPromise;
            var dataToSync = [];
            var readFromIndexDb = function (dbStores) {
                syncModelsPromise = $q.defer();
                var readPromises = [];
                _(dbStores).each(function (store) {
                    var indexReadPromise = HyphenIndexDb.getStoreData(store.name, store.priority, store.sync);
                    readPromises.push(indexReadPromise);
                });

                $q.all(readPromises).then(function (result) {
                    var syncQue = [];
                    dataToSync = [];
                    _(result).each(function (dbData) {
                        var entityModel;
                        try {
                            entityModel = $injector.get(dbData.model);
                        } catch (e) {
                            entityModel = $injector.get('DefaultModel');
                        }

                        if (!entityModel.syncNew)
                            throw Error("Not defined synchronise method for 'syncNew' for model " + dbData.model);

                        if (!entityModel.syncUpdated)
                            throw Error("Not defined synchronise method for 'syncUpdated' for model " + dbData.model);

                        if (!entityModel.syncDeleted)
                            throw Error("Not defined synchronise method for 'syncDeleted' for model " + dbData.model);

                        var newData = [];
                        var updateData = [];
                        var deleteData = [];

                        _(dbData.data).each(function (record) {
                            dataToSync.push(record);
                            if (syncStart)
                                syncStart();
                            if (record.action == "new") {
                                newData.push(record);
                            }
                            if (record.action == "updated") {
                                updateData.push(record);
                            }

                            if (record.action == "deleted") {
                                deleteData.push(record);
                            }
                        });
                        if (dbData.sync) {
                            syncQue.push({
                                name: dbData.model,
                                syncNew: entityModel.syncNew,
                                syncUpdated: entityModel.syncUpdated,
                                syncDeleted: entityModel.syncDeleted,
                                newData: newData,
                                updateData: updateData,
                                deleteData: deleteData,
                                priority: dbData.priority
                            });
                        }
                    });

                    if (dataToSync.length > 0) {
                        syncQue = _(syncQue).sortBy(function (d) {
                            return d.priority;
                        });
                        promiseQueChain(syncQue);
                    }
                    else {
                        if (syncEnd)
                            syncEnd(dataToSync);
                        syncModelsPromise.resolve(dataToSync);
                    }

                }, function (r) {
                    console.log("cannot read from db");
                });

                return syncModelsPromise.promise;
            }

            var promiseQueChain = function (promisesList) {
                var item = promisesList[0];
                if (item) {
                    var syncNewPromise = item.syncNew(item.newData);
                    var syncUpdatedPromise = item.syncUpdated(item.updateData);
                    var syncDeleted = item.syncDeleted(item.deleteData);

                    $q.all([syncNewPromise, syncUpdatedPromise, syncDeleted]).then(function () {
                        //clear synced store
                        //HyphenIndexDb.clear(item.name);
                        promisesList.shift();
                        promiseQueChain(promisesList);
                    }, function (reason) {
                        syncEnd(reason);
                        syncModelsPromise.reject(reason);
                    })
                } else {
                    if (syncEnd)
                        syncEnd(dataToSync);
                    syncModelsPromise.resolve(dataToSync);
                }
            }

            var loadData = function () {
                _(enqueuedActionsList).each(function (data) {
                    var method = data.method;
                    var params = data.params;
                    method.data = data.data;
                    method.call(params).then(function (data) {
                        self.defer.resolve(data);
                    }, function (reason) {
                        self.defer.reject(reason);
                    });
                });
            }

            service.enqueue = function (enqueueList) {
                if (navigator.onLine) {
                    enqueuedActionsList = enqueueList;
                    self.defer = $q.defer();
                    if (HyphenIndexDb.initialized)
                        loadData();
                } else {
                    console.error("app is offline");
                    self.defer.resolve("app is offline");
                }
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

        HyphenDataStore.prototype.stores = {}
        HyphenDataStore.actions = {};

        HyphenDataStore.actions.delete = function (data, store, options) {
            HyphenDataStore.prototype.stores[store].removeDataOnline(data);
        }

        HyphenDataStore.actions.save = function (data, store, options) {
            HyphenDataStore.prototype.stores[store].addData(data);
        }

        HyphenDataStore.actions.custom = function (data, store, options) {
            options.responseHandler(data, HyphenDataStore.actions);
        }

        HyphenDataStore.saveResult = function (data, store, options) {
            if (options.processResponse != false) {
                if (options.responseHandler) {
                    options.responseHandler(data, HyphenDataStore.prototype.stores);

                } else {
                    if (options.method == "delete" || options.action == "delete") {
                        HyphenDataStore.prototype.stores[store].remove(data);
                    }
                    else {
                        HyphenDataStore.prototype.stores[store].add(data);
                    }
                }
            }
        }

        HyphenDataStore.getStores = function () {
            return HyphenDataStore.prototype.stores;
        }

        HyphenDataStore.clearStores = function () {
            _(HyphenDataStore.prototype.stores).each(function (st) {
                st.data = [];
            });
        }

        return HyphenDataStore;
    }]);

    jsHyphen.factory('DefaultModel', ['$q', '$timeout', function ($q, $timeout) {
        var DefaultModel = function (data) {
        }

        DefaultModel.key = "_id";
        DefaultModel.indexes = [{name: "Id", key: "id"}, {name: "_Id", key: "_id"}];

        DefaultModel.synchronize = function () {
            var def = $q.defer();
            $timeout(function () {
                def.resolve("data resolvedd");
            }, 100);

            return def.promise;
        }

        return DefaultModel;

    }]);

    jsHyphen.factory("BasicModel", ['ApiCallFactory', 'HyphenDataStore', '$injector', 'HyphenSynchronizer', '$q', 'CacheService', function (ApiCallFactory, HyphenDataStore, $injector, HyphenSynchronizer, $q, CacheService) {
        var promises = [];
        var BasicModel = function (modelData, configuration) {
            this.entityModel = null;
            try {
                this.entityModel = $injector.get(modelData.model);
            } catch (e) {
                this.entityModel = $injector.get('DefaultModel');
            }
            var dataStore = new HyphenDataStore(modelData.model, this.entityModel);

            //entities public properties
            this.dataModel = dataStore.stores[modelData.model];
            this.api = {};

            var apiCallFactory = new ApiCallFactory();
            var promises = [];
            _(modelData.rest).each(function (rest) {
                var self = this;
                var apiCall = apiCallFactory.createApiCall(rest, configuration, modelData.model);
                this.api[rest.name] = {};
                self.api[rest.name].loading = false;

                this.api[rest.name].call = function (params) {
                    //initialize promise for every call!!!
                    var actionPromise = $q.defer();

                    var args = Array.prototype.slice.call(arguments);
                    var cacheItem = rest.name + modelData.model + args.join("");

                    if (navigator.onLine) {
                        if (!CacheService.isCached(cacheItem)) {
                            apiCall.dataSet = self.api[rest.name].data;
                            var promise = apiCall.invoke.call(apiCall, params);
                            self.api[rest.name].loading = true;
                            promise.then(function (result) {
                                self.api[rest.name].loading = false;
                                HyphenDataStore.saveResult(result.data, modelData.model, rest);
                                actionPromise.resolve(result);
                            }, function (reason) {
                                self.api[rest.name].loading = false;
                                actionPromise.reject(reason);
                            });
                        } else {
                            actionPromise.resolve([]);
                        }
                    } else {
                        if (self.entityModel[rest.name + "Offline"]) {
                            try {
                                self.entityModel[rest.name + "Offline"](params, self.api[rest.name].data, HyphenDataStore.prototype.stores);
                                actionPromise.resolve(self.api[rest.name].data);
                            } catch (error) {
                                console.warn(error);
                                actionPromise.reject("can not save data in offline" + error);
                            }

                        } else {
                            var message = "No offline method: " + modelData.model + "." + rest.name + "Offline";
                            console.warn(message)
                            throw new Error(message);
                        }
                    }

                    //if the method is defined as callOnce, call method only first time and return empty arry every next time
                    if (rest.cache && rest.method != "get")
                        throw new Error("Cache option can be switch on only for get parameters");

                    if (rest.cache && rest.method == "get" && !CacheService.isCached(cacheItem)) {
                        CacheService.addUrl(cacheItem);
                    }

                    promises.push(promise);
                    $q.all(promises);

                    return actionPromise.promise;
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

    jsHyphen.factory("CacheService", ['HyphenDataStore', function (HyphenDataStore) {
        var urls = [];
        this.addUrl = function (url) {
            urls.push(url);
        }

        this.isCached = function (url) {
            var u = _(urls).filter(function (data) {
                return data == url;
            });

            return u.length > 0 ? true : false;
        }

        this.clearCache = function () {
            HyphenDataStore.clearStores();
            urls = [];
        }

        return this;
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
jsHyphen.factory("IndexedDbCommandBase", ['$q', function () {
    var IndexedDbCommandBase = function (name, version) {
        var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
        var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
        var selfObj = this;
        var request = window.indexedDB.open(name, version);

        request.onsuccess = function (event) {
            selfObj.db = event.target.result;
            selfObj.stores = event.target.result.objectStoreNames;
            if (selfObj.openEvent)
                selfObj.openEvent(event);
            console.log("Local db initialized");

        }
        request.onerror = function (event) {
            console.log(event);
        };
        request.onupgradeneeded = function (event) {
            selfObj.db = event.target.result;
            if (selfObj.upgradeEvent)
                selfObj.upgradeEvent(event);
        };

        request.oncomplete = function (event) {
            console.log(event);
        }

    }

    IndexedDbCommandBase.prototype.isInitialized = function (request) {
        return this.db ? true : false;
    }

    IndexedDbCommandBase.prototype.registerPromise = function (request) {
        var promise = new Promise(function (resolve, reject) {
            request.onsuccess = function (event) {
                resolve({data: event});
            }
            request.onerror = function (event) {
                reject(event);
            };
            request.onupgradeneeded = function (event) {
                resolve({data: event});
            }
            request.oncomplete = function (event) {
                resolve({data: event});
            }
        });
        return promise;

    }

    return IndexedDbCommandBase;
}]);

jsHyphen.factory("IndexedDbCommands", ['$q', 'IndexedDbCommandBase', function ($q, IndexedDbCommandBase) {
    var IndexedDbCommands = function (name, version, stores) {
        IndexedDbCommandBase.call(this, name, version);
    }

    IndexedDbCommands.prototype = Object.create(IndexedDbCommandBase.prototype);

    IndexedDbCommands.prototype.openDataBase = function (version) {

    }

    IndexedDbCommands.prototype.closeDb = function () {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }

    IndexedDbCommands.prototype.clearStores = function (stores, realStores) {
        var self = this;
        var promise;
        var request;
        if (realStores.length > 0) {

            Object.keys(stores).forEach(function (prop) {
                request = self.db.deleteObjectStore(stores[prop].name);
            });

            promise = new Promise(function (resolve, reject) {
                request.onsuccess = function (event) {
                    resolve({data: event});
                }
                request.onerror = function (event) {
                    reject(event);
                };
                request.onupgradeneeded = function (event) {
                    resolve({data: event});
                }
                request.oncomplete = function (event) {
                    resolve({data: event});
                }
            });

        } else {
            promise = new Promise(function (resolve, reject) {
                resolve();
            });
        }

        return promise;
    }

    IndexedDbCommands.prototype.createStore = function (store, key) {
        var request = this.db.createObjectStore(store, {
            autoIncrement: false,
            keyPath: key
        });

        return request;
    }

    IndexedDbCommands.prototype.clear = function (store) {
        var transaction = this.db.transaction(store, "readwrite");
        var storeObject = transaction.objectStore(store)
        var request = storeObject.clear();
        return this.registerPromise(request);
    }

    IndexedDbCommands.prototype.clearSynchronized = function (store) {
        var transaction = this.db.transaction(store, "readwrite");
        var dbStore = transaction.objectStore(store);
        var request = dbStore.openCursor();
        var deferred = $q.defer();
        request.onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                if (cursor.value.action) {
                    dbStore.delete(cursor.value);
                }
                cursor.continue();
            } else {
            }
        }
    }

    IndexedDbCommands.prototype.createStores = function (stores) {
        var promise;
        var request;
        for (var prop in stores) {
            request = this.db.createObjectStore(stores[prop].name, {
                autoIncrement: false,
                keyPath: stores[prop].key
            });
        }

        promise = new Promise(function (resolve, reject) {
            request.onsuccess = function (event) {
                resolve({data: event});
            }
            request.onerror = function (event) {
                reject(event);
            };
            request.onupgradeneeded = function (event) {
                resolve({data: event});
            }
            request.oncomplete = function (event) {
                resolve({data: event});
            }
        });

        return promise;
    }

    IndexedDbCommands.prototype.addRecord = function (data, store) {
        var transaction = this.db.transaction(store, "readwrite");
        var storeObject = transaction.objectStore(store);
        storeObject.add(data);
    }

    IndexedDbCommands.prototype.addOrUpdateRecord = function (record, store, id) {
        var self = this;
        var transaction = this.db.transaction(store, "readwrite");
        var storeObject = transaction.objectStore(store);
        var request = storeObject.get(id);
        request.onerror = function (event) {
            console.log('can not retrive record ' + record);
        };
        request.onsuccess = function (event) {
            // Do something with the request.result!
            if (request.result) {
                self.updateRecord(record, store, id);
            } else {
                self.addRecord(record, store);
            }
        };
    }

    IndexedDbCommands.prototype.updateRecord = function (data, store, id) {
        var objectStore = this.db.transaction(store, "readwrite").objectStore(store);
        var request = objectStore.get(id);
        request.onsuccess = function (event) {
            var requestUpdate = objectStore.put(data);
        };
    }

    IndexedDbCommands.prototype.deleteRecord = function (store, id) {
        var objectStore = this.db.transaction(store, "readwrite").objectStore(store);
        var request = objectStore.delete(id);
        request.onsuccess = function (event) {
            // var requestUpdate = objectStore.put(data);
        };
    }

    IndexedDbCommands.prototype.removeData = function () {

    }

    IndexedDbCommands.prototype.getStoreData = function (store, priority, sync) {
        var transaction = this.db.transaction(store, "readwrite");
        var dbStore = transaction.objectStore(store);
        var request = dbStore.openCursor();
        var data = [];
        var deferred = $q.defer();
        request.onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                data.push(cursor.value);
                cursor.continue();
            } else {
                deferred.resolve({model: store, data: data, priority: priority, sync: sync});
            }
        }
        request.onerror = function (event) {
            deferred.resolve(event);
        };
        return deferred.promise;
    }

    return IndexedDbCommands;
}])
;

jsHyphen.factory("HyphenIndexDb", ['IndexedDbCommands', function (IndexedDbCommands) {

    var indexedDb;
    var HyphenIndexDb = function (name, version, stores) {
        indexedDb = new IndexedDbCommands(name, version, stores);
    };

    HyphenIndexDb.openDb = function (version) {
        return indexedDb.openDataBase(version);
    }

    HyphenIndexDb.clearStores = function (stores, realStores) {
        return indexedDb.clearStores(stores, realStores);
    }

    HyphenIndexDb.getStoreData = function (store, priority, sync) {
        return indexedDb.getStoreData(store, priority, sync);
    }

    HyphenIndexDb.createStores = function (stores) {
        return indexedDb.createStores(stores);
    }

    HyphenIndexDb.close = function () {
        return indexedDb.closeDb();
    }

    HyphenIndexDb.addRecordToStore = function (data, store) {
        return indexedDb.addRecord(data, store);
    }
    HyphenIndexDb.updateRecordStore = function (data, store, id) {
        return indexedDb.updateRecord(data, store, id);
    }
    HyphenIndexDb.deleteRecord = function (store, id) {
        return indexedDb.deleteRecord(store, id);
    }

    HyphenIndexDb.upgradeEvent = function (method) {
        return indexedDb.upgradeEvent = method;
    }

    HyphenIndexDb.openEvent = function (method) {
        return indexedDb.openEvent = method;
    }

    HyphenIndexDb.createStore = function (store, key) {
        return indexedDb.createStore(store, key);
    }
    HyphenIndexDb.clear = function (store) {
        return indexedDb.clear(store);
    }
    HyphenIndexDb.getStores = function () {
        return indexedDb.stores;
    }
    HyphenIndexDb.clearSynchronized = function (store) {
        return indexedDb.clearSynchronized(store);
    }
    HyphenIndexDb.addOrUpdateRecord = function (record, store, id) {
        return indexedDb.addOrUpdateRecord(record, store, id);
    }
    HyphenIndexDb.isInitialized = function () {
        if (indexedDb)
            return indexedDb.isInitialized();
        else
            false;
    }
    HyphenIndexDb.closeDb = function () {
        if (indexedDb)
            indexedDb.closeDb();
    }

    return HyphenIndexDb;
}]);
jsHyphen.factory("HyphenDataModel", ['HyphenIndexDb', function (HyphenIndexDb) {
    var HyphenDataModel = function (model, name) {
        this.model = model;
        this.modelName = name;
        this.data = [];
        var self = this;
        _(model.indexes).each(function (index) {
            self["getBy" + index.name] = function (id) {
                if (!self["index" + index.name])
                    self["index" + index.name] = _(self.getData()).indexBy(function (data) {
                        return data[index.key];
                    });

                return self["index" + index.name][id];
            }
        });
    };

    HyphenDataModel.prototype.data = [];

    var clearIndexes = function () {
        var self = this;
        _(this.model.indexes).each(function (index) {
            self["index" + index.name] = null;
        });
    };

    HyphenDataModel.prototype.getData = function () {
        return _(this.data).filter(function (el) {
            return el.action != "deleted";
        })
    }

    HyphenDataModel.prototype.where = function (condition) {
        return _(this.data).filter(function (el) {
            return el[condition.prop] == condition.value;
        })
    }

    HyphenDataModel.prototype.remove = function (data) {
        var self = this;
        var key = this.model.key;
        var data = Array.isArray(data) ? data : [data];
        _(data).each(function (record) {
            if (navigator.onLine) {
                //HyphenIndexDb.deleteRecord(self.modelName, record[key]);
                var id = (record && record[key]) ? record[key] : record;
                this.data = _(this.data).filter(function (element) {
                    return element[key] != id;
                });
            } else {
                if (record.action == "new") {
                    HyphenIndexDb.deleteRecord(self.modelName, record[key]);
                }
                else {
                    record.action = "deleted";
                    HyphenIndexDb.addOrUpdateRecord(record, self.modelName, record[key]);
                }

                var id = (record && record[key]) ? record[key] : record;
                this.data = _(this.data).filter(function (element) {
                    return element[key] != id;
                });

            }
        }, this);

        clearIndexes.call(this);

    };

    HyphenDataModel.prototype.add = function (data) {
        var self = this;
        data = JSON.parse(JSON.stringify(data));
        var key = this.model.key;
        var data = Array.isArray(data) ? data : [data];

        _(data).each(function (record) {
            var index;
            if (!record[key])
                throw new Error("Key is not defined for '" + self.modelName + "', record cannot be added. Record" + record);

            var existEl = _(self.data).find(function (el, ind) {
                index = ind;
                return el[key] == record[key];
            });

            if (existEl) {
                if (!navigator.onLine)
                    if (record.action != "new")
                        record.action = "updated";
                self.data[index] = _.extend(new self.model(record), record);
                ;

                if (!navigator.onLine) {
                    HyphenIndexDb.updateRecordStore(record, self.modelName, record[key]);
                }
            } else {
                if (!navigator.onLine)
                    record.action = "new";

                record = _.extend(new self.model(record), record);
                self.data.push(record);
                if (!navigator.onLine) {
                    HyphenIndexDb.addRecordToStore(record, self.modelName);
                }
            }
        });

        clearIndexes.call(this);
    };

    return HyphenDataModel;
}]);
/**
 * Created by blazejgrzelinski on 25/11/15.
 */
jsHyphen.factory("HyphenCallBase", ['$http', function ($http) {
    var HyphenCallBase = function (httpOptions, hyphenConfiguration) {
        this.httpOptions = httpOptions;
        this.hyphenConfiguration = hyphenConfiguration;
        this.$http = $http;
        this.config = {};
    }

    HyphenCallBase.prototype.urlParser = function (url, params) {
        var params = Array.isArray(params) ? params : [params];
        var segments = url.split("/");
        var paramCounter = 0;
        _(segments).each(function (seg, index) {
            if (seg.indexOf(":") != -1) {
                segments[index] = params[paramCounter];
                paramCounter++;
            }
        });

        return segments.join("/");
    };

    var strEndsWith = function(str, suffix) {
        return str.match(suffix+"$")==suffix;
    }

    HyphenCallBase.prototype.invoke = function (params) {
        if(strEndsWith(this.hyphenConfiguration.baseUrl, "/"))
            this.hyphenConfiguration.baseUrl = this.hyphenConfiguration.baseUrl.substring(0, this.hyphenConfiguration.baseUrl.length-1);
        this.config.url = this.hyphenConfiguration.baseUrl + "/" + this.urlParser(this.httpOptions.url, params);
        this.config.data = this.dataSet;
        if (this.hyphenConfiguration.requestInterceptor)
            this.config = this.hyphenConfiguration.requestInterceptor(this.config);

        return this.$http(this.config);
    }

    return HyphenCallBase;

}]);

jsHyphen.factory("HyphenGet", ['HyphenCallBase', function (HyphenCallBase) {
    var HyphenGet = function (httpOptions, hyphenConfiguration) {
        HyphenCallBase.call(this, httpOptions, hyphenConfiguration);
        this.config.method = "GET";
    }
    HyphenGet.prototype = Object.create(HyphenCallBase.prototype);

    return HyphenGet;

}]);

jsHyphen.factory("HyphenPost", ['HyphenCallBase', function (HyphenCallBase) {
    var HyphenPost = function (httpOptions, hyphenConfiguration) {
        HyphenCallBase.call(this, httpOptions, hyphenConfiguration);
        this.config.method = "POST";
    }

    HyphenPost.prototype = Object.create(HyphenCallBase.prototype);

    HyphenPost.prototype.dataSet = null;

    return HyphenPost;
}]);

jsHyphen.factory("HyphenPut", ['HyphenCallBase', function (HyphenCallBase) {
    var HyphenPut = function (httpOptions, hyphenConfiguration) {
        HyphenCallBase.call(this, httpOptions, hyphenConfiguration);
        this.httpOptions = httpOptions;
        this.config.method = "PUT";
    }

    HyphenPut.prototype = Object.create(HyphenCallBase.prototype);

    HyphenPut.prototype.dataSet = null;

    return HyphenPut;
}]);

jsHyphen.factory("HyphenDelete", ['HyphenCallBase', function (HyphenCallBase) {
    var HyphenDelete = function (httpOptions, hyphenConfiguration) {
        HyphenCallBase.call(this, httpOptions, hyphenConfiguration);
        this.httpOptions = httpOptions;
        this.config.method = "DELETE";
    }

    HyphenDelete.prototype = Object.create(HyphenCallBase.prototype);

    return HyphenDelete;
}]);
/**
 * Created by blazejgrzelinski on 06/12/15.
 */
jsHyphen.factory("HyphenSynchronizer", ['HyphenIndexDb', 'HyphenDataStore', function (HyphenIndexDb, HyphenDataStore) {
    var HyphenSynchronizer = {};


    HyphenSynchronizer.checkIndexDb = function(){
        var stores = HyphenDataStore.getStores();
        _(stores).each(function(store){
            HyphenIndexDb.getStoreData(store);
        });
    };

    return HyphenSynchronizer;
}]);