'use strict';

cs142App.controller('favoriteController', ['$scope','$resource','$http','$mdDialog',
    function ($scope,$resource,$http,$mdDialog) {
        $scope.main.title = 'Favorite';
        $scope.favorite = {};
        $http.post('/getFavorite',"").then(function (response) {
            $scope.favorite.list = response.data;
            console.log($scope.favorite.list);
        });

        $scope.favorite.showDetail = function (photo) {
            $mdDialog.show({
                controller: 'favoritePhotoController',
                templateUrl: 'components/favorite/favoritePhotoTemplate.html',
                parent: angular.element(document.body),
                // targetEvent: ev,
                clickOutsideToClose:true,
                locals:{
                    photo:photo
                }
            }).then(function(answer) {}, function() {});
        }
    }]);