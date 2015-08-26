angular.module(PKG.name + '.feature.adapters')
  .controller('RightPanelController', function(EventPipe, CanvasFactory, MyPlumbService, $scope, $timeout, $bootstrapModal, ModalConfirm, $alert, $state) {
    this.canvasOperations = [
      {
        name: 'Settings',
        icon: 'fa fa-sliders'
      },
      {
        name: 'Publish',
        icon: 'fa fa-cloud-upload'
      },
      {
        name: 'Save Draft',
        icon: 'fa fa-save'
      },
      {
        name: 'Config',
        icon: 'fa fa-eye'
      },
      {
        name: 'Export',
        icon: 'fa fa-download'
      },
      {
        name: 'Import',
        icon: 'fa fa-upload'
      }
    ];

    this.onRightSideGroupItemClicked = function(group) {
      EventPipe.emit('popovers.close');
      var config;
      switch(group.name) {
        case 'Export':
          CanvasFactory
            .exportAdapter(
              MyPlumbService.getConfigForBackend(),
              MyPlumbService.metadata.name,
              MyPlumbService.nodes,
              MyPlumbService.connections)
            .then(
              function success(result) {
                this.exportFileName = result.name;
                this.url = result.url;
                $scope.$on('$destroy', function () {
                  URL.revokeObjectURL(this.url);
                }.bind(this));
                // Clicking on the hidden download button. #hack.
                $timeout(function() {
                  document.getElementById('adapter-export-config-link').click();
                });
              }.bind(this),
              function error() {
                console.log('ERROR: ' + 'exporting adapter failed');
              }
            );
          break;
        case 'Import':
          // Clicking on the hidden upload button. #hack.
          $timeout(function() {
            document.getElementById('adapter-import-config-link').click();
          });
          break;
        case 'Config':
          config = angular.copy(MyPlumbService.getConfigForBackend());
          $bootstrapModal.open({
            templateUrl: '/assets/features/adapters/templates/create/viewconfig.html',
            size: 'lg',
            windowClass: 'adapter-modal',
            keyboard: true,
            controller: ['$scope', 'config', function($scope, config) {
              $scope.config = JSON.stringify(config);
            }],
            resolve: {
              config: function() {
                return config;
              }
            }
          });
          break;
        case 'Publish':
          MyPlumbService
            .save()
            .then(
              function sucess(adapter) {
                $alert({
                  type: 'success',
                  content: adapter + ' successfully published.'
                });
                $state.go('apps.list');
              },
              function error(errorObj) {
                console.info('ERROR!: ', errorObj);
              }.bind(this)
            );
          break;
        case 'Settings':

          MyPlumbService.isConfigTouched = true;
          $bootstrapModal.open({
            templateUrl: '/assets/features/adapters/templates/create/settings.html',
            size: 'lg',
            windowClass: 'adapter-modal',
            keyboard: true,
            controller: ['$scope', 'metadata', 'EventPipe', function($scope, metadata, EventPipe) {
              $scope.metadata = metadata;
              var metadataCopy = angular.copy(metadata);
              $scope.reset = function() {
                $scope.metadata.template.schedule.cron = metadataCopy.template.schedule.cron;
                $scope.metadata.template.instance = metadataCopy.template.instance;
                EventPipe.emit('plugin.reset');
              };

              function closeFn() {
                $scope.reset();
                $scope.$close('cancel');
              }

              ModalConfirm.confirmModalAdapter(
                $scope,
                $scope.metadata,
                metadataCopy,
                closeFn
              );

            }],
            resolve: {
              'metadata': function() {
                return MyPlumbService.metadata;
              }
            }
          });
          break;
        case 'Save Draft':
          MyPlumbService
            .saveAsDraft()
            .then(
              function success() {
                $alert({
                  type: 'success',
                  content: MyPlumbService.metadata.name + ' successfully saved as draft.'
                });
                $state.go('adapters.list');
              },
              function error() {
                console.info('Failed saving as draft');
              }
            );
      }
    };

    this.onImportSuccess = function(result) {
      EventPipe.emit('popovers.reset');
      $scope.config = JSON.stringify(result);
      this.reloadDAG = true;
      MyPlumbService.resetToDefaults(true);
      MyPlumbService.setNodesAndConnectionsFromDraft(result);
      if ($scope.config.name) {
        MyPlumbService.metadata.name = $scope.config.name;
      }

      MyPlumbService.notifyError({});
      MyPlumbService.notifyResetListners();
    };

    this.importFile = function(files) {
      CanvasFactory
        .importAdapter(files, MyPlumbService.metadata.template.type)
        .then(
          this.onImportSuccess.bind(this),
          function error(errorEvent) {
            console.error('Upload config failed', errorEvent);
          }
        );
    };



  });
