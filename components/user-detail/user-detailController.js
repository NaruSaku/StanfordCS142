"use strict";

cs142App.controller('UserDetailController', ['$scope', '$routeParams','$resource','$location','$rootScope',
    function ($scope, $routeParams, $resource, $location,$rootScope) {
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
        }
    }]);
