sap.ui.define([
    "sap/ui/base/Object",
    "sap/base/Log"
], function (BaseObject, Log) {
    "use strict";

    return BaseObject.extend("dailyloads.controller.ListSelector", {
        constructor : function () {
            this._oWhenListHasBeenSet = new Promise(function (fnResolveListHasBeenSet) {
                this._fnResolveListHasBeenSet = fnResolveListHasBeenSet;
            }.bind(this));
            this.oWhenListLoadingIsDone = new Promise(function (fnResolve, fnReject) {
                this._oWhenListHasBeenSet
                    .then(function (oList) {
                        oList.getBinding("items").attachEventOnce("dataReceived",
                            function () {
                                if (this._oList.getItems().length) {
                                    fnResolve({
                                        list : oList
                                    });
                                } else {
                                    fnReject({
                                        list : oList
                                    });
                                }
                            }.bind(this)
                        );
                    }.bind(this));
            }.bind(this));
        },

        setBoundList : function (oList) {
            this._oList = oList;
            this._fnResolveListHasBeenSet(oList);
        },

        selectAListItem : function (sBindingPath) {

            this.oWhenListLoadingIsDone.then(
                function () {
                    var oList = this._oList,
                        oSelectedItem;

                    if (oList.getMode() === "None") {
                        return;
                    }

                    oSelectedItem = oList.getSelectedItem();

                    if (oSelectedItem && oSelectedItem.getBindingContext().getPath() === sBindingPath) {
                        return;
                    }

                    oList.getItems().some(function (oItem) {
                        if (oItem.getBindingContext() && oItem.getBindingContext().getPath() === sBindingPath) {
                            oList.setSelectedItem(oItem);
                            return true;
                        }
                    });
                }.bind(this),
                function () {
                    Log.warning("Could not select the list item with the path" + sBindingPath + " because the list encountered an error or had no items");
                }
            );
        },

        clearMasterListSelection : function () {
            this._oWhenListHasBeenSet.then(function () {
                this._oList.removeSelections(true);
            }.bind(this));
        }
    });
});