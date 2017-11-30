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



        // var user2 = [];
        //
        // $scope.userList.userNames.forEach(function (current) {
        //     alert("shit");
        //     userPhotos.query({'userId': current.userName._id}, function(photos) {
        //         user2.push(photos.length);
        //         console.log(photos.length);
        //     });
        // });
        // console.log(user2);
        // alert(user2);

        // $scope.userPhotos.reload = function () {
        //     userList.get({'userId': userId}, function(user) {
        //         $scope.userPhotos.fullName = user.first_name + " " + user.last_name;
        //         $scope.main.appContext = "The Photos of " + $scope.userPhotos.fullName;
        //     });
        //
        //     userPhotos.query({'userId': userId},function (photos) {
        //         $scope.userPhotos.photos = photos;
        //     });
        // };
    }]);