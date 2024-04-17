sap.ui.define([
    "dma/zedlloja/controller/BaseController",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/DialogType",
    "sap/m/Button",
    "sap/m/ButtonType",
    'sap/ui/model/json/JSONModel',
    'dma/zedlloja/controller/formatter',
    'sap/m/MessageToast'
], function (BaseController, Fragment, MessageBox, Dialog, DialogType, Button, ButtonType, JSONModel, formatter, MessageToast) {
    "use strict";
    var sResponsivePaddingClasses =
        'sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer';

    var aPOCreated = [];

    return BaseController.extend("dma.zedlloja.controller.detailPage", {
        formatter: formatter,
        _oTablePedido: null,
        _colSugestao: null,
        _colRequisicao: null,
        _colSobsl: null,
        _colEditavel: null,
        _colMaximo: null,

        onInit: function () {
            this.initWSocket();
            this._oTablePedido = this.getView().byId('idTablePedido');
            // this.getRouter().getRoute("detail").attachPatternMatched(this.onObjectMatched, this);
            this.getRouter().attachRouteMatched(this.onObjectMatched, this);

            this.configTabKeyFocus(this._oTablePedido);
        },

        onObjectMatched: function (oEvent) {
            if (oEvent.getParameter("name") !== "detailPage") {
                return;
            }
            var sLifnr = oEvent.getParameter("arguments").Lifnr;
            var sWerks = oEvent.getParameter("arguments").Werks;

            this.saveGlobalData("Werks", sWerks);
            this.byId("headerLoja").setText("Loja - " + sWerks);
            this.saveGlobalData("Lifnr", sLifnr);
            this.saveGlobalData("DtRemessa", "");
            this.byId("idDtRemessa").setDateValue(null);
            this.saveGlobalData("TpPedido", "");
            this.byId("idComboPedido").setValue(null);

            // Tabela Compra
            var aFilters = [];
            aFilters.push(new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, sWerks));
            aFilters.push(new sap.ui.model.Filter("Lifnr", sap.ui.model.FilterOperator.EQ, sLifnr));

            this._oTablePedido.bindItems({
                path: "/ItensPedidoSet",
                length: 500,
                filters: aFilters,
                template: this._oTablePedido.getBindingInfo("items").template
            });

            // busca numero da coluna de input
            for (var i = 0; i < this._oTablePedido.mAggregations.columns.length; i++) {
                if (this._oTablePedido.mAggregations.columns[i].sId.includes("inputSugestao")) {
                    this._colSugestao = i;
                }
                if (this._oTablePedido.mAggregations.columns[i].sId.includes("inputRequisicao")) {
                    this._colRequisicao = i;
                }
                if (this._oTablePedido.mAggregations.columns[i].sId.includes("inputSobsl")) {
                    this._colSobsl = i;
                }
                if (this._oTablePedido.mAggregations.columns[i].sId.includes("inputEditavel")) {
                    this._colEditavel = i;
                }
                if (this._oTablePedido.mAggregations.columns[i].sId.includes("inputMaximo")) {
                    this._colMaximo = i;
                }
            }

            this.byId("idComboPedido").setSelectedKey("");
            this.getFornecedorInfo();
            this.habilitaBotaoPedido();
        },
        getFornecedorInfo: function () {
            var sObjectPath = "/TitulosSet(Werks='" + this.getGlobalData("Werks") + "',Lifnr='" + this.getGlobalData("Lifnr") + "')"

            //this.getView().getModel().read(`/TitulosSet('${sLifnr}')`, {
            this.getView().getModel().read(sObjectPath, {
                success: (res) => {
                    this.getView().setModel(new JSONModel(res), 'fornecedorInfo');
                },
            });
        },

        onFornecedorInfoClose: function () {
            this._oPopoverFornecedorInfo.close();
        },

        _onLiveChangeInput: function (oEvent) {
            var actualValue = oEvent.getParameter("value");
            var lastValue = oEvent.getSource()._lastValue;
            let isNum = /^\d+$/.test(actualValue);
            if (!isNum && actualValue.length > 0) {
                oEvent.getSource().setValue(actualValue.replace(/\D/g, ''));
            }
            if (actualValue < 0) {
                actualValue = "0";
                oEvent.getSource().setValue(0);
            }
            if (actualValue !== lastValue) {
                this.saveGlobalData("/Alterado", true);
            }
        },

        _onChangeInput: function (oEvent) {
            var _oInput = oEvent.getSource();
            var actualValue = oEvent.getParameter("value");
            var lastValue = _oInput.getBindingInfo("value").binding.oValue;
            var maxValue = _oInput.getParent().getAggregation("cells")[this._colMaximo].getProperty("number");
            //actualValue = actualValue.replace(/[^\d]/g, '');
            //let isNum = /^\d+$/.test(actualValue);
            //if (!isNum && actualValue.length > 0) {
            //    oEvent.getSource().setValue(actualValue);
            //}
            if (parseInt(actualValue, 10) < 0) {
                actualValue = "0";
                //actualValue = actualValue.replace(/[^\d]/g, '');
                oEvent.getSource().setValue(actualValue);
            }
            if (parseInt(maxValue, 10) != 0 && parseInt(actualValue, 10) > parseInt(maxValue, 10)) {
                actualValue = lastValue;
                //actualValue = actualValue.replace(/[^\d]/g, '');
                oEvent.getSource().setValue(actualValue);
                var msg = `O valor máximo admitido para este material é ${maxValue}`;
                MessageToast.show(msg);
            }
            if (parseInt(actualValue, 10) !== parseInt(lastValue, 10)) {
                this.saveGlobalData("Alterado", true);
            }
            this.gravaValores(false);
        },

        gravaValores: function (oReset) {
            var oView = this.getView();
            var qtdeTotal = 0,
                qtdeRequisicao = 0;
            var hasChanges = false;
            var sWerks = this.getGlobalData("Werks");
            var sLifnr = this.getGlobalData("Lifnr");
            var sAlterado = this.getGlobalData("Alterado");
            if (sAlterado) {
                var oModel = this._oTablePedido.getModel();
                //"useBatch" : true,
                //"defaultBindingMode": "TwoWay",
                //"defaultCountMode" : "None",
                //oModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
                //oModel.setUseBatch(true);
                //oModel.setDeferredGroups(["dma1"]);
                for (var i = 0; i < this._oTablePedido.getItems().length; i++) {
                    var colRequisicao = this._oTablePedido.getItems()[i].getCells()[this._colRequisicao];
                    qtdeRequisicao = colRequisicao.getValue() === "" ? "0" : colRequisicao.getValue();
                    if ((oReset) || (qtdeRequisicao !== colRequisicao.getBindingInfo("value").binding.oValue)) {
                        //////// 	Enviando todos os dados todas as vezes
                        qtdeTotal += parseInt(qtdeRequisicao, 10);
                        var sPath = this._oTablePedido.getItems()[i].getBindingContext().sPath;
                        var payLoad = {};
                        payLoad.Werks = this._oTablePedido.getItems()[i].getBindingContext().getProperty("Werks");
                        payLoad.Lifnr = this._oTablePedido.getItems()[i].getBindingContext().getProperty("Lifnr");
                        payLoad.Matnr = this._oTablePedido.getItems()[i].getBindingContext().getProperty("Matnr");
                        //conversao vazio para zero string
                        payLoad.Requisicao = qtdeRequisicao;
                        oModel.update(sPath, payLoad);
                        //oModel.update(sPath, payLoad, { 
                        //    groupId: "dma1"
                        //});
                        hasChanges = true;
                    } else {
                        qtdeTotal += parseInt(colRequisicao.getBindingInfo("value").binding.oValue, 10);
                    }
                }
                if (hasChanges) {
                    sap.ui.core.BusyIndicator.show();
                    oModel.submitChanges({
                        //groupId: "dma1",
                        success: (oData, oResponse) => {
                            //oModel.setUseBatch(false);
                            sap.ui.core.BusyIndicator.hide();
                            this.saveGlobalData("Alterado", false);
                        },
                        error: (oData, oResponse) => {
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageToast.show("error function");
                        }
                    });
                }
            }
            this.updateTotal();
            this.habilitaBotaoPedido();
        },

        updateTotal: function () {
            var sObjectPath = this.getModel().createKey('/SomaItensSet', {
                Werks: this.getGlobalData("Werks"),
                Lifnr: this.getGlobalData("Lifnr")
            });

            this.getView().getModel().read(sObjectPath, {
                method: 'GET',
                success: (oData, oResponse) => {
                    this.getView().setModel(new JSONModel(oData), 'somaItens');
                    //this.saveGlobalData("Total", Number(oData.Total));
                    //this.byId("headerDetail").setNumber(Number(oData.Total));
                },
                error: function (oError) { },
            });
        },

        onOpenPedidoProgressDialog: function (oEvent) {
            this.getView().setModel(
                new sap.ui.model.json.JSONModel({ text: '' }),
                'pedidoProgress'
            );
            // instantiate dialog
            if (!this._pedidoBusyDialog) {
                this._pedidoBusyDialog = sap.ui.xmlfragment(
                    'dma.zedlloja.view.fragments.PedidoProgressBusyDialog',
                    this
                );
                this.getView().addDependent(this._pedidoBusyDialog);
            }

            // open dialog
            jQuery.sap.syncStyleClass(
                'sapUiSizeCompact',
                this.getView(),
                this._pedidoBusyDialog
            );
            this._pedidoBusyDialog.open();

            // simulate end of operation
            /*_timeout = jQuery.sap.delayedCall(10000, this, function () {
                    this._pedidoBusyDialog.close();
                });*/
        },

        setMessagePedidoProgressDialog: function (sText) {
            this.getView().getModel('pedidoProgress').setProperty('/text', sText);
        },

        onPedidoProgressDialogClosed: function (oEvent) { },

        initWSocket: function () {
            let hostLocation = window.location,
                socket,
                socketHostURI,
                webSocketURI;
            if (hostLocation.protocol === 'https:') {
                socketHostURI = 'wss:';
            } else {
                socketHostURI = 'ws:';
            }
            socketHostURI += '//' + hostLocation.host;
            webSocketURI = socketHostURI + '/sap/bc/apc/sap/zcockpit_edlloja';

            try {
                socket = new WebSocket(webSocketURI);
                socket.onopen = (e) => {
                    console.log('Socket Connected');
                };
                socket.onerror = (e) => {
                    console.log('Socket Erro');
                };

                //Create function for handling websocket messages
                socket.onmessage = (oMsg) => {
                    let oMessage = JSON.parse(oMsg.data);
                    if (oMessage.idMessage !== this.idMessage) {
                        return;
                    }

                    if (
                        oMessage.message &&
                        oMessage.message.length > 0 &&
                        oMessage.failed
                    ) {
                        sap.m.MessageBox.error(
                            this.getText('erro_criacao_pedido') + '\n' + oMessage.message, {
                            title: this.getText('pedido_nao_criado'),
                            actions: [MessageBox.Action.OK],
                            initialFocus: MessageBox.Action.OK,
                            styleClass: sResponsivePaddingClasses,
                        }
                        );
                        return;
                    }

                    if (oMessage.complete) {
                        this._pedidoBusyDialog.close();
                        aPOCreated = [];
                        for (var i = 0; i < oMessage.list.length; i++) {
                            if (oMessage.list[i].PedEbeln) {
                                aPOCreated[i] = oMessage.list[i].PedEbeln;
                            }
                        }
                        this.dialogoCriaPedido(oMessage.list, null);
                    } else {
                        this.setMessagePedidoProgressDialog(
                            this.getTextWithParams('pedido_status', [
                                oMessage.createdCount.toString(),
                                oMessage.totalCount.toString(),
                            ])
                        );
                    }
                };
                socket.onclose = (e) => {
                    console.log('Closed');
                };
            } catch (exception) { }
        },

        onGravaPedido: function (oEvent) {
            this.onOpenPedidoProgressDialog();
            this.saveGlobalData("Alterado", true);
            this.gravaValores(false);
            var dt_remessa = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: 'YYYYMMdd',
            }).format(this.getGlobalData("DtRemessa"));

            var sObjectPath = this.getModel().createKey('/GravaPedidoSet', {
                Werks: this.getGlobalData("Werks"),
                Lifnr: this.getGlobalData("Lifnr"),
                TpPedido: this.getGlobalData("TpPedido"),
                DtRemessa: dt_remessa,
            });
            //sap.ui.core.BusyIndicator.show();
            this.getView().getModel().read(sObjectPath, {
                method: 'GET',
                success: (oData, oResponse) => {
                    sap.ui.core.BusyIndicator.hide();
                    this.idMessage = oData.Mensagem;
                    return;
                    //if (oData.Nroseq === "0") {
                    //    // erro na criação do pedido
                    //    sap.m.MessageBox.error(oData.Mensagem, {
                    //        title: "Pedido com erro",
                    //        onClose: (sAction) => {
                    //            this.getRouter().navTo('mainPage');
                    //        },
                    //        actions: [MessageBox.Action.OK],
                    //        initialFocus: MessageBox.Action.OK,
                    //        styleClass: sResponsivePaddingClasses
                    //    });
                    //} else {
                    //    var sMessage = "Pedido " + oData.Ebeln + " criado com sucesso";
                    //    this.saveGlobalData("Message", sMessage);
                    //    this.saveGlobalData("Pedido", oData.Ebeln);
                    //    this.saveGlobalData("Lifnr", oData.Lifnr);
                    //    this.saveGlobalData("Ekgrp", oData.Ekgrp);
                    //    this.dialogoCriaPedido(oData, oData.Nroseq);
                    //};
                },
                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.error('Erro', {
                        title: this.getText('pedido_nao_criado'),
                        initialFocus: null,
                        styleClass: sResponsivePaddingClasses,                    
                    //sap.ui.core.BusyIndicator.hide();
                    //sap.m.MessageBox.error(oError.Mensagem, {
                    //    title: "Pedido com erro",
                    //    onClose: (sAction) => {
                    //        this.getRouter().navTo('mainPage');
                    //    },
                    //    actions: [MessageBox.Action.OK],
                    //    initialFocus: MessageBox.Action.OK,
                    //    styleClass: sResponsivePaddingClasses
                    });
                },
            });
        },

        dialogoCriaPedido: function (oData2, pNroSeq) {
            this.getView().setModel(
                new sap.ui.model.json.JSONModel(oData2),
                'PedCriado'
            );
            var aFilters = [];
            if (!this._PedCriadoDialog) {
                this._PedCriadoDialog = sap.ui.xmlfragment("dma.zedlloja.view.fragments.ped_criado", this);
                this.getView().addDependent(this._PedCriadoDialog);
            }
            this._PedCriadoDialog.open();
        },

        onDtRemessa: function (oEvent) {
            this.saveGlobalData("DtRemessa", this.byId("idDtRemessa").getDateValue());
            this.habilitaBotaoPedido();
        },

        onTipoPedido: function (oEvent) {
            this.saveGlobalData("TpPedido", this.byId("idComboPedido").getSelectedItem().getProperty("key"));
            this.habilitaBotaoPedido();
        },

        habilitaBotaoPedido: function () {
            var btnPedido = this.byId("gravaPedido");
            var sDtRemessa = this.getGlobalData("DtRemessa");
            var sComboPedido = this.getGlobalData("TpPedido");
            var sQtdItens = false;
            for (var i = 0; i < this._oTablePedido.getItems().length; i++) {
                let colRequisicao = this._oTablePedido.getItems()[i].getCells()[this._colRequisicao];
                if (colRequisicao.getValue() > 0) {
                    sQtdItens = true;
                    break;
                }
            }
            btnPedido.setEnabled(
                (sDtRemessa !== "") &&
                (sComboPedido !== "") &&
                (sQtdItens)
            );
        },

        onResetValores: function (oEvent) {
            for (var i = 0; i < this._oTablePedido.getItems().length; i++) {
                var colRequisicao = this._oTablePedido.getItems()[i].getCells()[this._colRequisicao];
                var colSugestao = this._oTablePedido.getItems()[i].getCells()[this._colSugestao];
                colRequisicao.setValue(colSugestao.getProperty("number"));
            }
            this.saveGlobalData("Alterado", true);
            this.gravaValores(true);
        },

        restringeFonte21: function () {
            for (var i = 0; i < this._oTablePedido.getItems().length; i++) {
                var colRequisicao = this._oTablePedido.getItems()[i].getCells()[this._colRequisicao];
                var colSobsl = this._oTablePedido.getItems()[i].getCells()[this._colSobsl];
                var colEditavel = this._oTablePedido.getItems()[i].getCells()[this._colEditavel];
                if (colEditavel.getProperty("number") === '' || colSobsl.getProperty("number") === '21,00') {
                    colRequisicao.setEditable(false);
                }
            }
        },

        updateFinished: function (oEvent) {
            this.restringeFonte21();
            this.updateTotal();
            //this.habilitaBotaoPedido();
        },

        onNavBack: function (oEvt) {
            this.getRouter().navTo('mainPage');
        },

        configTabKeyFocus: function (oTable) {
            let that = this;
            oTable.onAfterRendering = function (oEvent) {
                sap.m.Table.prototype.onAfterRendering.apply(this);

                let oTableID = oTable.getId();
                $("#" + oTableID).focusout(() => {
                    for (let itemRow of oTable.getItems()) {
                        itemRow.removeStyleClass('selectedMaterial');
                    }
                })

                $("#" + oTableID).focusin((evt) => {
                    // remember current focused cell
                    jQuery.sap.delayedCall(200, null, function () {
                        var oBody = $('#' + oTableID).find('tbody');
                        // find the focused input field
                        var oField = oBody.find('.sapMInputFocused')[0];
                        if (oField && !oTable._skipFocusInitialization) {
                            // store ID of focused cell
                            oTable._focusedInput = oField.id;
                            oTable._currentIndex = oTable.getItems().findIndex((item) => {
                                return item.getCells().find((field) => {
                                    return field.getId() === oTable._focusedInput
                                });
                            });

                            oTable._rowIndexOfInputFields = 0;
                            oTable.getItems()[oTable._currentIndex].addStyleClass('selectedMaterial');
                            for (let itemTable of oTable.getItems()) {
                                oTable._rowIndexOfInputFields = itemTable.getCells().findIndex((field) => {
                                    return field.getId() === oTable._focusedInput;

                                });
                                if (oTable._rowIndexOfInputFields > 0) {
                                    break;
                                }
                            }

                        } else {
                            oTable._skipFocusInitialization = false;
                        }
                    });
                });

                $('#' + oTableID).on('keydown', (e) => {
                    e.stopImmediatePropagation();

                    for (let itemRow of oTable.getItems()) {
                        itemRow.removeStyleClass('selectedMaterial');
                    }

                    if (e.key === 'Enter') {
                        oTable._skipFocusInitialization = true;
                        //alert('passou');

                        if (oTable.getItems().length === (oTable._currentIndex + 1)) {
                            oTable._currentIndex = 0;
                        } else {
                            oTable._currentIndex++;
                        }
                        let oCurrentField = oTable.getItems()[oTable._currentIndex].getCells()[oTable._rowIndexOfInputFields];
                        let currentLine = oTable.getItems()[oTable._currentIndex];
                        oCurrentField.focus();
                        //Highlight selected field
                        currentLine.addStyleClass('selectedMaterial');
                        //jQuery.sap.delayedCall(200, null, function () {
                        oCurrentField.selectText(0, oCurrentField.getValue().length)
                        //});
                        that.gravaValores(false);
                    }

                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        oTable._skipFocusInitialization = true;

                        if (oTable.getItems().length === (oTable._currentIndex + 1)) {
                            oTable._currentIndex = 0;
                        } else {
                            e.key === 'ArrowDown' ? oTable._currentIndex++ : oTable._currentIndex--;
                        }
                        let oCurrentField = oTable.getItems()[oTable._currentIndex].getCells()[oTable._rowIndexOfInputFields];
                        let currentLine = oTable.getItems()[oTable._currentIndex];
                        oCurrentField.focus();
                        //Highlight selected field
                        currentLine.addStyleClass('selectedMaterial');
                        jQuery.sap.delayedCall(100, null, function () {
                            oCurrentField.selectText(0, oCurrentField.getValue().length)
                        });
                        that.gravaValores(false);
                    }

                })
            }

        },

        _handlePedCriadoPrint: function (oEvent) {
            var globalModel = this.getModel("modelGlobalData");
            var localModel = this.getModel();

            for (var i = 0; i < aPOCreated.length; i++) {
                var sObjectPath = this.getModel().createKey("/PrnPedidoSet", {
                    // Ebeln: globalModel.oData.Pedido
                    Ebeln: aPOCreated[i]
                });
            
                var sURL = this.getModel().sServiceUrl + sObjectPath + "/$value";
                window.open(sURL);
            }
        },

        _handlePedCriadoClose: function (oEvent) {
            this.getRouter().navTo('mainPage');
        },

        _handlePedCriadoEmail: function (oEvent) {
            var globalModel = this.getModel("modelGlobalData");
            var localModel = this.getModel();
            var aFilters = [];

            for (var i = 0; i < aPOCreated.length; i++) {
                //var sEbeln = globalModel.oData.Pedido;
                var sEbeln = aPOCreated[i];
                aFilters.push(new sap.ui.model.Filter("Ebeln", sap.ui.model.FilterOperator.EQ, sEbeln));
            }

            var sEmailComprador = sap.ui.getCore().byId('idPopoverEmail--emailComprador').getValue();
            aFilters.push(new sap.ui.model.Filter("emailComprador", sap.ui.model.FilterOperator.EQ, sEmailComprador));
            aFilters.push(
                new sap.ui.model.Filter(
                    'ckbComprador',
                    sap.ui.model.FilterOperator.EQ,
                    sap.ui.getCore().byId('idPopoverEmail--ckbComprador').getSelected()
                )
            );
            aFilters.push(
                new sap.ui.model.Filter(
                    'emailFornecedor',
                    sap.ui.model.FilterOperator.EQ,
                    sap.ui.getCore().byId('idPopoverEmail--emailFornecedor').getValue()
                )
            );
            aFilters.push(
                new sap.ui.model.Filter(
                    'ckbFornecedor',
                    sap.ui.model.FilterOperator.EQ,
                    sap.ui.getCore().byId('idPopoverEmail--ckbFornecedor').getSelected()
                )
            );
            aFilters.push(
                new sap.ui.model.Filter(
                    'ckbLojas',
                    sap.ui.model.FilterOperator.EQ,
                    sap.ui.getCore().byId('idPopoverEmail--ckbLojas').getSelected()
                )
            );
            sap.ui.core.BusyIndicator.show();
            localModel.read('/MailPedidoSendSet', {
                method: 'GET',
                filters: aFilters,
                success: function (oData2, oResponse) {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.success(this.getText('email_sucesso'), {
                        title: 'Email',
                        actions: [MessageBox.Action.OK],
                        initialFocus: MessageBox.Action.OK,
                        styleClass: sResponsivePaddingClasses,
                    });
                },
                error: function (oError) { },
            });
            this._popoverEmail.close();
        },

        _openPedCriadoEmail: function (oEvent) {
            var oButton = oEvent.getSource();
            if (!this._popoverEmail) {
                this._popoverEmail = sap.ui.xmlfragment("idPopoverEmail", "dma.zedlloja.view.fragments.popoverEmail", this);
                this.getView().addDependent(this._popoverEmail);
            }

            this._popoverEmail.openBy(oButton);

            var globalModel = this.getModel('modelGlobalData');
            var localModel = this.getModel();
            var sObjectPath = localModel.createKey('/MailPedidoGetSet', {
                //Ekgrp: globalModel.getProperty('/Ekgrp'),
                //Lifnr: globalModel.getProperty('/Lifnr'),
                Ekgrp: globalModel.oData.Ekgrp,
                Lifnr: globalModel.oData.Lifnr
            });

            localModel.read(sObjectPath, {
                method: 'GET',
                success: function (oData2, oResponse) {
                    //cabec.setNumber({ path: oData2.Total, formatter: '.format.currencyValue' });
                    sap.ui
                        .getCore()
                        .byId('idPopoverEmail--emailComprador')
                        .setValue(oData2.Comprador);
                    sap.ui
                        .getCore()
                        .byId('idPopoverEmail--emailFornecedor')
                        .setValue(oData2.Fornecedor);
                },
                error: function (oError) { },
            });
        },

        _handlePopoverEmailClose: function (oEvt) {
            this._popoverEmail.close();
        },

        onPressFaceamento: function (oEvent) {
            var sWerks = this.getGlobalData("Werks");
            var sMatnr = oEvent.getSource().getParent().getAggregation('cells')[0].getProperty('text')

            var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
            var hashUrl = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                    target: {
                        semanticObject: "faceaMaterial",
                        action: "solicitacao"
                            },
                        params : { "p_werks" : sWerks,
                                   "p_matnr" : sMatnr
                                 }
                    }));
            oCrossAppNavigator.toExternal({target: {shellHash: hashUrl}});
        }
    });
});