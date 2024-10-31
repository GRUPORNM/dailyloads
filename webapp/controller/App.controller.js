sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("dailyloads.controller.App", {

        onInit: function () {
            var oViewModel,
                fnSetAppNotBusy,
                iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

            oViewModel = new JSONModel({
                busy: true,
                delay: 0,
                layout: "OneColumn",
                previousLayout: "",
                actionButtonsInfo: {
                    midColumn: {
                        fullScreen: false
                    }
                }
            });

            this.setModel(oViewModel, "appView");

            var urlParams = new URLSearchParams(window.location.search);
            var token = urlParams.get('token');
            this.setModelTQA(token);
            if (!sessionStorage.getItem("oLangu"))
                sap.ui.getCore().getConfiguration().setLanguage("EN");
            else {
                sap.ui.getCore().getConfiguration().setLanguage(sessionStorage.getItem("oLangu"));
            }

            fnSetAppNotBusy = function () {
                oViewModel.setProperty("/busy", false);
                oViewModel.setProperty("/delay", iOriginalBusyDelay);
            };
            this.getOwnerComponent().getModel().metadataLoaded().then(fnSetAppNotBusy);
            this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);

            this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
        }

    });
});