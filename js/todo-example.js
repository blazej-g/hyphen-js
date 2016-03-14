var app = angular.module('plunker', []);

app.controller('MainCtrl', function($scope, $timeout, $q) {

    var person = {"name": "Bill Gates"}

    var deferList = $q.defer();
    var deferSingle = $q.defer();

    // Bind the person object directly to the scope. This is editable.
    $scope.direct = person;

    // Bind a promise to the scope that will return a list of people. This is editable.
    $scope.list   = deferList.promise;

    // Bind ap romise to the scope that will return a single person record. This is *not* editable.
    $scope.single = deferSingle.promise;

    // Resolve the promises
    $timeout( function(){
        deferList.resolve( [person] );  // Array
        deferSingle.resolve( person );  // Just the record itself
    }, 100);


});
