sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History"
], function (Controller, History) {
    "use strict";

    var TQAModel;

    return Controller.extend("dailyloads.controller.BaseController", {
        getModelTQA: function () {
            return TQAModel;
        },

        setModelTQA: function (token) {
            var userLanguage = sessionStorage.getItem("oLangu");
            if (!userLanguage) {
                userLanguage = "EN";
            }
            var serviceUrlWithLanguage = this.getModel().sServiceUrl + (this.getModel().sServiceUrl.includes("?") ? "&" : "?") + "sap-language=" + userLanguage;

            TQAModel = new sap.ui.model.odata.v2.ODataModel({
                serviceUrl: serviceUrlWithLanguage,
                annotationURI: "/sap/opu/odata/tqa/DAILY_LOADS_SRV/",
                headers: {
                    "authorization": token,
                    "applicationName": "DAILY_LOADS"
                }
            });
            var vModel = new sap.ui.model.odata.v2.ODataModel({
                serviceUrl: "/sap/opu/odata/TQA/OD_VARIANTS_MANAGEMENT_SRV",
                headers: {
                    "authorization": token,
                    "applicationName": "DAILY_LOADS"
                }
            });
            this.setModel(vModel, "vModel");
            this.setModel(TQAModel);
        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        onNavBack: function () {
            sessionStorage.setItem("goToLaunchpad", "X");
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                history.go(-1);
            } else {
                this.getRouter().navTo("list", {}, true);
            }
        },


        onNavigation: function (sPath, oRoute, oEntityName) {
            if (sPath) {
                this.getRouter().navTo(oRoute, {
                    objectId: sPath.replace(oEntityName, "")
                }, false, true);
            } else {
                this.getRouter().navTo(oRoute, {}, false, true);
            }
        },

        onObjectMatched: function (oEvent) {
            this.getUserAuthentication();
            this.onBindView("/" + oEvent.getParameter("config").pattern.replace("/{objectId}", "") + oEvent.getParameter("arguments").objectId);
        },

        onBindView: function (sObjectPath) {
            this.getView().bindElement({
                path: sObjectPath,
                change: this.onBindingChange.bind(this),
                events: {
                    dataRequested: function () {
                        this.getModel("appView").setProperty("/busy", true);
                    }.bind(this),
                    dataReceived: function () {
                        this.getModel("appView").setProperty("/busy", false);
                    }.bind(this)
                }
            });
        },

        onBindingChange: function () {
            var oView = this.getView(),
                oElementBinding = oView.getElementBinding();

            if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("notFound");

                return;
            }
        },

        onManageButtonsState: function (aButtons) {
            if (aButtons.length > 0) {

                aButtons.forEach(oButton => {
                    this.byId(oButton.id).setVisible(oButton.visible);
                });

            }
        },

        onManageContainerFieldsState: function (oContainer, sState) {
            this.byId(oContainer).getContent().forEach(oField => {

                if (oField instanceof sap.m.Input || oField instanceof sap.m.Select || oField instanceof sap.m.DatePicker) {
                    oField.setEnabled(sState);
                    oField.setValueState("None")
                }

            });
        },

        onSetContainerFieldsValues: function (oContainer) {
            var sPath = this.getView().getBindingContext().getPath(),
                oObject = this.getModel().getObject(sPath);

            if (sPath) {
                this.byId(oContainer).getContent().forEach(oField => {

                    if (oField instanceof sap.m.Input) {
                        oField.setValue(oObject[oField.getName()]);
                    }
                    else if (oField instanceof sap.m.Select) {
                        oField.setSelectedKey(oObject[oField.getName()]);
                    }
                    else if (oField instanceof sap.m.DatePicker) {
                        oField.setDateValue(oObject[oField.getName()]);
                    }

                });

                return true;
            } else {
                return false;
            }
        },

        getUserAuthentication: function (type) {
            var that = this,
                urlParams = new URLSearchParams(window.location.search),
                token = urlParams.get('token');

            if (token != null) {
                var headers = new Headers();
                headers.append("X-authorization", token);

                var requestOptions = {
                    method: 'GET',
                    headers: headers,
                    redirect: 'follow'
                };

                fetch("/sap/opu/odata/TQA/AUTHENTICATOR_SRV/USER_AUTHENTICATION", requestOptions)
                    .then(function (response) {
                        if (!response.ok) {
                            throw new Error("Ocorreu um erro ao ler a entidade.");
                        }
                        return response.text();
                    })
                    .then(function (xml) {
                        var parser = new DOMParser(),
                            xmlDoc = parser.parseFromString(xml, "text/xml"),
                            successResponseElement = xmlDoc.getElementsByTagName("d:SuccessResponse")[0],
                            response = successResponseElement.textContent;

                        if (response != 'X') {
                            that.getRouter().navTo("NotFound");
                        }
                        else {
                            that.getModel("appView").setProperty("/token", token);
                        }
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
            } else {
                that.getRouter().navTo("NotFound");
                return;
            }
        }
    });

});