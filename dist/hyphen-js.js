/**
 * Hyphen Js - generic Angular App data layer
 * @version v0.0.6 - 2015-12-04 * @link 
 * @author Blazej Grzelinski
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */jsHyphen.factory("HyphenDataModel", function () {
    var HyphenDataModel = function (model, name, indexedDB) {
        this.modelName = name;
        this.data = [];
        this.model = model;
        var self= this;
        _(model.indexes).each(function (index) {
            self["getBy" + index.name] = function (id) {
                if (!self["index" + index.name])
                    self["index" + index.name] = _(self.data).indexBy(function (data) {
                        return data[index.key];
                    });

                return self["index" + index.name][id];
            }
        });

    };

    var clearIndexes = function () {
        var self= this;
        _(this.model.indexes).each(function (index) {
            self["index" + index.name] = null;
        });
    };

    HyphenDataModel.prototype.getData = function () {
        return this.data;
    }

    HyphenDataModel.prototype.removeData = function (data) {
        var key = this.model.key;
        var data = Array.isArray(data) ? data : [data];
        _(data).each(function (id) {
            id = (id && id[key]) ? id[key] : id;
            this.data = _(this.data).filter(function (element) {
                return element[key] != id;
            });
        }, this);
        clearIndexes.call(this);

        //this.indexedDB.removeStoreRecord(this.modelName, data);
    };

    HyphenDataModel.prototype.addData = function (data) {
        data = JSON.parse(JSON.stringify(data));
        var key = this.model.key;
        var data = Array.isArray(data) ? data : [data];
        this.data = _(data).chain().map(function (val) {
            return _.extend(new this.model(val), val);
        }, this).concat(this.data).uniq(false, function (element) {
            return element[key];
        }).value();

        clearIndexes.call(this);
    };

    return HyphenDataModel;
});
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

jsHyphen.factory("IndexedDbConcreteCommands", ['$q', function () {
    var IndexedDbConcreteCommands = function () {

    }

    IndexedDbConcreteCommands.prototype.openDataBase = function (data) {
        var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
        var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
        this.request = window.indexedDB.open(data.name, data.version);
        return registerCallbacks(this.request);
    }

    IndexedDbConcreteCommands.prototype.clearStores = function (event) {
        var db = event.target.result;
        var stores = db.objectStoreNames;
        var callBack = null;
        if (stores.length > 0) {
            Object.keys(stores).forEach(function (prop) {
                callBack = db.deleteObjectStore(stores[prop]);
            });
        }
        if (callBack)
            return registerCallbacks(callBack);
        else {
            return registerCallbacks(event, true);
        }
    }

    IndexedDbConcreteCommands.prototype.createStores = function (event, stores) {
        var db = event.target.result;
        var callBack = null;
        for (var prop in stores) {
            callBack = db.createObjectStore(stores[prop].name, {
                autoIncrement: false,
                keyPath: stores[prop].key
            });
        }
        if (callBack)
            return registerCallbacks(callBack);
        else
            return registerCallbacks(event, true);
    }

    IndexedDbConcreteCommands.prototype.addData = function (data, store) {
        var transaction = self.db.transaction(store, "readwrite");
        var store = transaction.objectStore(store);
        //     _(st.data).each(function (record) {
        // var getRequest = store.get(record[st.key]);
        // getRequest.onsuccess = function (e) {
        //   if (!getRequest.result) {
        var addRequest = registerCallbacks(store.add(data));
    }

    IndexedDbConcreteCommands.prototype.removeData = function () {

    }

    IndexedDbConcreteCommands.prototype.getDirtyData = function () {

    }

    var registerCallbacks = function (request, resolveNow) {
        var promise = new Promise(function (resolve, reject) {
            if (!resolveNow) {
                request.onsuccess = function (event) {
                    resolve({data: event});
                }
                request.onerror = function (event) {
                    console.log(event.target.error.message);
                    reject(event);
                };
                request.onupgradeneeded = function (event) {
                    resolve({data: event});
                }
                request.oncomplete = function (event) {
                    resolve({data: event});
                }
            }
        });

        if (resolveNow) {
            return Promise.resolve(request);
        }
        else {
            return promise;
        }
    }

    return new IndexedDbConcreteCommands();
}]);

