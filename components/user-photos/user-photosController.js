'use strict';

cs142App.controller('UserPhotosController', ['$scope', '$routeParams','$resource','$http', '$rootScope','$location',
    function($scope, $routeParams,$resource, $http, $rootScope,$location) {
        /*
         * Since the route is specified as '/photos/:userId' in $routeProvider config the
         * $routeParams  should have the userId property set with the path from the URL.
         */
        var userId = $routeParams.userId;
        $scope.userPhotos = {};
        $scope.userPhotos.comments = {};
        $scope.userPhotos.photos = [];
        $scope.userPhotos.photos2 = [];
        $scope.userPhotos.index = 0;
        $scope.userPhotos.noPhotos = false;


        var user = $resource('/user/:userId');
        var userPhotos = $resource('/photosOfUser/:userId');

        //
        var obj = document.getElementById("advanced-feature");
        $scope.userPhotos.checked = obj.checked;

        $scope.userPhotos.reload = function () {
            user.get({'userId': userId}, function(user) {
                $scope.userPhotos.fullName = user.first_name + " " + user.last_name;
                $scope.main.appContext = "The Photos of " + $scope.userPhotos.fullName;
            });

            userPhotos.query({'userId': userId},function (photos) {
                $scope.userPhotos.photos = photos;
                $scope.userPhotos.photos2= photos;
                if (photos.length === 0){
                    $scope.userPhotos.noPhotos = true;
                }
                if ($scope.userPhotos.checked){
                    $scope.userPhotos.photos = $scope.userPhotos.photos2.slice($scope.userPhotos.index,$scope.userPhotos.index + 1);
                }
                $scope.userPhotos.photos.forEach(function (photo) {
                    $http.post('/photoView', JSON.stringify({photo_id:photo._id})).then(function successCallback(response) {
                        $rootScope.$broadcast("photoViewed");
                    }, function errorCallback(response) {
                        console.log(response.data);
                    });
                    //alert(photo.view_times);
                });
            });


        };

        $scope.userPhotos.reload();




        $scope.userPhotos.addComment = function(photo) {
            var data = JSON.stringify({comment: $scope.userPhotos.comments[photo._id]});
            $http.post("/commentsOfPhoto/" + photo._id, data).then(function successCallback(response) {
                $rootScope.$broadcast("commentAdded");
                console.log(response.data);
            }, function errorCallback(response) {
                console.log(response.data);
            });
            $scope.userPhotos.comments[photo._id] = "";
        };

        $scope.userPhotos.hasPhotoAuthority = function (photo) {
            if ($scope.main.loggedInUser){
                return $scope.main.loggedInUser._id === photo.user_id;
            }
        };

        $scope.userPhotos.hasCommentAuthority = function (comment) {
            if ($scope.main.loggedInUser){
                return $scope.main.loggedInUser._id === comment.user_id;
            }
        };

        $scope.userPhotos.delete = function (photo) {
            if(!confirm("This will delete the photo and cannot be revoked!")){
                return;
            }
            $http.post('/deletePhoto', JSON.stringify({photo_id:photo._id})).then(function successCallback(response) {
                $rootScope.$broadcast("photoDeleted");
            }, function errorCallback(response) {
                console.log(response.data);
            });
        };

        $scope.userPhotos.deleteComment = function (photo,comment) {
            if(!confirm("This will delete the comment!")){
                return;
            }
            $http.post('/deleteComment', JSON.stringify({photo_id:photo._id,comment_id:comment._id})).then(function successCallback(response) {
                $rootScope.$broadcast("commentDeleted");
            }, function errorCallback(response) {
                console.log(response.data);
            });
        };

        /* This part is for advanced feature */
        $scope.userPhotos.previous = function () {
            if ($scope.userPhotos.index === 0){
                return ;
            }
            $scope.userPhotos.index--;
            $rootScope.$broadcast("pageChanged");
        };

        $scope.userPhotos.next = function () {
            if ($scope.userPhotos.index === $scope.userPhotos.photos2.length - 1){
                return ;
            }
            $scope.userPhotos.index++;
            $rootScope.$broadcast("pageChanged");
        };

        /* This part is for the like and dislike */
        $scope.userPhotos.like = function(photo) {
            var photo_id = photo._id;
            $http.post('/likePhoto', JSON.stringify({photo_id:photo_id})).then(function successCallback(response) {
                $rootScope.$broadcast("photoLiked");
            }, function errorCallback(response) {
                console.log(response.data);
            });
        };
        $scope.userPhotos.dislike = function(photo) {
            var photo_id = photo._id;
            $http.post('/dislikePhoto', JSON.stringify({photo_id:photo_id})).then(function successCallback(response) {
                $rootScope.$broadcast("photoDisLiked");
            }, function errorCallback(response) {
                console.log(response.data);
            });
        };


        $scope.$on("commentAdded", $scope.userPhotos.reload);
        $scope.$on("commentDeleted", $scope.userPhotos.reload);
        $scope.$on('photoUploaded', $scope.userPhotos.reload);
        $scope.$on('photoDeleted', $scope.userPhotos.reload);
        $scope.$on('pageChanged', $scope.userPhotos.reload);
        $scope.$on('photoLiked', $scope.userPhotos.reload);
        $scope.$on('photoDisLiked', $scope.userPhotos.reload);
    }]);
