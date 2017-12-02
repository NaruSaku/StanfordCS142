"use strict";

cs142App.controller('UserDetailController', ['$scope', '$routeParams','$resource','$location','$rootScope','$mdDialog','$http',
    function ($scope, $routeParams, $resource, $location,$rootScope,$mdDialog,$http) {
        /*
         * Since the route is specified as '/users/:userId' in $routeProvider config the
         * $routeParams  should have the userId property set with the path from the URL.
         */
        var userId = $routeParams.userId;
        console.log('UserDetail of ', userId);
        var userData = $resource('/user/:userId');
        var userPhotoData = $resource('/userPhoto/:userId');

        $scope.userDetail = {};

        userData.get({'userId':userId},function (userData) {
            $scope.userDetail.user = userData;
            $scope.userDetail.fullName = userData.first_name + " " + userData.last_name;
            $scope.main.appContext = "Information of " + $scope.userDetail.fullName;

        });

        userPhotoData.get({'userId':userId},function (userPhotoDetail) {
            $scope.userDetail.mostRecentlyPhoto = userPhotoDetail.mostRecentlyPhoto;
            $scope.userDetail.mostCommentsPhoto = userPhotoDetail.mostCommentsPhoto;
        });

        $scope.userDetail.showDetail = function(photo){
            $scope.$emit("emitSinglePhoto",photo);
            $location.path("/photos/" + photo.user_id);
        };

        $scope.userDetail.hasAuthority = function () {
            if ($scope.main.loggedInUser === undefined) return false;
            return $scope.main.loggedInUser._id === userId;
        };

        $scope.userDetail.deleteAccount = function (ev) {
            if (!$scope.userDetail.hasAuthority) return;
            var confirm = $mdDialog.confirm()
                .title('This will delete the all the information in your account!')
                .textContent('This action cannot be revoked')
                .targetEvent(ev)
                .ok('Delete Anyway')
                .cancel('Cancel');

            $mdDialog.show(confirm).then(function() {
                $http.post('/deleteAccount', JSON.stringify({user:$scope.main.loggedInUser})).then(function successCallback(response) {
                    $scope.main.loggedInUser = undefined;
                    $rootScope.$broadcast("accountDeleted");
                    $location.path("/login-register");
                }, function errorCallback(response) {
                    console.log(response.data);
                });
            }, function() {
                console.log("You don't want to delete the account at present.")
            });

        }
    }]);
