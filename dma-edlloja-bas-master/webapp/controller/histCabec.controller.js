sap.ui.define([
	"dma/zedlloja/controller/BaseController",
	'sap/m/Token',
	"sap/ui/core/Fragment",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"dma/zedlloja/controller/formatter"
], function (BaseController, Token, Fragment, Sorter, Filter, FilterOperator, formatter) {
	"use strict";
	return BaseController.extend("dma.zedlloja.controller.histCabec", {
		formatter: formatter,
		_histPedidoTable: null,
		onInit: function () {
			this._histPedidoTable = this.getView().byId("tableHistPedido");
			this.getRouter().getRoute("histCabec").attachPatternMatched(this._onMasterMatched, this);
			//this.getRouter().attachBypassed(this.onBypassed, this);

			//this._histPedidoTable.addEventDelegate({
			//	onAfterRendering: () => {
			//		var oHeader = this._histPedidoTable.$().find('.sapMListTblHeaderCell');
			//		for (var i = 0; i < oHeader.length; i++) {
			//			var oID = oHeader[i].id;
			//			this.onClickColumnHeader(oID, this._histPedidoTable);
			//		}
			//	}
			//}, this._histPedidoTable);

			var oView = this.getView();

			Fragment.load({
				id: this.getView().getId(),
				name: "dma.zedlloja.view.fragments.SortDialog",
				controller: this
			}).then(function(oMenu) {
				oView.addDependent(oMenu);
				return oMenu;
			});

			// Keeps reference to any of the created sap.m.ViewSettingsDialog-s in this sample
			this._mViewSettingsDialogs = {};			
		},

		_onMasterMatched: function (oEvent) {
			var aFilters = [];
			var globalModel = this.getModel("globalModel");
			var oHistPedido = this._histPedidoTable.getBinding("items");

			var sWerks = oEvent.getParameter("arguments").Werks;

			// inicia com data de hoje
			var drPedido = this.byId("drPedido");
			var sDtpedido = drPedido.getValue();
			if (sDtpedido === "") {
				drPedido.setDateValue(new Date());
				drPedido.setSecondDateValue(new Date());
			};

			this._histPedidoTable.bindItems({
				path: "/HistoricoCabecSet",
				template: this._histPedidoTable.getBindingInfo("items").template
			});
			this.filtraHistorico();
		},
		/* Value Help Fornecedor */
		onF4Fornecedor: function (oEvent) {
			//var aFilters = [];
			var sInputValue = oEvent.getSource().getDescription();
			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._F4fornecHistoricoDialog) {
				this._F4fornecHistoricoDialog = sap.ui.xmlfragment("dma.zedlloja.view.fragments.fornecHistorico", this);
				this.getView().addDependent(this._F4fornecHistoricoDialog);
			}
			// open value help dialog filtered by the input value
			//this._F4fornecHistoricoDialog.getBinding("items").filter(aFilters);
			this._F4fornecHistoricoDialog.open(sInputValue);
		},
		clearFornecedor: function (oEvent) {
			var fornecedorInput = this.byId("fornecedorInput");
			fornecedorInput.setValue("");
			fornecedorInput.setDescription("");
			this.filtraHistorico();
		},
		_handleF4fornecedorSearch: function (oEvent) {
			var aFilters = [];
			var sValue = oEvent.getParameter("value");
			//Filtro Fornecedor - Nome
			var oForn = new sap.ui.model.Filter("Mcod1", sap.ui.model.FilterOperator.Contains, sValue.toUpperCase());
			aFilters.push(oForn);
			oEvent.getSource().getBinding("items").filter(aFilters);
		},
		_handleF4fornecedorClose: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var fornecedorInput = this.getView().byId(this.inputId);
				fornecedorInput.setValue(oSelectedItem.getTitle());
				fornecedorInput.setDescription(oSelectedItem.getDescription());
				this.filtraHistorico();
			} else {
				var fornecedorInput = this.getView().byId(this.inputId);
				fornecedorInput.setValue('');
				fornecedorInput.setDescription('');
				this.filtraHistorico();
			}
		},

		/* Value Help Pedido */
		onF4Pedido: function (oEvent) {
			//var aFilters = [];
			var sInputValue = oEvent.getSource().getDescription();
			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._F4pedidoHistoricoDialog) {
				this._F4pedidoHistoricoDialog = sap.ui.xmlfragment("dma.zedlloja.view.fragments.pedidoHistorico", this);
				this.getView().addDependent(this._F4pedidoHistoricoDialog);
			}
			// open value help dialog filtered by the input value
			//this._F4pedidoHistoricoDialog.getBinding("items").filter(aFilters);
			this._F4pedidoHistoricoDialog.open(sInputValue);
		},
		clearPedido: function (oEvent) {
			var pedidoInput = this.byId("pedidoInput");
			pedidoInput.setValue("");
			pedidoInput.setDescription("");
			this.filtraHistorico();
		},
		_handleF4pedidoSearch: function (oEvent) {
			var aFilters = [];
			var sValue = oEvent.getParameter("value");
			// Filtro Pedido - Nome
			var oPed = new sap.ui.model.Filter("Mcod1", sap.ui.model.FilterOperator.Contains, sValue.toUpperCase());
			aFilters.push(oPed);
			oEvent.getSource().getBinding("items").filter(aFilters);
		},
		_handleF4pedidoClose: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				var pedidoInput = this.getView().byId(this.inputId);
				pedidoInput.setValue(oSelectedItem.getTitle());
				pedidoInput.setDescription(oSelectedItem.getDescription());
				this.filtraHistorico();
			} else {
				var pedidoInput = this.getView().byId(this.inputId);
				pedidoInput.setValue('');
				pedidoInput.setDescription('');
				this.filtraHistorico();
			}
			// oEvent.getSource().getBinding("items").filter();
		},
		/* Filtra tabela */
		filtraHistorico: function (oEvent) {
			var aFilters = [];
			// Filtro Pedido
			var sEbeln = this.byId("pedidoInput").getValue();
			if (sEbeln !== "") {
				var fEbeln = new sap.ui.model.Filter("Ebeln", sap.ui.model.FilterOperator.EQ, sEbeln);
				aFilters.push(fEbeln);
			}
			// Filtro Fornecedor
			var sLifnr = this.byId("fornecedorInput").getValue();
			if (sLifnr !== "") {
				var fLifnr = new sap.ui.model.Filter("Lifnr", sap.ui.model.FilterOperator.EQ, sLifnr);
				aFilters.push(fLifnr);
			}
			// Filtro Data Pedido
			var drPedido = this.byId("drPedido");
			if (drPedido.getDateValue() !== null) {
				let pedFirstDate = drPedido.getDateValue().toLocaleDateString();
				let pedDate1 = pedFirstDate.substring(6, 10) + pedFirstDate.substring(3, 5) + pedFirstDate.substring(0, 2);
				let pedSecondDate = drPedido.getSecondDateValue().toLocaleDateString();
				let pedDate2 = pedSecondDate.substring(6, 10) + pedSecondDate.substring(3, 5) + pedSecondDate.substring(0, 2);
				var fPedido = new sap.ui.model.Filter("Dtpedido", sap.ui.model.FilterOperator.BT, pedDate1, pedDate2);
				aFilters.push(fPedido);
			}
			// Filtro Data Remessa
			var drRemessa = this.byId("drRemessa");
			if (drRemessa.getDateValue() !== null) {
				let remFirstDate = drRemessa.getDateValue().toLocaleDateString();
				let remDate1 = remFirstDate.substring(6, 10) + remFirstDate.substring(3, 5) + remFirstDate.substring(0, 2);
				let remSecondDate = drRemessa.getSecondDateValue().toLocaleDateString();
				let remDate2 = remSecondDate.substring(6, 10) + remSecondDate.substring(3, 5) + remSecondDate.substring(0, 2);
				var fRemessa = new sap.ui.model.Filter("Dtremessa", sap.ui.model.FilterOperator.BT, remDate1, remDate2);
				aFilters.push(fRemessa);
			}

			this._histPedidoTable.getBinding("items").filter(aFilters);
		},
		onChangeDatas: function (oEvent) {
			this.filtraHistorico(oEvent);
		},
		onSelectionChange: function (oEvent) {

		},
		onNavigation: function (oEvent) {
			const oModel = this.getView().getModel();
			let oSelectedLine = this.getView().getModel().getProperty(oEvent.getSource().getBindingContextPath());
			this.saveGlobalData("Lifnr", oSelectedLine.Lifnr);
			this.getRouter().navTo(
				'histDetail', {
				Id: oSelectedLine.Id
			},
				true
			);
		},
		onNavBack: function (oEvent) {
			this.getRouter().navTo("mainPage", true);
		},
		onBtnClear: function (oEvent) {
			this.clearFornecedor();
			this.clearPedido();
			var drPedido = this.byId("drPedido");
			drPedido.setValue(null);
			var drRemessa = this.byId("drRemessa");
			drRemessa.setValue(null);
			this.filtraHistorico();
		},

		getViewSettingsDialog: function (sDialogFragmentName) {
			var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];

			if (!pDialog) {
				pDialog = Fragment.load({
					id: this.getView().getId(),
					name: sDialogFragmentName,
					controller: this
				}).then(function (oDialog) {
					return oDialog;
				});
				this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
			}
			return pDialog;
		},
		
		handleSortButtonPressed: function () {
			this.getViewSettingsDialog("dma.zedlloja.view.fragments.SortDialog")
				.then(function (oViewSettingsDialog) {
					oViewSettingsDialog.open();
				});
		},		
		handleSortDialogConfirm: function (oEvent) {
			var oTable = this.byId("tableHistPedido"),
				mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				aSorters = [];

			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));

			// apply the selected sort and group settings
			oBinding.sort(aSorters);
		}
	});
});