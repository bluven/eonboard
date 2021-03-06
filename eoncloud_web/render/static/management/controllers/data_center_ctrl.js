/**
 * Created with PyCharm.
 * User: bluven
 * Date: 15-6-29
 * Time: 下午2:11
 * To change this template use File | Settings | File Templates.
 **/

CloudApp.controller('DataCenterController',
    function($rootScope, $scope, $filter, $modal, $i18next,
             CommonHttpService, ToastrService, ngTableParams,
            DataCenter, CheckboxGroup, ngTableHelper){

        $scope.$on('$viewContentLoaded', function(){
                Metronic.initAjax();
        });

        $rootScope.settings.layout.pageBodySolid = true;
        $rootScope.settings.layout.pageSidebarClosed = false;

        $scope.data_centers = [];
        var checkboxGroup = $scope.checkboxGroup = CheckboxGroup.init($scope.data_centers);

        $scope.data_center_table = new ngTableParams({
                page: 1,
                count: 10
            },{
                counts: [],
                getData: function ($defer, params) {
                    DataCenter.query(function (data) {
                        $scope.data_centers = ngTableHelper.paginate(data, $defer, params);
                        checkboxGroup.syncObjects($scope.data_centers);
                    });
                }
            });

        $scope.edit = $scope.create = function(data_center){

            data_center = data_center || {};

            $modal.open({
                templateUrl: 'create.html',
                controller: 'DataCenterCreateController',
                backdrop: "static",
                size: 'lg',
                resolve: {
                    data_center_table: function () {
                        return $scope.data_center_table;
                    },
                    data_center: function(){return data_center;}
                }
            });
        };

        var deleteDataCenters = function(ids){

            bootbox.confirm($i18next("data_center.confirm_delete"), function (confirmed) {

                if(!confirmed){
                    return;
                }

                if(typeof ids == 'function'){
                    ids = ids();
                }

                CommonHttpService.post("/api/data-centers/batch-delete/", {ids: ids})
                    .then(function(data){
                        if (data.success) {
                            ToastrService.success(data.msg, $i18next("success"));
                            $scope.data_center_table.reload();
                            checkboxGroup.uncheck();
                        } else {
                            ToastrService.error(data.msg, $i18next("op_failed"));
                        }
                    });
            });
        };

        $scope.batchDelete = function(){

            deleteDataCenters(function(){
                var ids = [];

                checkboxGroup.forEachChecked(function(data_center){

                    if(data_center.checked){
                        ids.push(data_center.id);
                    }
                });

                return ids;
            });
        };

        $scope.delete = function(data_center){
            deleteDataCenters([data_center.id]);
        };
    })
    .controller('DataCenterCreateController',
        function($rootScope, $scope, $modalInstance,
                 data_center_table, data_center, DataCenterForm,
                 $i18next, CommonHttpService, ResourceTool, ToastrService){

            $scope.data_center = ResourceTool.copy_only_data(data_center);

            $modalInstance.rendered.then(DataCenterForm.init);

            $scope.cancel = function () {
                $modalInstance.dismiss();
            };

            $scope.submit = function(data_center){

                if(!$("#dataCenterForm").validate().form()){
                    return;
                }

                var url = '/api/data-centers';

                if(data_center.id){
                    url += "/update/";
                } else {
                    url += "/create/";
                }

                CommonHttpService.post(url, data_center).then(function(data){
                    if (data.success) {
                        ToastrService.success(data.msg, $i18next("success"));
                        data_center_table.reload();
                        $modalInstance.dismiss();
                    } else {
                        ToastrService.error(data.msg, $i18next("op_failed"));
                    }
                });
            };
        }
    ).factory('DataCenterForm', ['ValidationTool', '$i18next', function(ValidationTool, $i18next) {
        return {
            init: function(){

                var config = {
                    rules: {
                        name: {
                            minlength: 2,
                            maxlength: 128,
                            required: true
                        },
                        host: {
                            required: true,
                            ip: true,
                            remote: {
                                url: "/api/data-centers/is-host-unique",
                                data: {
                                    id: $("#id").val()
                                },
                                async: false
                            }
                        },
                        project: {
                            required: true,
                            minlength: 2,
                            maxlength: 128
                        },
                        user: {
                            required: true,
                            minlength: 2,
                            maxlength: 128
                        },
                        password: {
                            required: true,
                            minlength: 2,
                            maxlength: 50
                        },
                        auth_url: {
                            required: true,
                            url: true
                        },
                        ext_net: {
                            required: true,
                            minlength: 2,
                            maxlength: 128
                        }
                    },
                    messages: {
                        host: {
                            remote: $i18next('data_center.host_is_used')
                        }
                    }
                };

                ValidationTool.init('#dataCenterForm', config);
              }
            }
        }]
    );
