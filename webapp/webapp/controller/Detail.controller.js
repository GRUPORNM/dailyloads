sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/library"
], function (BaseController, JSONModel, formatter, mobileLibrary) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return BaseController.extend("dailyloads.controller.Detail", {

        formatter: formatter,

        onInit: function () {
            var oViewModel = new JSONModel({
                busy: false,
                delay: 0,
                lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading"),
                lanes: []
            });

            this.setModel(oViewModel, "detailView");
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
        },

        onLadesLoad: function (sObjectPath) {
            var oModel = this.getModel();
            var oObject = this.getView().getModel().getObject(sObjectPath);

            var dateProperties = ['dtdis', 'dareg', 'dalbg', 'dalen', 'dtabf', 'datbg', 'daten'];

            var formattedDates = {};

            dateProperties.forEach(function (prop) {
                var dateValue = oObject[prop];

                formattedDates[prop] = "";

                if (dateValue instanceof Date) {
                    formattedDates[prop] = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd.MM.yyyy" }).format(dateValue);
                }
            });

            if (oObject) {
                var aLanes = [
                    {
                        "id": "0",
                        "icon": "sap-icon://accelerated",
                        "label": this.getResourceBundle().getText("planning") + formattedDates.dtdis,
                        "position": 0,
                        "state": [
                            {
                                "state": "",
                                "value": 10
                            }
                        ]
                    },
                    {
                        "id": "1",
                        "icon": "sap-icon://order-status",
                        "label": this.getResourceBundle().getText("registration") + formattedDates.dareg,
                        "position": 1,
                        "state": [
                            {
                                "state": "",
                                "value": 20
                            }
                        ]
                    },
                    {
                        "id": "2",
                        "icon": "sap-icon://sap-box",
                        "label": this.getResourceBundle().getText("startloading") + formattedDates.dalbg,
                        "position": 2,
                        "state": [
                            {
                                "state": "",
                                "value": 35
                            }
                        ]
                    },
                    {
                        "id": "3",
                        "icon": "sap-icon://sap-box",
                        "label": this.getResourceBundle().getText("endloading") + formattedDates.dalen,
                        "position": 3,
                        "state": [
                            {
                                "state": "",
                                "value": 45
                            }
                        ]
                    },
                    {
                        "id": "4",
                        "icon": "sap-icon://monitor-payments",
                        "label": this.getResourceBundle().getText("procedure") + formattedDates.dtabf,
                        "position": 4,
                        "state": [
                            {
                                "state": "",
                                "value": 55
                            }
                        ]
                    },
                    {
                        "id": "5",
                        "icon": "sap-icon://shipping-status",
                        "label": this.getResourceBundle().getText("starttransportation") + formattedDates.datbg,
                        "position": 5,
                        "state": [
                            {
                                "state": "",
                                "value": 65
                            }
                        ]
                    },
                    {
                        "id": "6",
                        "icon": "sap-icon://shipping-status",
                        "label": this.getResourceBundle().getText("endtransportation") + formattedDates.daten,
                        "position": 6,
                        "state": [
                            {
                                "state": "",
                                "value": 75
                            }
                        ]
                    },
                ];

                var oSttrg = oObject.sttrg;
                if (oSttrg < 0) {
                    aLanes.forEach(oLane => {
                        oLane.state[0].state = "Critical";
                    });
                }
                else if (oSttrg == '7') {
                    aLanes.forEach(oLane => {
                        oLane.state[0].state = "Positive";
                    });
                }
                else if (oSttrg != '7') {
                    for (let i = 0; i <= oSttrg; i++) {
                        aLanes[i].state[0].state = "Positive";
                    }

                    for (let l = oSttrg; l <= aLanes.length - 1; l++) {
                        aLanes[l].state[0].state = "Critical";
                    }
                } else {
                    aLanes.forEach(oLane => {
                        oLane.state[0].state = "Neutral";
                    });
                }

                var oViewModel = this.getModel("detailView");

                oViewModel.setProperty("/lanes", aLanes);

                var lanes = this.getModel("detailView").getProperty("/lanes"),
                    foundPositive = false,
                    canEdit = true;

                for (var i = 1; i < lanes.length; i++) {
                    if (lanes[i].state[0].state === 'Positive') {
                        foundPositive = true;
                        canEdit = false;
                        break;
                    }
                }

                oViewModel.updateBindings();
            }
        },

        onSendEmailPress: function () {
            var oViewModel = this.getModel("detailView");

            URLHelper.triggerEmail(
                null,
                oViewModel.getProperty("/shareSendEmailSubject"),
                oViewModel.getProperty("/shareSendEmailMessage")
            );
        },

        onListUpdateFinished: function (oEvent) {
            var sTitle,
                iTotalItems = oEvent.getParameter("total"),
                oViewModel = this.getModel("detailView");

            if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
                if (iTotalItems) {
                    sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
                } else {
                    sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
                }
                oViewModel.setProperty("/lineItemListTitle", sTitle);
            }
        },

        _onObjectMatched: function (oEvent) {
            var sObjectId = oEvent.getParameter("arguments").objectId;
            this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
            this.getModel().metadataLoaded().then(function () {
                var sObjectPath = this.getModel().createKey("xTQAxDAILY_LOADS_DD", {
                    load_order: sObjectId
                });
                this._bindView("/" + sObjectPath);
            }.bind(this));
        },

        _bindView: function (sObjectPath, bForceRefresh) {
            var that = this;
            var oViewModel = this.getModel("detailView");
            that.onLadesLoad(sObjectPath);

            oViewModel.setProperty("/busy", false);

            this.getView().bindElement({
                path: sObjectPath,
                events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                        oViewModel.setProperty("/busy", true);
                    },
                    dataReceived: function () {
                        oViewModel.setProperty("/busy", false);
                    }
                }
            });

            if (bForceRefresh || !this.getView().getModel().getProperty("/" + sObjectPath)) {
                this.getView().getModel().refresh();
            }
        },

        _onBindingChange: function () {
            var oView = this.getView(),
                oElementBinding = oView.getElementBinding();

            if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("detailObjectNotFound");
                this.getOwnerComponent().oListSelector.clearMasterListSelection();
                return;
            }

            var sPath = oElementBinding.getPath(),
                oResourceBundle = this.getResourceBundle(),
                oObject = oView.getModel().getObject(sPath),
                sObjectId = oObject.load_order,
                sObjectName = oObject.vsartxt,
                oViewModel = this.getModel("detailView");

            this.getOwnerComponent().oListSelector.selectAListItem(sPath);

            oViewModel.setProperty("/shareSendEmailSubject",
                oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
            oViewModel.setProperty("/shareSendEmailMessage",
                oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
        },

        _onMetadataLoaded: function () {
            var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
                oViewModel = this.getModel("detailView"),
                oLineItemTable = this.byId("lineItemsList"),
                iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

            oViewModel.setProperty("/delay", 0);
            oViewModel.setProperty("/lineItemTableDelay", 0);

            oLineItemTable.attachEventOnce("updateFinished", function () {
                oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
            });

            oViewModel.setProperty("/busy", true);
            oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
        },

        onCloseDetailPress: function () {
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
            this.getOwnerComponent().oListSelector.clearMasterListSelection();
            this.getRouter().navTo("list");
        },

        toggleFullScreen: function () {
            var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
            if (!bFullScreen) {
                this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
                this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
            } else {
                this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
            }
        },

        onPressGetLoad: function () {
            var that = this;

            new sap.m.MessageBox.warning(this.getResourceBundle().getText("confirmText"), {
                title: this.getResourceBundle().getText("confirmTitle"),
                actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                emphasizedAction: sap.m.MessageBox.Action.OK,
                onClose: function (oAction) {
                    if (oAction === sap.m.MessageBox.Action.OK) {
                        that.updateState();
                    }
                }
            });
        },

        updateState: function () {
            var oEntry = {};
            var sPath = this.getView().getBindingContext().getPath(),
                oLoad = this.getModel().getObject(sPath),
                oURLParams = new URLSearchParams(window.location.search),
                oToken = oURLParams.get('token');

            oEntry.codinstalacao = oLoad.codinstalacao;

            this.onUpdate(sPath, oEntry, oToken);
        }
    });
});