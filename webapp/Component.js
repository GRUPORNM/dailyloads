sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "./model/models",
    "./controller/ListSelector",
    "./controller/ErrorHandler"
],
    function (UIComponent, Device, models, ListSelector, ErrorHandler) {
        "use strict";

        return UIComponent.extend("dailyloads.Component", {
            metadata: {
                manifest: "json"
            },

            init: function () {
                this.oListSelector = new ListSelector();
                this._oErrorHandler = new ErrorHandler(this);

                this.setModel(models.createDeviceModel(), "device");

                UIComponent.prototype.init.apply(this, arguments);

                this.getRouter().initialize();
            },

            destroy: function () {
                this.oListSelector.destroy();
                this._oErrorHandler.destroy();
                UIComponent.prototype.destroy.apply(this, arguments);
            },

            getContentDensityClass: function () {
                if (this._sContentDensityClass === undefined) {
                    if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
                        this._sContentDensityClass = "";
                    } else if (!Device.support.touch) {
                        this._sContentDensityClass = "sapUiSizeCompact";
                    } else {
                        this._sContentDensityClass = "sapUiSizeCozy";
                    }
                }
                return this._sContentDensityClass;
            },

            // handleF5Pressed: function (event) {
            //     if (event.which === 116 || (event.ctrlKey && event.which === 82)) {
            //         event.preventDefault();
            //         window.parent.postMessage("reloadIframe", "*");
            //     }
            // }
        });
    });