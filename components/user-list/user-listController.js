'use strict';

cs142App.controller('UserListController', ['$scope','$resource','$mdDialog','$location',
    function ($scope,$resource,$mdDialog,$location) {
        $scope.main.title = 'User List';
        $scope.userList = {};
        $scope.userList.userNames = [];

        var userList = $resource("/user/list");

        $scope.userList.reload = function () {
            userList.query({}, function (users) {
                $scope.userList.userNames = users;
            });
        };

        $scope.userList.reload();

        $scope.userList.showRecentActivity = function(ev,user) {
            $mdDialog.show({
                controller: 'DialogController',
                templateUrl: 'components/user-list/DialogTemplate.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:true,
                locals:{
                    user:user
                }
            }).then(function(answer) {}, function() {});
        };

        $scope.userList.showActivities = function () {
            $location.path("/activity");
        };
        $scope.userList.showFavorite = function () {
            $location.path("/favorite");
        };

        $scope.$on('photoUploaded', $scope.userList.reload);
        $scope.$on('photoDeleted', $scope.userList.reload);
        $scope.$on('listUpdated', $scope.userList.reload);
    }]);