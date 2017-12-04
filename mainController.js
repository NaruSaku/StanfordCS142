'use strict';

var cs142App = angular.module('cs142App', ['ngRoute', 'ngMaterial', 'ngResource','ngCookies']); /*'ngCookies'*/

cs142App.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
        when('/users', {
            templateUrl: 'components/user-list/user-listTemplate.html',
            controller: 'UserListController'
        }).
        when('/users/:userId', {
            templateUrl: 'components/user-detail/user-detailTemplate.html',
            controller: 'UserDetailController'
        }).
        when('/photos/:userId', {
            templateUrl: 'components/user-photos/user-photosTemplate.html',
            controller: 'UserPhotosController'
        }).
        when('/login-register',{
            templateUrl: 'components/login-register/login-registerTemplate.html',
            controller:'LoginRegisterController'
        }).
        when('/comment/:text',{
            templateUrl: 'components/comment/commentTemplate.html',
            controller:'commentController'
        }).
        when('/activity',{
            templateUrl: 'components/activity/activityTemplate.html',
            controller:'activityController'
        }).
        when('/favorite',{
            templateUrl: 'components/favorite/favoriteTemplate.html',
            controller:'favoriteController'
        }).
        otherwise({
            redirectTo: '/users'
        });
    }]);

cs142App.controller('MainController', ['$scope', '$mdSidenav','$resource','$rootScope','$location','$http','$mdDialog','$anchorScroll',
    function ($scope, $mdSidenav,$resource,$rootScope,$location,$http,$mdDialog,$anchorScroll) {
        $scope.main = {};
        $scope.main.title = 'CS142 Photo Sharing Website';
        $scope.main.authorName = "Ji Yu";
        $scope.main.loggedInUser = undefined;
        $scope.main.selectedPhotoFile = undefined;

        $rootScope.$on("$routeChangeSuccess", function(event, next, current) {
            if($location.hash()) $anchorScroll();
            if ($scope.main.loggedInUser === undefined) {
                // no logged user, redirect to /login-register unless already there
                // This part is used to hold the session
                var requestBody = {login_name:"session"};
                $http.post('/admin/login', JSON.stringify(requestBody)).then(function successCallback(response) {
                    if (response){
                        $scope.main.loggedInUser = response.data.user;
                        if (response.data.photo_user_id){
                            $location.path("/photos/" + response.data.photo_user_id);
                        } else {
                            $location.path("/users/" + response.data.user_detail_id);
                        }
                    }
                }, function errorCallback(response) {
                    console.log(response.data);
                });
                // end
                if (next.templateUrl !== "components/login-register/login-registerTemplate.html") {
                    $location.path("/login-register");
                }
            }
                // if (next.templateUrl === "components/login-register/login-registerTemplate.html") {
                //     $location.path(current.templateUrl);
                // }
                //$location.path(current.templateUrl);

        });

        $scope.main.showUserList = function () {
            $mdSidenav("users").toggle();
        };

        /* Reference:http://blog.csdn.net/YYecust/article/details/52419522 */
        $scope.main.controlVisibility = function() {
            console.log("Begin to upload photo.");
            var child = $scope.$new(false,$scope);
            $mdDialog.show({
                clickOutsideToClose: true,
                controller: 'visibilityControlController',
                scope: child,
                templateUrl: 'components/visibility-control/visibility-controlTemplate.html'
            }).then(function(result) {
                if (result.passed){
                    $scope.main.uploadPhoto(true, result.data);
                }
            }, function(result) {
                if (result){
                    var visibleList = [];
                    $scope.main.uploadPhoto(false, visibleList);
                }
            });
        };

        //Called on file selection - we simply save a reference to the file in selectedPhotoFile
        $scope.main.inputFileNameChanged = function (element) {
            $scope.main.selectedPhotoFile = element.files[0];
            $scope.main.controlVisibility();
        };

        $scope.main.inputFileNameSelected = function () {
            return !!$scope.main.selectedPhotoFile;
        };

        // Upload the photo file selected by the user using a post request to the URL /photos/new
        $scope.main.uploadPhoto = function (control, visibleList) {
            if (!$scope.main.inputFileNameSelected()) {
                console.error("uploadPhoto called will no selected file");
                return;
            }
            console.log('fileSubmitted', $scope.main.selectedPhotoFile);

            var domForm = new FormData();
            domForm.append('uploadedphoto', $scope.main.selectedPhotoFile);
            domForm.append('control', control);
            domForm.append('visibleList', visibleList);

            // Using $http to POST the form
            $http.post('/photos/new', domForm, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).then(function successCallback(response){
                $http.post('/recentActivity/',JSON.stringify({
                    activity: "posted a photo",
                    user_id: $scope.main.loggedInUser._id
                })).then(function () {
                    $rootScope.$broadcast('listUpdated');
                });

                $rootScope.$broadcast("photoUploaded");
                $location.path("/photos/" + $scope.main.loggedInUser._id);
                console.log("Photo has been uploaded successfully!");
            }, function errorCallback(response){
                // Couldn't upload the photo. XXX  - Do whatever you want on failure.
                console.error('ERROR uploading photo', response);
            });
        };



        var versionResource = $resource('/test/info');
        versionResource.get({}, function(version) {
            $scope.main.version = version.__v;
        });

        $scope.main.logout = function() {
            $http.post('/recentActivity/',JSON.stringify({
                activity: "logged out",
                user_id: $scope.main.loggedInUser._id
            })).then(function () {
                $rootScope.$broadcast('listUpdated');
            });
            $http.post('/admin/logout','').then(function successCallback(response) {
                $scope.main.loggedInUser = undefined;
                $location.path("/login-register");
            }, function errorCallback(response) {
                console.log(response.data);
            });
        };

        // $rootScope.$on("emitSinglePhoto",function (event, args) {
        //     //alert("shit");
        //     $rootScope.$broadcast("ShowSinglePhoto",args);
        // });
        //
        $scope.main.submit = function () {
            $location.path("/comment/" + $scope.main.comment);
            $scope.main.comment = "";
        }


    }]);
