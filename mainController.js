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
        otherwise({
            redirectTo: '/users'
        });
    }]);

cs142App.controller('MainController', ['$scope', '$mdSidenav','$resource','$rootScope','$location','$http',
    function ($scope, $mdSidenav,$resource,$rootScope,$location,$http) {
        $scope.main = {};
        $scope.main.title = 'CS142 Photo Sharing Website';
        $scope.main.authorName = "Ji Yu";
        $scope.main.loggedInUser = undefined;
        $scope.main.selectedPhotoFile = undefined;

        $rootScope.$on( "$routeChangeStart", function(event, next, current) {
            if ($scope.main.loggedInUser === undefined) {
                // no logged user, redirect to /login-register unless already there
                // This part is used to hold the session
                var requestBody = {login_name:"session"};
                $http.post('/admin/login', JSON.stringify(requestBody)).then(function successCallback(response) {
                    if (response){
                        $scope.main.loggedInUser = response.data;
                        $location.path("/users/" + $scope.main.loggedInUser._id);
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
        $scope.main.showAdvanced = function() {
            $mdDialog.show({
                controller: 'DialogController',
                scope: $scope.$new(),
                templateUrl: 'components/dialog/dialogTemplate.html',
                parent: angular.element(document.body)
            }).then(function(trusted_users) {
                    var restricted = true;
                    $scope.main.uploadPhoto(restricted, trusted_users);
                }, function() {
                    var restricted = false;
                    var trusted_users = [];
                    $scope.main.uploadPhoto(restricted, trusted_users);
                });
        };




        //Called on file selection - we simply save a reference to the file in selectedPhotoFile
        $scope.main.inputFileNameChanged = function (element) {
            $scope.main.selectedPhotoFile = element.files[0];
            $scope.main.uploadPhoto();
            //$scope.main.showAdvanced();
        };

        $scope.main.inputFileNameSelected = function () {
            return !!$scope.main.selectedPhotoFile;
        };

        // Upload the photo file selected by the user using a post request to the URL /photos/new
        $scope.main.uploadPhoto = function () {
            if (!$scope.main.inputFileNameSelected()) {
                console.error("uploadPhoto called will no selected file");
                return;
            }
            console.log('fileSubmitted', $scope.main.selectedPhotoFile);

            var domForm = new FormData();
            domForm.append('uploadedphoto', $scope.main.selectedPhotoFile);

            // Using $http to POST the form
            $http.post('/photos/new', domForm, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).then(function successCallback(response){
                $rootScope.$broadcast("photoUploaded");
                $location.path("/photos/" + $scope.main.loggedInUser._id);
                console.log(response);
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
