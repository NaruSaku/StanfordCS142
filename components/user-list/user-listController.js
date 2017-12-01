'use strict';

cs142App.controller('UserListController', ['$scope','$resource',
    function ($scope,$resource) {
        $scope.main.title = 'Users';
        $scope.userList = {};
        $scope.userList.userNames = [];

        var userList = $resource("/user/list");

        $scope.userList.reload = function () {
            userList.query({}, function (users) {
                $scope.userList.userNames = users;
            });
        };

        $scope.userList.reload();

        $scope.$on('photoUploaded', $scope.userList.reload);
        $scope.$on('photoDeleted', $scope.userList.reload);
    }]);