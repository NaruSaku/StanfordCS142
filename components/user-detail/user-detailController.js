"use strict";

cs142App.controller('UserDetailController', ['$scope', '$routeParams','$resource','$http',
    function ($scope, $routeParams, $resource, $http) {
        /*
         * Since the route is specified as '/users/:userId' in $routeProvider config the
         * $routeParams  should have the userId property set with the path from the URL.
         */
        var userId = $routeParams.userId;
        console.log('UserDetail of ', userId);
        var userData = $resource('/user/:userId');
        $scope.userDetail = {};

        userData.get({'userId':userId},function (userData) {
            $scope.userDetail.user = userData.userDetail;
            $scope.userDetail.fullName = userData.userDetail.first_name + " " + userData.userDetail.last_name;
            $scope.main.appContext = "Personal Information of " + $scope.userDetail.fullName;
        });





    }]);
