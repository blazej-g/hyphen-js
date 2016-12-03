/**
 * @version v0.0.294 - 2016-12-03 */var jsHyphen = angular.module('jsHyphen', []);

jsHyphen.provider("Hyphen", [function () {
    var provider = {};
    provider.initialize = function () {

    };
    provider.$get = ['$rootScope', '$http', '$q', '$injector', '$timeout', 'HyphenDataProvider', 'HyphenAPI', 'HyphenCache',
        function ($rootScope, $http, $q, $injector, $timeout, HyphenDataProvider, HyphenAPI, HyphenCache) {
            var Hyphen = {};

            Hyphen.initialize = function (globalConfiguration) {
                this.configuration = globalConfiguration;

                _(globalConfiguration.model).each(function (modelConfiguration, key, obj) {
                    modelConfiguration.name=key;
                    Hyphen[modelConfiguration.name] = {};
                    Hyphen[modelConfiguration.name].provider = new HyphenDataProvider(modelConfiguration);
                    //Hyphen[modelConfiguration.name].api = new HyphenAPI(Hyphen[modelConfiguration.name].provider, modelConfiguration, globalConfiguration);
                });

                _(globalConfiguration.model).each(function (modelConfiguration, key, obj) {
                   // Hyphen[modelConfiguration.name].provider = new HyphenDataProvider(modelConfiguration);
                    modelConfiguration.name=key;
                    Hyphen[modelConfiguration.name].api = new HyphenAPI(Hyphen, modelConfiguration, globalConfiguration);
                });
            };

            Hyphen.dispose = function () {
                this.configuration.model.forEach(function (modelConfiguration) {
                    Hyphen[modelConfiguration.name].provider.clearData();
                });
                HyphenCache.clearCache();
            };

            return Hyphen;
        }];
    return provider;
}]);
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
jsHyphen.factory("ApiCallFactory", ['HyphenPost', 'HyphenGet', 'HyphenPut', 'HyphenDelete', 'HyphenFilePost', '$q', 'HyphenCache', function (HyphenPost, HyphenGet, HyphenPut, HyphenDelete, HyphenFilePost, $q, HyphenCache) {
    var ApiCallFactory = function (apiCallConfiguration, globalConfiguration, modelName) {
        this.apiCallConfiguration = apiCallConfiguration;
        this.modelName = modelName;

        switch (apiCallConfiguration.method) {
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
            case "filePost":
                this.callType = HyphenFilePost;
                break;
        }

        this.apiCall = new this.callType(apiCallConfiguration, globalConfiguration);
    };

    ApiCallFactory.prototype.getApiCall = function (params, data) {
        var cacheItem = this.apiCallConfiguration.name + this.modelName + JSON.stringify(params);
        if (!HyphenCache.isCached(cacheItem)) {
            if (this.apiCallConfiguration.cache && this.apiCallConfiguration.method === "get") {
                HyphenCache.addUrl(cacheItem);
            }

            return this.apiCall.invoke.call(this.apiCall, params, data);
        } else {
            return $q.resolve({data: {cached: true}});
        }
    };

    return ApiCallFactory;
}]);
jsHyphen.factory("HyphenBaseModel", [function () {
    var HyphenBaseModel = function (object) {
        _.extend(this, angular.copy(object));
    };

    HyphenBaseModel.createModelPrototype = function (modelType) {
        return Object.create(HyphenBaseModel.prototype);
    };

    return HyphenBaseModel;
}]);
jsHyphen.factory("HyphenCache", [function () {
    var urls = {};

    this.addUrl = function (url) {
        urls[url] = true;
    };

    this.isCached = function (url) {
        return urls[url];
    };

    this.clearCache = function () {
        urls = {};
    };

    return this;
}]);
jsHyphen.factory("HyphenDataProvider", ['$rootScope', '$injector', function ($rootScope, $injector) {
    var HyphenDataProvider = function (modelConfiguration) {
        this.modelConfiguration = modelConfiguration;

        this.clearData();

        if ($injector.has(modelConfiguration.model)) {
            this.modelClass = $injector.get(modelConfiguration.model);
        } else {
            throw new Error("Model not defined for: " + modelConfiguration.model);
        }

        var self = this;
        if (self.modelClass.indexes) {
            Object.keys(self.modelClass.indexes).forEach(function (key) {
                self["getBy" + self.modelClass.indexes[key]] = function (id) {
                    return self.getIndexedData(key, id);
                };
            });
        }

        if (self.modelClass.groups) {
            Object.keys(self.modelClass.groups).forEach(function (key) {
                self["getGroupBy" + self.modelClass.groups[key]] = function (id) {
                    return self.getGroupedData(key, id);
                };
            });
        }
    };

    HyphenDataProvider.prototype.data = [];

    HyphenDataProvider.prototype.clearData = function () {
        this.data = [];
        this.metaData = {};
        this.clearIndexes();
    };

    HyphenDataProvider.prototype.clearIndexes = function () {
        this.indexedData = {};
        this.groupedData = {};
        this.sorted = false;
    };

    HyphenDataProvider.prototype.getIndexedData = function (key, id) {
        if (!this.indexedData[key]) {
            this.indexedData[key] = _(this.getData()).indexBy(key);
        }
        return this.indexedData[key][id];
    };

    HyphenDataProvider.prototype.getGroupedData = function (key, id) {
        if (!this.groupedData[key]) {
            this.groupedData[key] = _(this.getData()).groupBy(key);
        }
        return this.groupedData[key][id] ? this.groupedData[key][id] : [];
    };

    HyphenDataProvider.prototype.where = function (properties) {
        var concatenatedKeys = '';
        var concatenatedValues = '';

        for (var key in properties) {
            concatenatedKeys += key + '|';
            concatenatedValues += properties[key] + '|';
        }

        if (!this.groupedData[concatenatedKeys]) {
            this.groupedData[concatenatedKeys] = _(this.getData()).groupBy(function (data) {
                var dataConcatenatedValues = '';
                for (var key in properties) {
                    dataConcatenatedValues += data[key] + '|';
                }
                return dataConcatenatedValues;
            });
        }

        return this.groupedData[concatenatedKeys][concatenatedValues] ? this.groupedData[concatenatedKeys][concatenatedValues] : [];
    };

    HyphenDataProvider.prototype.findOne = function (properties) {
        var result = this.where(properties);
        return result.length > 0 ? result[0] : null;
    }

    HyphenDataProvider.prototype.getData = function () {
        var self = this;

        if (self.modelClass.sort && !self.sorted) {
            this.data = this.data = _(this.data).sortBy(function (ob) {
                if (self.modelClass.sort.desc) {
                    if (ob[self.modelClass.sort.desc]) {
                        return ob[self.modelClass.sort.desc].toLowerCase();
                    } else {
                        return ob[self.modelClass.sort.desc];
                    }
                }
                if (self.modelClass.sort.asc) {
                    if (ob[self.modelClass.sort.asc]) {
                        return ob[self.modelClass.sort.asc].toLowerCase();
                    } else {
                        return ob[self.modelClass.sort.asc];
                    }
                }
            });
            if (self.modelClass.sort.desc) {
                this.data = this.data.reverse();
            }
            self.sorted = true;
            // console.log(this.data)
        }
        return this.data;
    };

    HyphenDataProvider.prototype.delete = function (data) {
        var self = this;
        var id = (data && data[self.modelConfiguration.key]) ? data[self.modelConfiguration.key] : data;
        this.data = _(this.data).filter(function (element) {
            return element[self.modelConfiguration.key] !== id;
        });
    };

    HyphenDataProvider.prototype.put = function (data) {
        var self = this;
        var element = _(self.data).find(function (el) {
            return el[self.modelConfiguration.key] === data[self.modelConfiguration.key];
        });

        //update
        if (element) {
            var newRecord = _.extend(new self.modelClass(data), data);
            self.data = _([newRecord].concat(self.data)).uniq(false, function (element) {
                return element[self.modelConfiguration.key];
            });
        } else {
            var record = _.extend(new self.modelClass(data), data);
            self.data.push(record);
        }
    };

    HyphenDataProvider.prototype.post = function (data) {
        var self = this;
        var element = _(self.data).find(function (el) {
            return el[self.modelConfiguration.key] === data[self.modelConfiguration.key];
        });

        //update
        if (element) {
            var newRecord = _.extend(new self.modelClass(data), data);
            self.data = _([newRecord].concat(self.data)).uniq(false, function (element) {
                return element[self.modelConfiguration.key];
            });
        } else {
            var record = _.extend(new self.modelClass(data), data);
            self.data.push(record);
        }
    };

    HyphenDataProvider.prototype.get = function (data) {
        var self = this;
        var element = _(self.data).find(function (el) {
            return el[self.modelConfiguration.key] === data[self.modelConfiguration.key];
        });

        //update
        if (element) {
            var newRecord = _.extend(new self.modelClass(data), data);
            self.data = _([newRecord].concat(self.data)).uniq(false, function (element) {
                return element[self.modelConfiguration.key];
            });
        } else {
            var record = _.extend(new self.modelClass(data), data);
            self.data.push(record);
        }
    };

    return HyphenDataProvider;
}]);
/**
 * Created by blazejgrzelinski on 25/11/15.
 */