//command
jsHyphen.factory("Command", [function () {
    var Command = function (execute) {
        this.execute = execute;
    }
    return Command;
}]);

jsHyphen.factory("DbCommands", ['Command', 'IndexedDbConcreteCommands', function (Command, IndexedDbConcreteCommands) {
    var DbCommands = function () {

    }

    DbCommands.prototype.OpenDbCommand = function () {
        return new Command(IndexedDbConcreteCommands.openDataBase);
        ;
    }

    DbCommands.prototype.ClearDbCommand = function () {
        return new Command(IndexedDbConcreteCommands.clearStores);
    }

    DbCommands.prototype.CreateDbCommand = function () {
        return new Command(IndexedDbConcreteCommands.createStores);
    }

    DbCommands.prototype.AddRecordDbCommand = function () {
        return new Command(IndexedDbConcreteCommands.createRecord);
    }

    return new DbCommands();
}]);

jsHyphen.factory("HyphenIndexDb", ['DbCommands', function (DbCommands) {
    var HyphenIndexDb = function (version, name, stores) {
        var openCommandObject = new DbCommands.OpenDbCommand();
        var clearCommandObject = new DbCommands.ClearDbCommand();
        var createCommandObject = new DbCommands.CreateDbCommand();
        var createRecordCommandObject = new DbCommands.AddRecordDbCommand();

        var methodStack = [];
        //methodStack.push({method: openCommandObject.execute, params: {version: version, name: name}});

        var promise = openCommandObject.execute({version: version, name: name});

        promise.then(function (result) {
            if (result.data.type == "upgradeneeded") {
                var clearPromise = clearCommandObject.execute(result.data);
                clearPromise.then(function (data) {
                    var createStores = createCommandObject.execute(data, stores);
                    createStores.then(function (result) {

                    }, function (reason) {

                    });
                }, function (reason) {

                })
            }
        }, function (reason) {
            console.log('Failed: ' + reason);
        });

        HyphenIndexDb.prototype.addObject = function () {

        }

        //HyphenIndexedDbBase.call(this, version, name);
    };

    return HyphenIndexDb;
}]);

