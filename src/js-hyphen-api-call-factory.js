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