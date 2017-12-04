'use strict';

cs142App.controller('DialogController', ['$scope', '$rootScope', '$mdDialog','user','$location',
    function($scope, $rootScope, $mdDialog,user,$location) {
        $scope.dialog = {};
        $scope.dialog.user = user;
        $scope.dialog.hide = function() {
            $mdDialog.hide();
        };

        $scope.dialog.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.dialog.answer = function(answer) {
            $mdDialog.hide(answer);
        };

        $scope.dialog.link_to = function (parameter) {
            if (parameter !== "all"){
                $location.path("/users/" + $scope.dialog.user._id);
            } else {
                $location.path("/activity");
            }
            $scope.dialog.cancel();
        }
    }]);