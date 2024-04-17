sap.ui.define([
	'dma/zedlloja/controller/BaseController',
	'sap/ui/core/Fragment',
	'sap/ui/model/json/JSONModel',
	'dma/zedlloja/controller/formatter'
], function (BaseController, Fragment, JSONModel, formatter) {
	"use strict";
	return BaseController.extend("dma.zedlloja.controller.histDetail", {
		formatter: formatter,
		_histDetailTable: null,
		_Werks: null,
		onInit: function () {
			this._histDetailTable = this.getView().byId("tableHistDetail");
			this.getRouter().getRoute("histDetail").attachPatternMatched(this._onMasterMatched, this);
		},
		_onMasterMatched: function (oEvent) {
			var aFilters = [];
			var globalModel = this.getModel("globalModel");
			var sId = oEvent.getParameter("arguments").Id;

			let sObjectPath = this.getModel().createKey("/HistoricoCabecSet", {
                Id: sId
            });

			this._histDetailTable.bindItems({
				path: sObjectPath + "/toDetail",
				template: this._histDetailTable.getBindingInfo("items").template
			});
//			Get Detail Info
			this.getView().getModel().read(sObjectPath + "/toInfo", {
				success: (res) => {
					this.getView().setModel(new JSONModel(res), 'histDetailInfo');
				},
			});
		},
		onNavBack: function (oEvent) {
			this.getRouter().navTo("histCabec", {
				Werks: this.getGlobalData("Werks")
			}, true);
		},
		onPrint: function (oEvent) {
			var globalModel = this.getModel("globalModel");
			var localModel = this.getModel();

			var sObjectPath = this.getModel().createKey("/PrnPedidoSet", {
				Ebeln: this.getModel('histDetailInfo').oData.Pedido
			});
			var sURL = this.getModel().sServiceUrl + sObjectPath + "/$value";
			window.open(sURL);
		}

	});
});