jsHyphen.factory('HyphenCallBase', [function () {
    var HyphenCallBase = function (httpOptions, hyphenConfiguration) {
        this.httpOptions = httpOptions;
        this.hyphenConfiguration = hyphenConfiguration;
        this.config = {};
    };

    HyphenCallBase.prototype.urlParser = function (url, params) {
        for (var property in params) {
            url = url.replace(":" + property, params[property]);
        }
        return url;
    };

    var strEndsWith = function (str, suffix) {
        return str.match(suffix + "$") === suffix;
    };

    HyphenCallBase.prototype.invoke = function (params, data) {
        this.config = angular.copy(this.httpOptions);
        var url = "";
        if (!strEndsWith(this.hyphenConfiguration.baseUrl, "/")) {
            url = this.hyphenConfiguration.baseUrl;
        }

        if (params) {
            this.config.url = url + this.urlParser(this.httpOptions.url, params);
        } else {
            this.config.url = url + this.httpOptions.url;
        }

        this.config.data = data;
        if (this.hyphenConfiguration.requestInterceptor) {
            this.config = this.hyphenConfiguration.requestInterceptor(this.config);
        }

        //hyphen cache property is the same like the native $http cache so it prevent from making http request
        this.config.cache = false;
        return this.$http(this.config);
    };

    return HyphenCallBase;

}]);

