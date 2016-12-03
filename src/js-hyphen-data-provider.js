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