/*
 jsHyphen.factory("HyphenIndexDb", ["HyphenIndexedDbBase", 'OpenDbCommand', function (HyphenIndexedDbBase, OpenDbCommand) {
 var HyphenIndexDb = function (version, name) {
 //var openDbCommandObject = new OpenDbCommand();

 //HyphenIndexedDbBase.call(this, version, name);
 };

 return;

 HyphenIndexDb.prototype = Object.create(HyphenIndexedDbBase.prototype);

 HyphenIndexDb.prototype.stores = {};

 HyphenIndexDb.prototype.createStore = function (name, key) {
 this.stores[name] = {"key": key, "name": name};
 };

 HyphenIndexDb.prototype.processData = function (data) {
 console.log(data);
 }
 HyphenIndexDb.prototype.addStoreRecord = function (name, data) {
 this.dbAction(name, data);


 if (!this.schemaUpgraded() && !this.dbIsDefined()) {
 this.stores[name].data = data;
 }
 else {
 var store = this.stores[name];
 store.data = data;
 this.addData(store);
 }

 };
 HyphenIndexDb.prototype.removeStoreRecord = function (name, data) {
 var store = this.stores[name];
 store.data = data;
 this.removeData(store);
 }

 HyphenIndexDb.prototype.dbOpenEvent = function () {

 }

 return HyphenIndexDb;

 }]);

 jsHyphen.factory("HyphenIndexedDbBase", ['$q', function ($q) {
 var self = null;
 var schemaUpgraded = false;
 var HyphenIndexedDbBase = function (version, name) {
 self = this;
 this.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
 this.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
 this.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

 if (this.indexedDB) {
 this.request = window.indexedDB.open(name, version);
 this.request.onerror = openDbError;
 this.request.onsuccess = openDbEvent;
 this.request.onupgradeneeded = onUpgrade;
 }
 }

 var storeTransaction = function (storeName) {
 var transaction = self.db.transaction(storeName, "readwrite");
 var store = transaction.objectStore(storeName);
 return store;
 }
 HyphenIndexedDbBase.prototype.dbAction = function (store, data) {
 return;
 var store = storeTransaction(store);
 var request = this.processData(data);
 request.onsuccess = function (e) {
 console.log("transaction completed" + e);
 };
 request.onerror = function (e) {
 console.log("transaction error" + e);
 };
 }

 HyphenIndexedDbBase.prototype.addData = function (st) {
 return;
 if (st.data) {
 var transaction = self.db.transaction(st.name, "readwrite");
 var store = transaction.objectStore(st.name);
 if (st.data) {
 _(st.data).each(function (record) {
 var getRequest = store.get(record[st.key]);
 getRequest.onsuccess = function (e) {
 if (!getRequest.result) {
 var addRequest = store.add(record);
 addRequest.onsuccess = function (e) {
 console.log("transaction completed" + e);
 };
 addRequest.onerror = function (e) {
 console.log("transaction error" + e);
 };
 } else {
 var putRequest = store.put(record);
 putRequest.onsuccess = function (e) {
 console.log("transaction completed" + e);
 };
 putRequest.onerror = function (e) {
 console.log("transaction error" + e);
 };
 }
 }
 getRequest.onerror = function (e) {
 console.log("transaction error" + e);
 };
 });
 }
 }
 }

 HyphenIndexedDbBase.prototype.removeData = function (st) {
 if (st.data) {
 var transaction = self.db.transaction(st.name, "readwrite");
 var store = transaction.objectStore(st.name);
 if (st.data) {
 _(st.data).each(function (record) {
 var removeRequest;
 if (record.newRecord)
 removeRequest = store.delete(record[st.key]);
 else
 removeRequest = store.put(record);
 removeRequest.onsuccess = function (e) {
 console.log("transaction completed" + e);
 };
 removeRequest.onerror = function (e) {
 console.log("transaction error" + e);
 };
 });
 }
 }
 }

 HyphenIndexedDbBase.prototype.getUnSyncData = function (store) {
 var transaction = self.db.transaction(store, "readwrite");
 var dbStore = transaction.objectStore(store);
 var request = dbStore.openCursor();
 var deferred = $q.defer();
 var data = [];
 request.onsuccess = function (event) {
 var cursor = event.target.result;
 if (cursor) {
 if (cursor.value.hyphenStatus) {
 data.push(cursor.value);
 }
 cursor.continue();
 }
 else {
 deferred.resolve({data: data});
 }
 }
 request.onerror = function (event) {
 deferred.reject(event);
 };
 return deferred.promise;
 }

 HyphenIndexedDbBase.prototype.getData = function (store) {
 var transaction = self.db.transaction(store, "readwrite");
 var dbStore = transaction.objectStore(store);
 var request = dbStore.openCursor();
 var deferred = $q.defer();
 var data = [];
 request.onsuccess = function (event) {
 var cursor = event.target.result;
 if (cursor) {
 if (cursor.value.hyphenStatus != "delete")
 data.push(cursor.value);
 cursor.continue();
 }
 else {
 deferred.resolve({data: data});
 }
 }
 request.onerror = function (event) {
 deferred.reject(event);
 };
 return deferred.promise;
 }

 HyphenIndexedDbBase.prototype.dbIsDefined = function () {
 return self.db ? true : false;
 }

 HyphenIndexedDbBase.prototype.schemaUpgraded = function () {
 return schemaUpgraded;
 }

 var openDbEvent = function (e) {
 self.db = e.target.result;
 processStoreData();
 }

 var schemaUpgradeComplete = function () {
 schemaUpgraded = true;
 processStoreData();
 };

 var openDbError = function (ev) {
 console.log('Error occured', ev.srcElement.error.message);
 };

 var onUpgrade = function (event) {
 self.db = event.target.result;
 var newStore = null;
 Object.keys(self.stores).forEach(function (store) {
 var storeObj = self.stores[store];
 if (self.db.objectStoreNames.contains(store)) {
 self.db.deleteObjectStore(store);
 }

 newStore = self.db.createObjectStore(store, {autoIncrement: false, keyPath: storeObj.key});
 });
 newStore.transaction.oncomplete = schemaUpgradeComplete;
 };

 var processStoreData = function () {
 _(self.stores).each(function (st) {
 HyphenIndexedDbBase.prototype.addData(st);
 });
 }

 return HyphenIndexedDbBase;
 }
 ]);

 */
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