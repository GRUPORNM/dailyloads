sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("dailyloads.controller.NotFound", {
        onInit: function () {
            var oModel = new JSONModel();
            this.getView().setModel(oModel, "NotFound");
            var oRouter = this.getRouter();
            oRouter.attachRouteMatched(this.onRouteMatched, this);
        },

        _onNotFoundDisplayed: function () {
            this.getModel("appView").setProperty("/layout", "OneColumn");
        },

        onRouteMatched: function () {
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

                        // Navegar até o elemento <d:SuccessResponse>
                        var successResponseElement = xmlDoc.getElementsByTagName("d:SuccessResponse")[0];

                        // Obter o valor do elemento
                        var response = successResponseElement.textContent;

                        if (response == 'X') {
                            that.getRouter().navTo("list");
                        }
                    })
                    .catch(function (error) {
                        // Ocorreu um erro ao ler a entidade
                        console.error(error);
                    });
            }
        },
    });
});
