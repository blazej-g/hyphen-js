jsHyphen.factory("HyphenDataModel", ['HyphenIndexDb', function (HyphenIndexDb) {
    var HyphenDataModel = function (model, name, indexedDB) {
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
            return !el.deleted;
        })
    }

    HyphenDataModel.prototype.removeDataOnline = function (data) {
        var self = this;
        var key = this.model.key;
        var data = Array.isArray(data) ? data : [data];
        _(data).each(function (record) {
            HyphenIndexDb.deleteRecord(self.modelName, record[key]);

            var id = (record && record[key]) ? record[key] : record;
            this.data = _(this.data).filter(function (element) {
                return element[key] != id;
            });
        }, this);
        clearIndexes.call(this);

        //this.indexedDB.removeStoreRecord(this.modelName, data);
    };

    HyphenDataModel.prototype.removeDataOffline = function (data) {
        var self = this;
        var key = this.model.key;
        var data = Array.isArray(data) ? data : [data];
        _(data).each(function (record) {
            record.deleted = true;
            HyphenIndexDb.updateRecordStore(record, self.modelName, record[key]);

            var id = (record && record[key]) ? record[key] : record;
            this.data = _(this.data).map(function (element) {
                if (element[key] == id) {
                    element.deleted = true;
                }
                return element;
            });
        }, this);
        clearIndexes.call(this);

        //this.indexedDB.removeStoreRecord(this.modelName, data);
    };

    HyphenDataModel.prototype.addData = function (data) {
        var self = this;
        data = JSON.parse(JSON.stringify(data));
        var key = this.model.key;
        var data = Array.isArray(data) ? data : [data];

        _(data).each(function (record) {
            var index;
            var existEl = _(self.data).find(function (el, ind) {
                index = ind;
                return el[key] == record[key];
            });

            if (existEl) {
                HyphenIndexDb.updateRecordStore(record, self.modelName, record[key]);
            } else {
                HyphenIndexDb.addRecordToStore(record, self.modelName);
            }
        });

        this.data = _(data).chain().map(function (val) {
            //extend given objects
            return _.extend(new this.model(val), val);
        }, this).
        concat(this.data).uniq(false, function (element) {
            return element[key];
        }).value();

        clearIndexes.call(this);
    };

    return HyphenDataModel;
}]);