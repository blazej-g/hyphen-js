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