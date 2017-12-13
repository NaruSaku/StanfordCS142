'use strict';

var cs142App = angular.module('cs142App', ['ngRoute', 'ngMaterial', 'ngResource','ngCookies','mentio']); /*'ngCookies'*/

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

cs142App.controller('MainController', ['$scope', '$mdSidenav','$resource','$rootScope','$location','$http','$mdDialog',
    function ($scope, $mdSidenav,$resource,$rootScope,$location,$http,$mdDialog) {
        $scope.main = {};
        $scope.main.title = 'CS142 Photo Sharing Website';
        $scope.main.authorName = "Ji Yu";
        $scope.main.loggedInUser = undefined;
        $scope.main.selectedPhotoFile = undefined;
        $scope.main.upload = false;

        var service = {
            SaveState: function () {
                if ($scope.main.loggedInUser){
                    sessionStorage.userService = angular.toJson($scope.main.loggedInUser);
                }
            },

            RestoreState: function () {
                //delete sessionStorage.userService;
                if(sessionStorage.userService){
                    $scope.main.loggedInUser = angular.fromJson(sessionStorage.userService);
                    //console.log("RestoreState: " + $scope.main.loggedInUser);
                }
            }
        };

        window.onbeforeunload = function (event) {
            $rootScope.$broadcast('savestate');
        };
        $rootScope.$on("savestate", service.SaveState);


        $rootScope.$on("$routeChangeStart", function(event, next, current) {
            if ($scope.main.loggedInUser === undefined) {
                // no logged user, redirect to /login-register unless already there
                // This part is used to hold the session
                service.RestoreState();
                if($scope.main.loggedInUser){
                    return;
                }
                if (next.templateUrl !== "components/login-register/login-registerTemplate.html") {
                    $location.path("/login-register");
                }
            } else {
                if (next.templateUrl === "components/login-register/login-registerTemplate.html") {
                    $location.path("/users/" + $scope.main.loggedInUser._id);
                }
            }
        });

        $scope.main.showUserList = function () {
            $mdSidenav("users").toggle();
        };

        /* Reference:http://blog.csdn.net/YYecust/article/details/52419522 */
        $scope.main.controlVisibility = function(photo) {
            console.log("Begin to upload photo.");
            var child = $scope.$new(false,$scope);
            $mdDialog.show({
                clickOutsideToClose: true,
                controller: 'visibilityControlController',
                scope: child,
                templateUrl: 'components/visibility-control/visibility-controlTemplate.html'
            }).then(function(result) { // everybody can see
                if ($scope.main.upload){
                    $scope.main.uploadPhoto(true, result);
                } else {
                    $scope.main.forward(result,photo,true);
                }
            }, function(result) {   // only people on the list can see
                if (result){
                    if ($scope.main.upload){
                        var visibleList = [];
                        $scope.main.uploadPhoto(false, visibleList);
                    } else {
                        $scope.main.forward(result,photo,false);
                    }
                }
            });
        };

        //Called on file selection - we simply save a reference to the file in selectedPhotoFile
        $scope.main.inputFileNameChanged = function (element) {
            $scope.main.selectedPhotoFile = element.files[0];
            $scope.main.upload = true;
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
            console.log(visibleList);

            // Using $http to POST the form
            $http.post('/photos/new', domForm, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).then(function successCallback(response){
                var photo = response.data;
                console.log(photo.control + " is true?");
                $http.post('/recentActivity/',JSON.stringify({
                    activity: "posted a photo",
                    user_id: $scope.main.loggedInUser._id,
                    control:photo.control,
                    visibleList:photo.visibleList
                })).then(function () {
                    $rootScope.$broadcast('listUpdated');
                });

                $rootScope.$broadcast("photoUploaded");
                $location.path("/photos/" + $scope.main.loggedInUser._id);
                $scope.main.selectedPhotoFile = undefined;
                $scope.main.upload = false;
                console.log("Photo has been uploaded successfully!");
            }, function errorCallback(response){
                // Couldn't upload the photo. XXX  - Do whatever you want on failure.
                console.error('ERROR uploading photo', response);
            });
        };

        $scope.main.forward = function(visibleList,photo,control){
            console.log(photo);
            $http.post('/photos/forward',JSON.stringify({
                'photo':photo,
                'visibleList':visibleList,
                'control':control
            })).then(function successCallback(response){
                $rootScope.$broadcast("photoUploaded");
            },function errorCallback(response){
                console.error('ERROR forwarding photo', response);
            });
        }

        $scope.main.showActivities = function () {
            $location.path("/activity");
        };



        var versionResource = $resource('/test/info');
        versionResource.get({}, function(version) {
            $scope.main.version = version.__v;
        });

        $scope.main.logout = function() {
            $http.post('/recentActivity/',JSON.stringify({
                activity: "logged out",
                user_id: $scope.main.loggedInUser._id,
                control:false,
                visibleList:[]
            })).then(function () {
                $rootScope.$broadcast('listUpdated');
                $http.post('/admin/logout','').then(function successCallback(response) {
                    delete $scope.main.loggedInUser;
                    delete sessionStorage.userService;
                    $scope.main.title = 'CS142 Photo Sharing Website';
                    $location.path("/login-register");
                }, function errorCallback(response) {
                    console.log(response.data);
                });
            });

        };

        $scope.main.submit = function () {
            $location.path("/comment/" + $scope.main.comment);
            $scope.main.comment = "";
        };


    }]);

cs142App.run(function($rootScope, $location, $anchorScroll, $routeParams) {
    $rootScope.$on('$routeChangeSuccess', function(newRoute, oldRoute) {
        $location.hash($routeParams.scrollTo);
        $anchorScroll();
    });
});

