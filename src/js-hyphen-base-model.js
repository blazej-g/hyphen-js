jsHyphen.factory("HyphenBaseModel", [function () {
    var HyphenBaseModel = function (object) {
        _.extend(this, angular.copy(object));
    };

    HyphenBaseModel.createModelPrototype = function (modelType) {
        return Object.create(HyphenBaseModel.prototype);
    };

    return HyphenBaseModel;
}]);