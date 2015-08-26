angular.module(PKG.name + '.feature.adapters')
  .controller('LeftPanelController', function($q, myAdapterApi, MyPlumbService, MyPlumbFactory, myAdapterTemplatesApi, CanvasFactory, $alert, mySettings, $state) {
    var sourceTemplates = [],
        transformTemplates = [],
        sinkTemplates = [];
    this.pluginTypes = [
      {
        name: 'source',
        icon: 'icon-ETLsources'
      },
      {
        name: 'transform',
        icon: 'icon-ETLtransforms'
      },
      {
        name: 'sink',
        icon: 'icon-ETLsinks'
      },
      {
        name: 'templates',
        icon: 'icon-ETLtemplates'
      }
    ];

    this.plugins= {
      items: []
    };

    this.onLeftSideGroupItemClicked = function(group) {
      var prom;
      var templatedefer = $q.defer();
      var savedTemplates;
      var params = { adapterType: MyPlumbService.metadata.template.type };
      switch(group.name) {
        case 'source':
          prom = myAdapterApi.fetchSources(params).$promise;
          savedTemplates = sourceTemplates;
          break;
        case 'transform':
          prom = myAdapterApi.fetchTransforms(params).$promise;
          savedTemplates = transformTemplates;
          break;
        case 'sink':
          prom = myAdapterApi.fetchSinks(params).$promise;
          savedTemplates = sinkTemplates;
          break;
        case 'templates':
          prom = myAdapterTemplatesApi.list({
              apptype: MyPlumbService.metadata.template.type
            })
              .$promise
              .then(function(res) {
                var plugins = res.map(function(plugin) {
                  return {
                    name: plugin.name,
                    description: plugin.description,
                    icon: 'icon-ETLtemplates'
                  };
                });
                templatedefer.resolve(plugins);
                return templatedefer.promise;
              });
      }
      prom.then(function(res) {
        this.plugins.items = [];
        res.forEach(function(plugin) {
          this.plugins.items.push(
            angular.extend(
              {
                type: group.name,
                icon: MyPlumbFactory.getIcon(plugin.name)
              },
              plugin
            )
          );
        }.bind(this));

        if (group.name !== 'templates') {
          this.plugins.items = this.plugins.items.concat(savedTemplates);
        }

      }.bind(this));
    };

    this.onLeftSidePanelItemClicked = function(event, item) {
      if (item.type === 'source' && this.pluginTypes[0].error) {
        delete this.pluginTypes[0].error;
      } else if (item.type === 'sink' && this.pluginTypes[2].error) {
        delete this.pluginTypes[2].error;
      } else if (item.type === 'templates') {
        myAdapterTemplatesApi.get({
          apptype: MyPlumbService.metadata.template.type,
          appname: item.name
        })
          .$promise
          .then(function(res) {
            var result = CanvasFactory.parseImportedJson(
              JSON.stringify(res),
              MyPlumbService.metadata.template.type
            );
            if (result.error) {
              $alert({
                type: 'danger',
                content: 'Imported pre-defined app has issues. Please check the JSON of the imported pre-defined app'
              });
            } else {
              this.onImportSuccess(result);
            }
          }.bind(this));
        return;
      }

      // TODO: Better UUID?
      var id = item.name + '-' + item.type + '-' + Date.now();
      event.stopPropagation();

      var config;

      if (item.pluginTemplate) {
        config = {
          id: id,
          name: item.pluginName,
          icon: MyPlumbFactory.getIcon(item.pluginName),
          type: item.pluginType,
          properties: item.properties,
          outputSchema: item.outputSchema,
          pluginTemplate: item.pluginTemplate,
          lock: item.lock
        };
      } else {
        config = {
          id: id,
          name: item.name,
          icon: item.icon,
          description: item.description,
          type: item.type
        };
      }

      MyPlumbService.addNodes(config, config.type, true);
    };

    function objectToArray(obj) {
      var arr = [];

      angular.forEach(obj, function (val) {
        if (val.templateType === MyPlumbService.metadata.template.type) {
          val.icon = 'fa-plug';
          val.name = val.pluginTemplate;

          arr.push(val);
        }
      });

      return arr;
    }

    mySettings.get('pluginTemplates')
      .then(function (res) {
        if (!angular.isObject(res)) {
          return;
        }

        var templates = res[$state.params.namespace][MyPlumbService.metadata.template.type];

        if (templates) {
          sourceTemplates = objectToArray(templates.source);
          transformTemplates = objectToArray(templates.transform);
          sinkTemplates = objectToArray(templates.sink);
        }
      });
  });
