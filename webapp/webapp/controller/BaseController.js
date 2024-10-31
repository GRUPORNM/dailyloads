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
                    "applicationName": "NOTIF_OVW"
                }
            });
            var vModel = new sap.ui.model.odata.v2.ODataModel({
                serviceUrl: "/sap/opu/odata/TQA/OD_VARIANTS_MANAGEMENT_SRV",
                headers: {
                    "authorization": token,
                    "applicationName": "NOTIF_OVW"
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

        onValidateEditedFields: function (oContainer, oObject) {
            var oEdited = false;
            this.byId(oContainer).getContent().forEach(oField => {

                if (oField instanceof sap.m.Input) {

                    if (oField.getValue() != oObject[oField.getName()]) {
                        oEdited = true;
                    }

                }
                else if (oField instanceof sap.m.DatePicker) {
                    var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: 'dd.MM.yyyy' });

                    if (oField.getValue() != oDateFormat.format(oObject[oField.getName()])) {
                        oEdited = true;
                    }

                }
                else if (oField instanceof sap.m.Select) {

                    if (oField.getSelectedKey() != oObject[oField.getName()]) {
                        oEdited = true;
                    }

                }

            });

            if (oEdited) {
                return true;
            } else {
                return false;
            }
        },

        onValidateEmail: function () {
            var email = this.getView().byId("usr_email").getValue();

            var mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;

            if (!mailregex.test(email)) {
                this.getView().byId("usr_email").setValueState(sap.ui.core.ValueState.Error);
                this.getView().byId("usr_email").setValueStateText(this.getResourceBundle().getText("emailFormatIncorrect"));

                return false;
            } else {
                this.getView().byId("usr_email").setValueState(sap.ui.core.ValueState.None);
                this.getView().byId("usr_email").setValueStateText(null);

                return true;
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

        // CLEAR MODEL DATA
        onClearModelData: function () {
            try {
                var oDriverData = new sap.ui.model.json.JSONModel({
                    items: []
                });
                this.setModel(oDriverData, "DriverData");

                oData.items = [];
                this.aFields = [];

                return true;
            } catch (error) {
                var oMessage = {
                    oText: error.message,
                    oTitle: this.getResourceBundle().getText("errorMessageBoxTitle")
                }

                this.showErrorMessage(oMessage);
            }
        },

        onClearContainersData: function (aContainers) {
            try {
                aContainers.forEach(oContainer => {
                    var oForm = this.byId(oContainer);

                    oForm.getContent().forEach(oElement => {
                        if (oElement instanceof sap.m.Input || oElement instanceof sap.m.DatePicker) {
                            oElement.setValue(null);
                            oElement.setValueState("None");
                            oElement.setValueStateText(null);
                        }
                    });
                });

                return true;
            } catch (error) {
                var oMessage = {
                    oText: error.message,
                    oTitle: this.getResourceBundle().getText("errorMessageBoxTitle")
                }

                this.showErrorMessage(oMessage);
            }
        },

        // GET ALL FIELDS
        getFields: function (aControl, aContainers, oMainControl) {
            this.aFields = [];

            aContainers.forEach(oContainer => {

                for (let i = 0; i < aControl.length; i++) {

                    if (oMainControl == "Dialog") {
                        var aContainerFields = sap.ui.getCore().byId(oContainer).getContent().filter(function (oControl) {
                            return oControl instanceof aControl[i];
                        });

                        aContainerFields.forEach(oContainerField => {
                            var oField = {
                                id: "",
                                value: ""
                            };

                            oField.id = oContainerField.getName();

                            try {
                                oField.value = oContainerField.getValue()
                            } catch (error) {
                                oField.value = oContainerField.getSelectedKey();
                            }

                            this.aFields.push(oField);
                        });
                    } else {
                        var aContainerFields = this.byId(oContainer).getContent().filter(function (oControl) {
                            return oControl instanceof aControl[i];
                        });

                        aContainerFields.forEach(oContainerField => {
                            var oField = {
                                id: "",
                                value: ""
                            };

                            oField.id = oContainerField.getName();
                            oField.value = oContainerField.getValue()

                            this.aFields.push(oField);
                        });
                    }

                }

            });

            return this.aFields;
        },

        // CHECK EMPTY FIELDS
        checkEmptyFields: function (aControl, aContainers, oMainControl) {
            this.getFields(aControl, aContainers, oMainControl);
            this.checked = true;
            if (this.aFields.length > 0) {

                this.aFields.forEach(oField => {
                    if (oMainControl == "Dialog") {
                        var oControl = sap.ui.getCore().byId(oField.id);
                    } else {
                        var oControl = this.byId(oField.id);
                    }

                    if (oControl) {
                        if (oControl.getProperty("enabled")) {
                            try {
                                if (oControl.sId.includes("usr_email")) {
                                    var oEmailChecked = this.onValidateEmail();

                                    if (!oEmailChecked) {
                                        this.checked = false;
                                    }
                                } else {
                                    if (oControl.getValue() == "") {
                                        oControl.setValueState("Error");
                                        this.checked = false;
                                    } else {
                                        oControl.setValueState("None");
                                    }
                                }
                            } catch (error) {
                                if (oControl.getSelectedKey() == "") {
                                    oControl.setValueState("Error");
                                    this.checked = false;
                                } else {
                                    oControl.setValueState("None");
                                }
                            }
                        }
                    }
                });

                if (this.checked) {
                    return true;
                } else {
                    return false;
                }
            }
        },

        onCheckTableData: function () {
            var oModel = this.getView().getModel("DriverData"),
                oDriverData = oModel.oData.items;


            if (oDriverData.length == 3) {
                return true;
            } else {
                var oMessage = {
                    oTitle: this.getResourceBundle().getText("alertMessageTitle"),
                    oText: this.getResourceBundle().getText("cannotCreateDriver")
                }

                this.showAlertMessage(oMessage, 'C');
            }
        },

        // CREATE DIALOGS
        buildDialogs: function (oDialogInfo, aDialogFields, aDialogButtons) {
            try {
                this.oDialog = new sap.m.Dialog({
                    title: oDialogInfo.oTitle,
                    id: oDialogInfo.oId,
                    afterClose: this.onAfterClose.bind(this)
                });

                if (aDialogFields.length > 0) {

                    this.oDialog.addContent(this.oGrid = new sap.ui.layout.Grid({
                        defaultSpan: "L12 M12 S12",
                        width: "auto"
                    }));

                    this.oGrid.addContent(this.oSimpleForm = new sap.ui.layout.form.SimpleForm({
                        id: oDialogInfo.oId + "SimpleForm",
                        minWidth: 1024,
                        layout: oDialogInfo.oLayout,
                        labelSpanL: 3,
                        labelSpanM: 3,
                        emptySpanL: 4,
                        emptySpanM: 4,
                        columnsL: 2,
                        columnsM: 2,
                        maxContainerCols: 2,
                        editable: false
                    }));

                    aDialogFields.forEach(oField => {
                        switch (oField.oControl) {

                            case sap.m.Input:
                                this.oSimpleForm.addContent(
                                    new sap.m.Label({ text: oField.oLabelText, required: oField.oRequired })
                                )

                                this.oInput = new sap.m.Input({
                                    id: oField.oId,
                                    name: oField.oName,
                                    enabled: oField.oEnabled
                                });

                                if (oField.oSelectedKey != "") {
                                    this.oInput.setSelectedKey(oField.oSelectedKey);
                                } else if (oField.oValue != "") {
                                    this.oInput.setValue(oField.oValue);
                                }

                                this.oSimpleForm.addContent(this.oInput);
                                break;

                            case sap.m.Select:
                                if (oField.oItems != "") {
                                    this.oSimpleForm.addContent(
                                        new sap.m.Label({ text: oField.oLabelText, required: oField.oRequired })
                                    );

                                    this.oSelect = new sap.m.Select({
                                        id: oField.oId,
                                        name: oField.oName,
                                        enabled: oField.oEnabled,
                                        change: this.onSelectChange.bind(this),
                                        forceSelection: oField.oForceSelection,
                                    });

                                    this.oSelect.setModel(this.getModel());

                                    this.oSelect.bindAggregation("items", {
                                        path: oField.oItems,
                                        template: new sap.ui.core.Item({
                                            key: oField.oKey,
                                            text: oField.oText
                                        })
                                    });

                                    if (oField.oSelectedKey != "") {
                                        this.oSelect.setSelectedKey(oField.oSelectedKey);
                                    }

                                    this.oSimpleForm.addContent(this.oSelect);
                                }
                                break;

                            case sap.m.DatePicker:

                                this.oSimpleForm.addContent(
                                    new sap.m.Label({ text: oField.oLabelText })
                                );

                                this.oDatePicker = new sap.m.DatePicker({
                                    id: oField.oId,
                                    name: oField.oName,
                                    value: oField.oValue,
                                    valueFormat: oField.oValueFormat,
                                    required: oField.oRequired,
                                    enabled: oField.oEnabled,
                                    displayFormat: oField.oDisplayFormat,
                                    minDate: oField.oMinDate
                                })


                                if (oField.oValue1 != "") {
                                    this.oDatePicker.setDateValue(new Date(oField.oValue1));
                                }

                                this.oSimpleForm.addContent(this.oDatePicker);
                                break;

                            case sap.ui.unified.FileUploader:

                                this.oSimpleForm.addContent(
                                    new sap.m.Label({ text: oField.oLabelText }),
                                );

                                this.oFileUploader = new sap.ui.unified.FileUploader({
                                    id: oField.oId,
                                    name: oField.oName,
                                    enabled: oField.oEnabled,

                                    width: "100%",
                                    tooltip: oField.oTooltip
                                })

                                if (oField.oValue != "") {
                                    this.oFileUploader.setValue(oField.oValue);
                                }

                                this.oSimpleForm.addContent(this.oFileUploader);

                                break;

                        }
                    });

                    if (aDialogButtons.length > 0) {
                        aDialogButtons.forEach(oButton => {
                            this.oDialog.addButton(
                                new sap.m.Button({
                                    id: oButton.oId,
                                    text: oButton.oText,
                                    type: oButton.oType,
                                    press: oButton.oEvent
                                })
                            );
                        });
                    }

                }

                this.oDialog.open();

            } catch (error) {
                var oMessage = {
                    oText: error.message,
                    oTitle: this.getResourceBundle().getText("errorMessageBoxTitle")
                }

                this.showErrorMessage(oMessage);
            }

        },

        // CLOSE DIALOG
        onCloseDialog: function () {
            this.byId("DriverDocumentationTable").removeSelections();
            this.onEnabledTableButtons(this.byId("DriverDocumentationTable").getSelectedContextPaths().length);

            this.oDialog.close();
        },


        onCloseDialog1: function () {
            this.byId("UserDocumentationTable").removeSelections();
            this.byId("EditUserDocumentationRow").setEnabled(false);

            this.oDialog.close();
        },

        // DESTROY DIALOG
        onAfterClose: function () {
            if (this.oDialog) {
                this.oDialog.destroy();
                this.oDialog = null;
            }
        },

        // ALERT MESSAGE
        showAlertMessage: function (oMessage, pAction) {
            var that = this;

            new sap.m.MessageBox.warning(oMessage.oText, {
                title: oMessage.oTitle,
                actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                emphasizedAction: sap.m.MessageBox.Action.OK,
                onClose: function (oAction) {
                    if (oAction === sap.m.MessageBox.Action.OK) {
                        switch (pAction) {
                            case 'C':

                                break;
                            case 'D':
                                that.onDeleteDriverDocument();
                                break;

                            case 'R':
                                var aContainers = [];
                                aContainers.push("GeneralInfoContainer");

                                var oModelDataCleared = that.onClearModelData(),
                                    oContainerDataCleared = that.onClearContainersData(aContainers);

                                if (oModelDataCleared && oContainerDataCleared) {
                                    that.onNavigation("", "drivers", "");
                                }
                                break;
                        }

                    } else {
                        that.byId("DriverDocumentationTable").removeSelections();
                        that.onEnabledTableButtons(that.byId("DriverDocumentationTable").getSelectedContextPaths().length)
                    }
                }
            });
        },

        // ERROR MESSAGE
        showErrorMessage: function (oMessage) {
            new sap.m.MessageBox.error(oMessage.oText, {
                title: oMessage.oTitle,
                actions: [sap.m.MessageBox.Action.OK],
                emphasizedAction: sap.m.MessageBox.Action.OK
            });
        },

        // OPEN DOCUMENT
        onOpenDocument: function (oEvent) {
            // set oEvent source selected to get row binding context
            oEvent.getSource().setSelected(true);

            var oModel = this.getView().getModel("DriverData"),
                sPath = this.byId(oEvent.getSource().getParent().getId()).getSelectedContextPaths()[0],
                oDocument = "",
                oObject = "";

            if (oModel) {
                oObject = oModel.getProperty(sPath);
                oDocument = oObject.Document;
            } else {
                oObject = this.getModel().getObject(sPath);
                oDocument = oObject.document;
            }

            this._pdfViewer = new sap.m.PDFViewer();

            if (oDocument != '') {

                var decodedPdfContent = atob(oDocument);

                if (decodedPdfContent.indexOf(',') != -1)
                    decodedPdfContent = decodedPdfContent.substring(decodedPdfContent.indexOf(',') + 1, decodedPdfContent.length);

                decodedPdfContent = atob(decodedPdfContent);

                var byteArray = new Uint8Array(decodedPdfContent.length)

                for (var i = 0; i < decodedPdfContent.length; i++) {
                    byteArray[i] = decodedPdfContent.charCodeAt(i);
                }

                var blob = new Blob([byteArray.buffer], { type: "application/pdf" }),
                    _pdfurl = URL.createObjectURL(blob);

                this._PDFViewer = new sap.m.PDFViewer({
                    width: "auto",
                    showDownloadButton: false,
                    source: _pdfurl
                });

                jQuery.sap.addUrlWhitelist("blob");

                this._PDFViewer.open();

                this.byId(oEvent.getSource().getParent().getId()).removeSelections();

                if (oEvent.getSource().getParent().getId().includes("DriverDocumentationTable")) {
                    this.onEnabledTableButtons();
                }
            }
        },

        // ADD DRIVER DOCUMENT
        onAddDriverDocument: async function () {
            try {
                var aControl = [],
                    aContainers = [],
                    oModel = this.getView().getModel("DriverData"),
                    oTableModelItems = this.getView().getModel("DriverData").oData.items;

                aControl.push(sap.m.Select, sap.m.Input, sap.m.DatePicker, sap.ui.unified.FileUploader);
                aContainers.push(this.oSimpleForm.getId());

                const checked = this.checkEmptyFields(aControl, aContainers, "Dialog");

                if (checked) {
                    if (oTableModelItems.length > 0) {
                        var oSelectedDocType = this.aFields.find(({ id }) => id === 'doc_type_vh').value;

                        oData.items.forEach(oItem => {
                            if (oItem.DocType == oSelectedDocType) {
                                sap.ui.getCore().byId("doc_type_vh").setValueState("Error");
                                sap.ui.getCore().byId("doc_type_vh").setValueStateText(this.getResourceBundle().getText("doc_type_error"))
                                this.checked = false;
                            } else {
                                sap.ui.getCore().byId("doc_type_vh").setValueState("None");
                                sap.ui.getCore().byId("doc_type_vh").setValueStateText("None");
                                this.checked = true;
                            }
                        });

                        if (this.checked) {
                            var aRow = {
                                DocType: this.aFields.find(({ id }) => id === 'doc_type_vh').value,
                                DocSubty: "",
                                DocumentNo: this.aFields.find(({ id }) => id === 'DocumentNo').value,
                                Document: "",
                                IssueDate: this.aFields.find(({ id }) => id === 'issue_date').value,
                                ExpDate: this.aFields.find(({ id }) => id === 'exp_date').value
                            }

                            if (aRow.DocType == "DL") {
                                aRow.DocSubty = this.aFields.find(({ id }) => id === 'DrivingLicense').value
                            } else {
                                aRow.DocSubty = "";
                            }

                            // GET DOCUMENT IN BASE64 STRING
                            var oDocument_Base64Str = await this.onGetDocument(sap.ui.getCore().byId(this.aFields.find(({ id }) => id === 'document').id), sap.ui.getCore().byId(this.aFields.find(({ id }) => id === 'doc_type_vh').value));

                            if (oDocument_Base64Str) {
                                aRow.Document = oDocument_Base64Str;

                                oData.items.push(aRow);

                                oModel.setData(oData);
                                oModel.refresh(true);
                            }

                            this.onCloseDialog();

                            oDocument_Base64Str = null;
                        }

                    } else {

                        var aRow = {
                            DocType: this.aFields.find(({ id }) => id === 'doc_type_vh').value,
                            DocSubty: "",
                            DocumentNo: this.aFields.find(({ id }) => id === 'DocumentNo').value,
                            Document: "",
                            IssueDate: this.aFields.find(({ id }) => id === 'issue_date').value,
                            ExpDate: this.aFields.find(({ id }) => id === 'exp_date').value
                        }

                        if (aRow.DocType == "DL") {
                            aRow.DocSubty = this.aFields.find(({ id }) => id === 'DrivingLicense').value
                        } else {
                            aRow.DocSubty = "";
                        }

                        // GET DOCUMENT IN BASE64 STRING
                        var oDocument_Base64Str = await this.onGetDocument(sap.ui.getCore().byId(this.aFields.find(({ id }) => id === 'document').id), sap.ui.getCore().byId(this.aFields.find(({ id }) => id === 'doc_type_vh').value));

                        if (oDocument_Base64Str) {
                            aRow.Document = oDocument_Base64Str;

                            oData.items.push(aRow);

                            oModel.setData(oData);
                            oModel.refresh(true);
                        }

                        this.onCloseDialog();

                        oDocument_Base64Str = null;
                    }
                }

            } catch (error) {
                var oMessage = {
                    oText: error.message,
                    oTitle: this.getResourceBundle().getText("errorMessageBoxTitle")
                }

                this.showErrorMessage(oMessage);
            }
        },

        // UPDATE DRIVER DOCUMENT
        onUpdateDriverDocument: async function (oEvent) {
            debugger;
            var aControl = [],
                aContainers = [],
                oModel = this.getView().getModel("DriverData"),
                oTable = "",
                oObject = "",
                sPath = "";

            if (oModel) {
                oTable = this.byId("DriverDocumentationTable");
                sPath = oTable.getSelectedContextPaths()[0];
                oObject = oModel.getProperty(sPath);
            } else {
                oTable = this.byId("UserDocumentationTable");
                sPath = oTable.getSelectedContextPaths()[0];
                oObject = this.getModel().getObject(sPath);
            }

            aControl.push(sap.m.Select, sap.m.Input, sap.m.DatePicker, sap.ui.unified.FileUploader);
            aContainers.push(this.oSimpleForm.getId());

            const checked = this.checkEmptyFields(aControl, aContainers, "Dialog");

            if (checked) {
                try {
                    if (oModel) {
                        oObject.DocType = sap.ui.getCore().byId("doc_type_vh").getSelectedKey();
                        oObject.DocSubty = sap.ui.getCore().byId("DrivingLicense").getSelectedKey();
                        oObject.DocumentNo = sap.ui.getCore().byId("DocumentNo").getValue();
                        oObject.ExpDate = sap.ui.getCore().byId("exp_date").getDateValue();
                        oObject.IssueDate = sap.ui.getCore().byId("issue_date").getDateValue();
                        oObject.Document = await this.onGetDocument(sap.ui.getCore().byId("document"), oObject.DocType);

                        oModel.refresh(true);

                        this.onCloseDialog();
                    } else {
                        var oEntry = {};

                        oEntry.doc_type = sap.ui.getCore().byId("doc_type_vh").getSelectedKey();
                        // oEntry.doc_subty = sap.ui.getCore().byId("DrivingLicense").getSelectedKey();
                        oEntry.document_no = sap.ui.getCore().byId("DocumentNo").getValue();
                        oEntry.exp_date = sap.ui.getCore().byId("exp_date").getDateValue();
                        oEntry.issue_date = sap.ui.getCore().byId("issue_date").getDateValue();

                        if (oObject.document != sap.ui.getCore().byId("document").getValue()) {
                            oEntry.document = await this.onGetDocument(sap.ui.getCore().byId("document"), oObject.DocType);
                        }

                        if (sPath) {
                            this.onCloseDialog1();
                            this.onUpdate(sPath, oEntry);
                        }
                    }
                } catch (error) {
                    var oMessage = {
                        oText: error.message,
                        oTitle: this.getResourceBundle().getText("errorMessageBoxTitle")
                    }

                    this.showErrorMessage(oMessage);
                }
            }
        },

        // DELETE DRIVER DOCUMENT
        onDeleteDriverDocument: function () {
            var oTable = this.byId("DriverDocumentationTable"),
                oModel = this.getView().getModel("DriverData"),
                oSelectedContextPath = oTable.getSelectedContextPaths()[0].replace("/items/", "");

            oData.items.splice(oSelectedContextPath, 1); // remove selected row from the table model data

            oTable.removeSelections(); // remove selections

            var aSelectedContextPaths = oTable.getSelectedContextPaths().length; // get selected context paths
            this.onEnabledTableButtons(aSelectedContextPaths); // disable buttons

            oModel.refresh(true); // refresh data
        },

        // GET DOCUMENT FROM FILE UPLOADER AND CONVERT HIM TO PDF
        onGetDocument: function (oDocumentInput, oDocumentName) {
            return new Promise(function (resolve, reject) {
                var oItem = "",
                    oDocument = new jsPDF('p', 'mm', 'a4', true),
                    oResize_Width = 2200,
                    oFileReader = new FileReader();

                if (oDocumentInput.oFileUpload.files.length > 0) {
                    oItem = oDocumentInput.oFileUpload.files[0]
                }
                // else {
                //     oItem = oDocumentInput.getValue();
                //     oItem = atob(oItem);
                // }

                oFileReader.readAsDataURL(oItem);
                oFileReader.name = oDocumentName;
                oFileReader.size = oItem.size;

                oFileReader.onload = function (oEvent) {
                    var oImage = new Image();

                    if (!oItem.type.includes('pdf')) {
                        oImage.src = oEvent.target.result;

                        oImage.onload = function (el) {
                            var oElement = document.createElement('canvas'),
                                oScaleFactor = oResize_Width / el.target.width;

                            oElement.width = oResize_Width;
                            oElement.height = el.target.height * oScaleFactor;

                            var oContext = oElement.getContext('2d');
                            oContext.drawImage(el.target, 0, 0, oElement.width, oElement.height);

                            var oSourceEncoded = oContext.canvas.toDataURL('image/jpeg', 0.50);
                            oDocument.addImage(oSourceEncoded, 'JPEG', 15, 40, 180, 150);

                            oBase64 = oDocument.output('datauristring')
                            oBase64 = btoa(oBase64);

                            resolve(oBase64);
                        };
                    } else {
                        oBase64 = btoa(oEvent.target.result);

                        resolve(oBase64);
                    }
                };

                oFileReader.onerror = function (error) {
                    reject(error);
                };
            });
        },

        // SAP.M.SELECT - EVENT CHANGE
        onSelectChange: function (oEvent) {
            var oSource = oEvent.getSource().sId,
                oSelectedKey = sap.ui.getCore().byId(oSource).getSelectedKey(),
                oDocumentCategorySelect = sap.ui.getCore().byId("DrivingLicense");


            if (oSource.includes("doc_type_vh")) {
                if (oSelectedKey == "DL") {
                    oDocumentCategorySelect.setProperty("enabled", true);
                    oDocumentCategorySelect.setProperty("required", true);
                } else {
                    oDocumentCategorySelect.setProperty("enabled", false);
                    oDocumentCategorySelect.setProperty("required", false);

                    oDocumentCategorySelect.setSelectedKey(null);
                }
            }
        },

        // CRUD OPERATIONS
        // CREATE METHOD
        onCreate: function (sPath, oEntry, oToken) {
            try {
                if (sPath) {
                    var oModel = this.getModel(),
                        oAppViewModel = this.getModel("appView"),
                        that = this;

                    oModel.create(sPath, oEntry, {
                        headers: {
                            "authorization": oToken
                        },
                        success: function () {
                            var oDataModel = that.getModel("DriverData");

                            if (oDataModel) {
                                var aContainers = [];
                                aContainers.push("GeneralInfoContainer")

                                var oModelDataCleared = that.onClearModelData();
                                var oContainersDataCleared = that.onClearContainersData(aContainers);

                                if (oModelDataCleared && oContainersDataCleared) {
                                    oModel.refresh(true);
                                    that.onNavigation("", "drivers", "");
                                }
                            }
                        },
                        error: function (oError) {
                            var sError = JSON.parse(oError.responseText).error.message.value;

                            sap.m.MessageBox.alert(sError, {
                                icon: "ERROR",
                                onClose: null,
                                styleClass: '',
                                initialFocus: null,
                                textDirection: sap.ui.core.TextDirection.Inherit
                            });
                        }
                    });

                    oModel.attachRequestSent(function () {
                        oAppViewModel.setProperty("/busy", true);
                    });
                    oModel.attachRequestCompleted(function () {
                        oAppViewModel.setProperty("/busy", false);
                    });
                    oModel.attachRequestFailed(function () {
                        oAppViewModel.setProperty("/busy", false);
                    });
                }
            } catch (error) {
                var oMessage = {
                    oText: error.message,
                    oTitle: this.getResourceBundle().getText("errorMessageBoxTitle")
                }

                this.showErrorMessage(oMessage);
            }
        },

        onUpdate: function (sPath, oEntry, oToken) {
            try {
                if (sPath) {
                    var oModel = this.getModel(),
                        oAppViewModel = this.getModel("appView");

                    oModel.update(sPath, oEntry, {
                        headers: {
                            "authorization": oToken
                        },
                        success: function () {
                            oModel.refresh(true);
                        },
                        error: function (oError) {
                            var sError = JSON.parse(oError.responseText).error.message.value;

                            sap.m.MessageBox.alert(sError, {
                                icon: "ERROR",
                                onClose: null,
                                styleClass: '',
                                initialFocus: null,
                                textDirection: sap.ui.core.TextDirection.Inherit
                            });
                        }
                    });

                    oModel.attachRequestSent(function () {
                        oAppViewModel.setProperty("/busy", true);
                    });
                    oModel.attachRequestCompleted(function () {
                        oAppViewModel.setProperty("/busy", false);
                    });
                    oModel.attachRequestFailed(function () {
                        oAppViewModel.setProperty("/busy", false);
                    });
                }
            } catch (error) {
                var oMessage = {
                    oText: error.message,
                    oTitle: this.getResourceBundle().getText("errorMessageBoxTitle")
                }

                this.showErrorMessage(oMessage);
            }
        },

        onDelete: function (sPath, oToken) {

            try {
                if (sPath) {
                    var oModel = this.getModel(),
                        oAppViewModel = this.getModel("appView");

                    oModel.remove(sPath, {
                        headers: {
                            "authorization": oToken
                        },
                        success: function () {
                            oModel.refresh(true);
                        },
                        error: function (oError) {
                            var sError = JSON.parse(oError.responseText).error.message.value;

                            sap.m.MessageBox.alert(sError, {
                                icon: "ERROR",
                                onClose: null,
                                styleClass: '',
                                initialFocus: null,
                                textDirection: sap.ui.core.TextDirection.Inherit
                            });
                        }
                    });

                    oModel.attachRequestSent(function () {
                        oAppViewModel.setProperty("/busy", true);
                    });
                    oModel.attachRequestCompleted(function () {
                        oAppViewModel.setProperty("/busy", false);
                    });
                    oModel.attachRequestFailed(function () {
                        oAppViewModel.setProperty("/busy", false);
                    });
                }
            } catch (error) {
                var oMessage = {
                    oText: error.message,
                    oTitle: this.getResourceBundle().getText("errorMessageBoxTitle")
                }

                this.showErrorMessage(oMessage);
            }
        },

        getUserAuthentication: function (type) {

            var that = this;
            var urlParams = new URLSearchParams(window.location.search);
            var token = urlParams.get('token');

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
                        var parser = new DOMParser();
                        var xmlDoc = parser.parseFromString(xml, "text/xml");

                        // Na vegar até o elemento <d:SuccessResponse>
                        var successResponseElement = xmlDoc.getElementsByTagName("d:SuccessResponse")[0];

                        // Obter o valor do elemento
                        var response = successResponseElement.textContent;

                        if (response != 'X') {
                            that.getRouter().navTo("NotFound");
                        }
                        else {
                            that.getModel("appView").setProperty("/token", token);
                        }
                    })
                    .catch(function (error) {
                        // Ocorreu um erro ao ler a entidade
                        console.error(error);
                    });
            } else {
                that.getRouter().navTo("NotFound");
                return;
            }
        }
    });

});