jsHyphen.factory("HyphenGet", ['HyphenCallBase', '$http', function (HyphenCallBase, $http) {
    var HyphenGet = function (httpOptions, hyphenConfiguration) {
        HyphenCallBase.call(this, httpOptions, hyphenConfiguration);
        this.$http = $http;
    };
    HyphenGet.prototype = Object.create(HyphenCallBase.prototype);
    return HyphenGet;

}]);

jsHyphen.factory("HyphenPost", ['HyphenCallBase', '$http', function (HyphenCallBase, $http) {
    var HyphenPost = function (httpOptions, hyphenConfiguration) {
        HyphenCallBase.call(this, httpOptions, hyphenConfiguration);
        this.$http = $http;
    };
    HyphenPost.prototype = Object.create(HyphenCallBase.prototype);
    return HyphenPost;
}]);

jsHyphen.factory("HyphenPut", ['HyphenCallBase', '$http', function (HyphenCallBase, $http) {
    var HyphenPut = function (httpOptions, hyphenConfiguration) {
        HyphenCallBase.call(this, httpOptions, hyphenConfiguration);
        this.$http = $http;
    };
    HyphenPut.prototype = Object.create(HyphenCallBase.prototype);
    return HyphenPut;
}]);

jsHyphen.factory("HyphenDelete", ['HyphenCallBase', '$http', function (HyphenCallBase, $http) {
    var HyphenDelete = function (httpOptions, hyphenConfiguration) {
        HyphenCallBase.call(this, httpOptions, hyphenConfiguration);
        this.$http = $http;
    };
    HyphenDelete.prototype = Object.create(HyphenCallBase.prototype);

    return HyphenDelete;
}]);

jsHyphen.factory("HyphenFilePost", ['HyphenCallBase', '$http', '$q', function (HyphenCallBase, $http, $q) {
    var HyphenFilePost = function (httpOptions, hyphenConfiguration) {
        HyphenCallBase.call(this, httpOptions, hyphenConfiguration);
        this.httpOptions.method= "POST";
        this.$http = function(config){
            var httpRequest = new XMLHttpRequest();
            httpRequest.open("POST", config.url , true);

            var httpPromise = $q.defer();
            httpRequest.upload.addEventListener("progress", function (oEvent) {
                oEvent.progress = Math.round(((oEvent.loaded / oEvent.total).toFixed(2)) * 100);
                httpPromise.notify(oEvent);
            }, true);
            httpRequest.addEventListener("error", function (data) {
                httpPromise.reject(data);
            }, true);
            httpRequest.addEventListener("abort", function (data) {
                data.aborted = true;
                httpPromise.reject(data);
            }, true);
            httpRequest.onreadystatechange = function (data) {
                if (httpRequest.status == 403 || httpRequest.status == 404 || httpRequest.status == 500 || httpRequest.status == 422) {
                    httpPromise.reject(data);
                }
                if (httpRequest.readyState == 4 && httpRequest.status == 200) {
                    var data = JSON.parse(httpRequest.response);
                    if (data.errors && data.errors.file) {
                        httpPromise.reject(data);
                    } else {
                        httpPromise.resolve({data: data});
                    }
                }
            };
            httpRequest.send(config.data);

            httpPromise.promise.abort = function () {
                httpRequest.abort();
            };

            return httpPromise.promise;
        };
    };
    HyphenFilePost.prototype = Object.create(HyphenCallBase.prototype);
    return HyphenFilePost;
}]);