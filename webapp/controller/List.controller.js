sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/Sorter",
    "sap/ui/model/FilterOperator",
    "sap/m/GroupHeaderListItem",
    "sap/ui/Device",
    "sap/ui/core/Fragment",
    "../model/formatter"
], function (BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, formatter) {
    "use strict";

    return BaseController.extend("dailyloads.controller.List", {

        formatter: formatter,

        onInit: function () {
            var oList = this.byId("list"),
                oViewModel = this._createViewModel(),
                iOriginalBusyDelay = oList.getBusyIndicatorDelay();


            this._oList = oList;
            this._oListFilterState = {
                aFilter: [],
                aSearch: []
            };

            this.setModel(oViewModel, "listView");
            oList.attachEventOnce("updateFinished", function () {
                oViewModel.setProperty("/delay", iOriginalBusyDelay);
            });

            this.getView().addEventDelegate({
                onBeforeFirstShow: function () {
                    this.getOwnerComponent().oListSelector.setBoundList(oList);
                }.bind(this)
            });

            this.getRouter().attachRouteMatched(this.getUserAuthentication, this);
            this.getRouter().getRoute("list").attachPatternMatched(this._onMasterMatched, this);
            this.getRouter().attachBypassed(this.onBypassed, this);
        },

        onAfterRendering: function () {
            sessionStorage.setItem("goToLaunchpad", "X");
            var oStartDate = new Date();
            oStartDate.setHours(1, 0, 0, 0);

            var oEndDate = new Date();
            oEndDate.setHours(23, 59, 59, 0);

            var oList = this.getView().byId("list");
            var oDateFilter = new Filter("dataprevistacarregamento", FilterOperator.BT, oStartDate, oEndDate);

            oList.getBinding("items").filter([oDateFilter]);

            if (sessionStorage.getItem("selectedTheme").indexOf("dark") !== -1) {
                jQuery(".sapUiBlockLayer, .sapUiLocalBusyIndicator").css("background-color", "rgba(28,34,40,0.99)");
            } else {
                jQuery(".sapUiBlockLayer, .sapUiLocalBusyIndicator").css("background-color", "rgba(255, 255, 255, 0.99)");
            }
        },

        onUpdateFinished: function (oEvent) {
            this._updateListItemCount(oEvent.getParameter("total"));
        },

        onSearch: function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {
                this.onRefresh();
                return;
            }

            var sQuery = oEvent.getParameter("query");

            if (sQuery) {
                this._oListFilterState.aSearch = [new Filter("vsartxt", FilterOperator.Contains, sQuery)];
            } else {
                this._oListFilterState.aSearch = [];
            }
            this._applyFilterSearch();

        },

        onRefresh: function () {
            this._oList.getBinding("items").refresh();
        },

        onOpenViewSettings: function (oEvent) {
            var sDialogTab = "filter";
            if (oEvent.getSource() instanceof sap.m.Button) {
                var sButtonId = oEvent.getSource().getId();
                if (sButtonId.match("sort")) {
                    sDialogTab = "sort";
                } else if (sButtonId.match("group")) {
                    sDialogTab = "group";
                }
            }
            if (!this.byId("viewSettingsDialog")) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "dailyloads.view.ViewSettingsDialog",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
                    oDialog.open(sDialogTab);
                }.bind(this));
            } else {
                this.byId("viewSettingsDialog").open(sDialogTab);
            }
        },

        onConfirmViewSettingsDialog: function (oEvent) {

            this._applySortGroup(oEvent);
        },

        _applySortGroup: function (oEvent) {
            var mParams = oEvent.getParameters(),
                sPath,
                bDescending,
                aSorters = [];

            sPath = mParams.sortItem.getKey();
            bDescending = mParams.sortDescending;
            aSorters.push(new Sorter(sPath, bDescending));
            this._oList.getBinding("items").sort(aSorters);
        },

        onSelectionChange: function (oEvent) {
            var oList = oEvent.getSource(),
                bSelected = oEvent.getParameter("selected");

            if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
                this.getOwnerComponent().oListSelector.clearMasterListSelection();
                this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
            }
        },

        onBypassed: function () {
            this._oList.removeSelections(true);
        },

        createGroupHeader: function (oGroup) {
            return new GroupHeaderListItem({
                title: oGroup.text,
                upperCase: false
            });
        },

        onNavBack: function () {
            history.go(-1);
        },


        _createViewModel: function () {
            return new JSONModel({
                isFilterBarVisible: false,
                filterBarLabel: "",
                delay: 0,
                title: this.getResourceBundle().getText("listTitleCount", [0]),
                noDataText: this.getResourceBundle().getText("noDataText"),
                sortBy: "vsartxt",
                groupBy: "None"
            });
        },

        _onMasterMatched: function () {
            this.getModel("appView").setProperty("/layout", "OneColumn");
        },

        _showDetail: function (oItem) {
            var bReplace = !Device.system.phone;
            this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
            this.getRouter().navTo("object", {
                objectId: oItem.getBindingContext().getProperty("load_order")
            }, bReplace);
        },

        _updateListItemCount: function (iTotalItems) {
            var sTitle;
            if (this._oList.getBinding("items").isLengthFinal()) {
                sTitle = this.getResourceBundle().getText("listTitleCount", [iTotalItems]);
                this.getModel("listView").setProperty("/title", sTitle);
            }
        },

        _applyFilterSearch: function () {
            var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
                oViewModel = this.getModel("listView");
            this._oList.getBinding("items").filter(aFilters, "Application");
            if (aFilters.length !== 0) {
                oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("listListNoDataWithFilterOrSearchText"));
            } else if (this._oListFilterState.aSearch.length > 0) {
                oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("listListNoDataText"));
            }
        },

        _updateFilterBar: function (sFilterBarText) {
            var oViewModel = this.getModel("listView");
            oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
            oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("listFilterBarText", [sFilterBarText]));
        }

    });

});