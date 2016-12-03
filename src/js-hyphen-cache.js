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