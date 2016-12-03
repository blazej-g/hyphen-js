var jsHyphen = angular.module('jsHyphen', []);

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