jsHyphen.factory("IndexedDbCommandBase", ['$q', function () {
    var IndexedDbCommandBase = function (name, version) {
        var selfObj = this;
        this.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

        if (!this.indexedDB) {
            console.log("Indexed db not supported, offline mode not supported");
        }

        var request = window.indexedDB.open(name, version);

        request.onsuccess = function (event) {
            selfObj.db = event.target.result;
            selfObj.stores = event.target.result.objectStoreNames;
            if (selfObj.openEvent) {
                selfObj.openEvent(event);
            }
            console.log("Local db initialized");

        }
        request.onerror = function (event) {
            console.log(event);
        };
        request.onupgradeneeded = function (event) {
            selfObj.db = event.target.result;
            if (selfObj.upgradeEvent) {
                selfObj.upgradeEvent(event);
            }
        };

        request.oncomplete = function (event) {
            console.log(event);
        }

    }

    IndexedDbCommandBase.prototype.isInitialized = function () {
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
    var IndexedDbCommands = function (name, version) {
        IndexedDbCommandBase.call(this, name, version);
    }

    IndexedDbCommands.prototype = Object.create(IndexedDbCommandBase.prototype);

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
            promise = new Promise(function (resolve) {
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
        request.onerror = function () {
            console.log('can not get record ' + record);
        };
        request.onsuccess = function () {
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
        request.onsuccess = function () {
            objectStore.put(data);
        };
    }

    IndexedDbCommands.prototype.deleteRecord = function (store, id) {
        var objectStore = this.db.transaction(store, "readwrite").objectStore(store);
        objectStore.delete(id);
    }

    IndexedDbCommands.prototype.getStoreData = function (store) {
        var transaction = this.db.transaction(store.name, "readwrite");
        var dbStore = transaction.objectStore(store.name);
        var request = dbStore.openCursor();
        var data = [];
        var deferred = $q.defer();
        request.onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {
                data.push(cursor.value);
                cursor.continue();
            } else {
                deferred.resolve({data: data, model: store});
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

    HyphenIndexDb.clearStores = function (stores, realStores) {
        return indexedDb.clearStores(stores, realStores);
    }

    HyphenIndexDb.getStoreData = function (store) {
        return indexedDb.getStoreData(store);
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
        if (indexedDb) {
            return indexedDb.isInitialized();
        }
        else {
            return false;
        }
    }
    HyphenIndexDb.closeDb = function () {
        if (indexedDb) {
            indexedDb.closeDb();
        }
    }

    return HyphenIndexDb;
}]);