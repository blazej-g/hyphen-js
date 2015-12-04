jsHyphen.factory("HyphenDataModel", function () {
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