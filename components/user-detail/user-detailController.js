"use strict";

cs142App.controller('UserDetailController', ['$scope', '$routeParams','$resource','$location','$rootScope','$mdDialog','$http',
    function ($scope, $routeParams, $resource, $location,$rootScope,$mdDialog,$http) {
        /*
         * Since the route is specified as '/users/:userId' in $routeProvider config the
         * $routeParams  should have the userId property set with the path from the URL.
         */
        var userId = $routeParams.userId;
        var userData = $resource('/user/:userId');
        var userPhotoData = $resource('/userPhoto/:userId');



        $scope.userDetail = {};
        $scope.userDetail.profile = {};

        $scope.userDetail.load = function(){
            userData.get({'userId':userId},function (userData) {
                $scope.userDetail.user = userData;
                $scope.userDetail.fullName = userData.first_name + " " + userData.last_name;
                $scope.main.appContext = $scope.userDetail.fullName;
                $scope.main.title = $scope.userDetail.fullName;
                $scope.userDetail.showMention();

                var photo_profile = $scope.userDetail.user.profile;  // photo_id
                if (photo_profile === '5a31ca6582fe983ecda367c0'){
                    $scope.userDetail.profile.file_name = "default-profile.jpeg";
                } else {
                    var profile = $resource('/profile/:photo_profile');
                    profile.get({'photo_profile':photo_profile},function(pro){
                        $scope.userDetail.profile = pro;
                    });
                }
            });
            userPhotoData.get({'userId':userId},function (userPhotoDetail) {
                $scope.userDetail.mostRecentlyPhoto = userPhotoDetail.mostRecentlyPhoto;
                $scope.userDetail.mostCommentsPhoto = userPhotoDetail.mostCommentsPhoto;
            });
        };

        $scope.userDetail.load();

        $scope.userDetail.changeProfile = function(){
            $mdDialog.show({
                controller: 'profileController',
                templateUrl: 'components/user-detail/profileTemplate.html',
                parent: angular.element(document.body),
                // targetEvent: ev,
                clickOutsideToClose:true,
                locals:{
                    profile:$scope.userDetail.profile,
                    userId:$scope.main.loggedInUser._id
                }
            }).then(function(answer) {}, function() {});
        };
        
        $scope.userDetail.showDetail = function(photo){
            //$scope.$emit("emitSinglePhoto",photo);
            $rootScope.$broadcast("bottom");
            $location.path("/photos/" + photo.user_id);
        };

        $scope.userDetail.hasAuthority = function () {
            if ($scope.main.loggedInUser === undefined){
                return false;
            }
            return $scope.main.loggedInUser._id === userId;
        };

        $scope.userDetail.deleteAccount = function (ev) {
            if (!$scope.userDetail.hasAuthority){
                return;
            }
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
                console.log("You don't want to delete the account at present.");
            });

        };

        $scope.userDetail.showMention = function(parameter) {
            var all = false;
            if (parameter === true){
                all = true;
            }
            $http.post('/getMention',JSON.stringify({'user_id':userId,'all':all}))
            .then(function successCallback(response) {
                $scope.userDetail.mentions = response.data;
            }, function errorCallback(response) {
                console.log(response.data);
            });
        }

        

        $scope.userDetail.deleteMention = function(mention) {
            $http.post('/changeMentionState',JSON.stringify({mention:mention})).then(function successCallback(response) {
                $rootScope.$broadcast("mentionDeleted");
            }, function errorCallback(response) {
                console.log(response.data);
            });
        }

        $scope.$on("mentionDeleted",$scope.userDetail.showMention);
        $scope.$on("ProfileChanged",$scope.userDetail.load);

    }]);
