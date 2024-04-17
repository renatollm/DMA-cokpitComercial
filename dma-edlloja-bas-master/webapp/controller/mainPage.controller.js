sap.ui.define([
    // "sap/ui/core/mvc/Controller"
    "dma/zedlloja/controller/BaseController",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    'sap/ui/model/json/JSONModel',
    "sap/ui/model/Filter",
    "sap/ui/core/format/DateFormat",
    "sap/ui/unified/DateRange",
    "dma/zedlloja/controller/formatter"
], function (BaseController, Fragment, MessageBox, JSONModel, Filter, DateFormat, DateRange, formatter) {
		"use strict";

		//return Controller.extend("dma.zedlloja.controller.mainPage", {
		return BaseController.extend("dma.zedlloja.controller.mainPage", {
            formatter: formatter,
            _oTableCalendar: null,
            _oCalendarLegend: null,
            _oCalendar: null,
            _oComboLojas: null,

            onInit: function () {
                this._oCalendarLegend = this.getView().byId("idCalendarLegend1");
                this._oTableCalendar = this.getView().byId('idTableCalendar');            
                this._oCalendar = this.getView().byId("idCalendar1");
                //this._oCalendarLegend.setStandardItems([]);
            },

            onHistorico: function(oEvent) {
				this.getRouter().navTo("histCabec", {
					Werks: this.getGlobalData("Werks")
				}, true);
            },

            handleCalendarSelect: function(oEvent){                
                this.saveGlobalData("DataSelecionada", this._oCalendar.getSelectedDates()[0].getProperty("startDate"));
                this.saveGlobalData("DataSelecionadaBr", this._oCalendar.getSelectedDates()[0].getProperty("startDate").toLocaleDateString('pt-BR', {timeZone: 'UTC'}));
                // grava data inicio e fim do agendamento
                this.saveGlobalData("DataInicio", this.getGlobalData("DataSelecionada"));
                //this.saveGlobalData("DataFim", this.getGlobalData("DataSelecionada"));

                let oDateEnd = new Date(this.getGlobalData("DataSelecionada"));
                oDateEnd.setMonth(oDateEnd.getMonth() + 6);                
                this.saveGlobalData("DataFim", oDateEnd);

                this.updateSchedule(this._oCalendar);
            },

            updateSchedule: function(oCalendar){
                const oModel            = this.getView().getModel(),
                      oModelCalendar    = this.getView().getModel("modelCalendarDate"),
                      oModelSelected    = this.getView().getModel("modelSelectedCalendarDate"),
                      oData             = oModel.getData();

                const sLoja             = this.getGlobalData("Werks"),
                      sUsuario          = this.getGlobalData("Usuario");
                
                let aFilters = [];

                if(this._oCalendar.getSelectedDates()[0].getProperty("startDate") >= (new Date().setHours(0,0,0,0))){
                    this.getView().byId("idButtonAddSchedule").setEnabled(true);
                }else{
                    this.getView().byId("idButtonAddSchedule").setEnabled(false);
                }

                this.getView().setBusy(true);
                oModelSelected.setData([]);
//--------------------------------------------------------------------//
// Load CalendarSet data
//--------------------------------------------------------------------//
/*
                aFilters.push(new sap.ui.model.Filter({
                    path: "Gerenteloja",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: sUsuario
                }));
*/                
                aFilters.push(new sap.ui.model.Filter({
                    path: "Werks",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: sLoja
                }));
                let startDate = this._oCalendar.getSelectedDates()[0].getProperty("startDate");
                if (startDate != null) {
                    if (startDate.setHours(0,0,0,0) === (new Date().setHours(0,0,0,0))) {
                        aFilters.push(new sap.ui.model.Filter({
                            path: "Data",
                            operator: sap.ui.model.FilterOperator.LE,
                            value1: `${this.getGlobalData("DataSelecionadaBr").slice(6, 10)}-${this.getGlobalData("DataSelecionadaBr").slice(3, 5)}-${this.getGlobalData("DataSelecionadaBr").slice(0, 2)}T00:00:00`
                        }));
                    } else {
                        aFilters.push(new sap.ui.model.Filter({
                            path: "Data",
                            operator: sap.ui.model.FilterOperator.EQ,
                            value1: `${this.getGlobalData("DataSelecionadaBr").slice(6, 10)}-${this.getGlobalData("DataSelecionadaBr").slice(3, 5)}-${this.getGlobalData("DataSelecionadaBr").slice(0, 2)}T00:00:00`
                        }));
                    }
                }

                oModelCalendar.read(
                    "/AgendaDiaSet",
                    {
                        filters: aFilters,
                        success: function(oData, oResponse){
                            let aJson = [];

                            for(let sIndex in oData.results){
                                let dateToday = new Date();
                                //let utcDateToday = new Date(dateT.getFullYear(), dateT.getMonth(), dateT.getDate(),0,0,0);

                                let dateAgenda = new Date(oData.results[sIndex].Data);
                                //let utcDateAgenda = new Date(oData.results[sIndex].Data.getUTCFullYear(),oData.results[sIndex].Data.getUTCMonth,oData.results[sIndex].Data.getUTCDate,0,0,0);

                                aJson.push({
                                    "Fornecedor"      : oData.results[sIndex].Lifnr,
                                    "NomeFornecedor"  : oData.results[sIndex].Nomefornecedor,
                                    "Data"            : dateAgenda,
                                    "QtdPedidos"      : oData.results[sIndex].Qtdpedido,
                                    "Periodico"       : oData.results[sIndex].Periodico,
                                    //"Status"          : oData.results[sIndex].Status,
                                    "TotalItens"      : oData.results[sIndex].Itens,
                                    "ValorBRL"        : oData.results[sIndex].Valorbrl != '' ? Number(oData.results[sIndex].Valorbrl) : oData.results[sIndex].Valorbrl,
                                    "VolumeKG"        : oData.results[sIndex].Volumekg,
                                    //"Entrega"         : oData.results[sIndex].Entrega
                                    "Icone"           : oData.results[sIndex].Icone,
                                    "Cor"             : oData.results[sIndex].Cor,
                                    "IconePeriodico"  : oData.results[sIndex].Periodico === 'X' ? "sap-icon://date-time" : null,
                                    "CorPeriodico"    : "#000000",
                                    "Atraso"          : oData.results[sIndex].Atraso,
                                    "Delete"          : ( oData.results[sIndex].Atraso == 0 &&
                                                          dateAgenda.getTime() >= dateToday.getTime() )
                                });
                            }

                            if(aJson.length){
                                if(Array.isArray(oModelSelected.getData())){
                                    if(oModelSelected.getData().length){
                                        oModelSelected.getData().concat(aJson);
                                    }else{
                                        oModelSelected.setData(aJson);
                                    }
                                }else{
                                    oModelSelected.setData(aJson);
                                }

                                oModelSelected.refresh(true);
                            }

                            this.getView().setBusy(false);
                        }.bind(this),
                        error: function(oError){
                            this.getView().setBusy(false);
                        }.bind(this)
                    }
                );
            },

            onChangeDataInicio: function(oEvent){
                this.saveGlobalData("DataInicio", oEvent.getSource().getDateValue());
            },

            onChangeDataFim: function(oEvent){
                this.saveGlobalData("DataFim", oEvent.getSource().getDateValue());
            },

            onFragmentPedido: function(oEvent){

            },

            toPedido: function(oEvent){
                this.saveGlobalData("Lifnr",oEvent.oSource.getCells()[3].getProperty('text'));


                //this.saveGlobalData("DtRemessa", this.byId("idDtRemessa").getDateValue());
                //this.saveGlobalData("TpPedido", this.byId("idComboPedido").getSelectedItem().getProperty("key"));

            // Início: RLLm Ajuste temporário para teste
                // var dt_remessa = sap.ui.core.format.DateFormat.getDateInstance({
                //    pattern: 'YYYYMMdd',
                // }).format(this.getGlobalData("DtRemessa"));

                //var sObjectPath = this.getModel().createKey("/CargaPedidoSet", {
                //    Lifnr: this.getGlobalData("Lifnr"),
                //    Werks: this.getGlobalData("Werks"),
                //    TpPedido: this.getGlobalData("TpPedido"),
                //    DtRemessa: dt_remessa,
                //});
                var sObjectPath = this.getModel().createKey("/CargaPedidoSet", {
                    Lifnr: this.getGlobalData("Lifnr"),
                    Werks: this.getGlobalData("Werks"),
                    TpPedido: "NB",
                    DtRemessa: "20231231",
                });

            // Fim: RLLM

                sap.ui.core.BusyIndicator.show();
                this.getView().getModel().read(sObjectPath, {
                    method: 'GET',
                    success: (oData, oResponse) => {
                        sap.ui.core.BusyIndicator.hide();
                        if (oData.Mensagem === 'ok') {
                            this.getRouter().navTo(
                                'detailPage', {
                                    Lifnr: this.getGlobalData("Lifnr"),
                                    Werks: this.getGlobalData("Werks")
                                },
                                true
                            );
                        } else {
                            sap.m.MessageBox.error("Não foram encontrados dados para criação do pedido" , {
                                title: "Erro",
                                actions: [sap.m.MessageBox.Action.OK],
                                initialFocus: sap.m.MessageBox.Action.OK,
                                styleClass: "sapUiSizeCompact"
                            });
                       }
                    },
                    error: function (oError) { 
                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageBox.error("Erro na carga dos dados de Loja/Fornecedor" , {
                         		title: "Erro",
                         		actions: [sap.m.MessageBox.Action.OK],
                         		initialFocus: sap.m.MessageBox.Action.OK,
                                 styleClass: "sapUiSizeCompact"
                         	});
                    },
                });
            },

            /**
             * 
             * @param {sap.ui.base.Event} oEvent - Data of the event triggered 
             */
            onFragmentCancelAddSchedule: function(oEvent){
                //this.byId("fragmentAddSchedule").close();
                this._FragmentAddSchedule.close();
                this._FragmentAddSchedule.destroy(true);
                this._FragmentAddSchedule = undefined;
            },
            
            
            /**
             * 
             * @param {sap.ui.base.Event} oEvent - Data of the event triggered
             */
            onFragmentSaveAddSchedule: function(oEvent){
                let bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
                const oModel = this.getView().getModel();
                
                this._FragmentAddSchedule.setBusy(true);
/*
                1- verifica se existe schedule para data
                    a. existe, é periódico?
                        1. caso positivo, deseja apagar todos os agendamentos a partir da data
                            a. positivo. elimina todos agendamentos a partir da data,
                               elimina registro de schedule zmmt441
                            b. negativo, abandona
                        2. negativo, deseja apagar agendamento na data?
                            a. positivo, elimina agendamento na data
                            b. negativo, abandona
                        b. se for periódico pergunta se deseja apagar todos os agendamentos a partir da data
                    b. não existe, cria agendamento conforme solicitado
*/
                let rbIntervalo = (sap.ui.getCore().byId("rbPeriod1").getSelected() === true ? "1" : "" );
                rbIntervalo = (sap.ui.getCore().byId("rbPeriod2").getSelected() === true ? "2" : rbIntervalo );
                rbIntervalo = (sap.ui.getCore().byId("rbPeriod3").getSelected() === true ? "3" : rbIntervalo );

                let rbDiaSemana = (sap.ui.getCore().byId("rbDay1").getSelected() === true ? "1" : "" );
                rbDiaSemana = (sap.ui.getCore().byId("rbDay2").getSelected() === true ? "2" : rbDiaSemana );
                rbDiaSemana = (sap.ui.getCore().byId("rbDay3").getSelected() === true ? "3" : rbDiaSemana );
                rbDiaSemana = (sap.ui.getCore().byId("rbDay4").getSelected() === true ? "4" : rbDiaSemana );
                rbDiaSemana = (sap.ui.getCore().byId("rbDay5").getSelected() === true ? "5" : rbDiaSemana );
                rbDiaSemana = (sap.ui.getCore().byId("rbDay6").getSelected() === true ? "6" : rbDiaSemana );
                rbDiaSemana = (sap.ui.getCore().byId("rbDay7").getSelected() === true ? "7" : rbDiaSemana );
 
                let rbTime = (sap.ui.getCore().byId("rbTime1").getSelected() === true ? "1" : "" );
                rbTime = (sap.ui.getCore().byId("rbTime2").getSelected() === true ? "2" : rbTime );
                rbTime = (sap.ui.getCore().byId("rbTime3").getSelected() === true ? "3" : rbTime );
                rbTime = (sap.ui.getCore().byId("rbTime4").getSelected() === true ? "4" : rbTime );

                let dataFim = sap.ui.getCore().byId("endDateAgendam").getDateValue()
                //this._oCalendar.getSelectedDates()[0].getProperty("startDate");

                // faz a inserção do registro de agendamento/periodicidade
                let oJson = {
                    "Werks"       : this.getGlobalData("Werks"),
                    "Lifnr"       : sap.ui.getCore().byId("idFragmentInputSupplier").getValue(), //this.getGlobalData("Fornecedor"),
                    "Data"        : `${this.getGlobalData("DataSelecionada").toLocaleDateString('fr-CA', {timeZone: 'UTC'})}T00:00`,
                    "DataFim"     : `${dataFim.toLocaleDateString('fr-CA', {timeZone: 'UTC'})}T00:00`,
                    "Repetir"     : (sap.ui.getCore().byId("ckbRepetir").getSelected() === true ? "X" : ""),
                    "Busca"       : "",
                    "Intervalo"   : rbIntervalo,
                    "DiaSemana"   : rbDiaSemana,
                    "Horario"     : rbTime,
                    "HorarioHora" : sap.ui.getCore().byId("TP2")
                };
 
                oModel.create( "/CalendarioSet", oJson, {
                        success: (oData, oResponse) => {
                            this._FragmentAddSchedule.setBusy(false);
                            this._FragmentAddSchedule.close();
                            this._FragmentAddSchedule.destroy(true);
                            this._FragmentAddSchedule = undefined;
                            sap.m.MessageBox.success(
                                this.getText("agendamento_cadastrado"),
                                {
                                    styleClass: bCompact ? "sapUiSizeCompact" : ""
                                }
                            );

                            //sap.ui.getCore().byId("idFragmentInputSupplier").setValue("");
                            this.reloadCalendar();
                            this.reloadDate();
                        },
                        error: (oError) => {
                            this._FragmentAddSchedule.setBusy(false);
                            this._FragmentAddSchedule.close();
                            this._FragmentAddSchedule.destroy(true);
                            this._FragmentAddSchedule = undefined;
                            MessageBox.error(
                                "Erro ao cadastrar o agendamento.",
                                {
                                    styleClass: bCompact ? "sapUiSizeCompact" : ""
                                }
                            );
                            this.reloadCalendar();
                        }
                    }
                );
                
            },
            /**
             * 
             * @param {sap.ui.base.Event} oEvent - Data of the event triggered
             */
            onAddSchedule: function(oEvent){
                let bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;

                this.saveGlobalData("Repetir", false);
                if (this._oCalendar.getSelectedDates().length > 0){
                    // Cria o fragmento (ajuda de pesquisa)
                    if (!this._FragmentAddSchedule) {
                        this._FragmentAddSchedule = sap.ui.xmlfragment("dma.zedlloja.view.fragments.addSchedule", this);
                        this.getView().addDependent(this._FragmentAddSchedule);
                    }
                    this._FragmentAddSchedule.open();
                } else {
                    MessageBox.information(
                        "Selecionar uma data no calendário.",
                        {
                            styleClass: bCompact ? "sapUiSizeCompact" : ""
                        }
                    );
                    sap.ui.getCore().setBusy(false);
                }
            },


            /**
             * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
             * (NOT before the first rendering! onInit() is used for that one!).
             * @memberOf dma.zedlloja.view.mainPage
             */
            onBeforeRendering: function() {
                this._oCalendar.destroySpecialDates();
                this._oCalendarLegend.destroyItems();
                //this.loadCalendar();
            },
            onAfterRendering: function() {
                this.loadCalendar();
            },
            onLojaChange: function(oEvent){
                this.saveGlobalData("Werks", oEvent.getSource().getSelectedKey());
                this._oCalendar.destroySpecialDates();
                this._oCalendarLegend.destroyItems();
                this.reloadCalendar();
            },
            loadLojas: function(oEvent){
                const oModel = this.getView().getModel();
                const sUname = this.sUname = window.location.href.includes("trial") ? "9067001" : sap.ushell.Container.getUser().getId();
                this.saveGlobalData("Usuario", sUname);
                this.saveGlobalData("Repetir", false);
                let aFilters = [];
                
                this.getView().setBusy(true);
                aFilters.push(new sap.ui.model.Filter({
                    path: "Usuario",
                    operator: sap.ui.model.FilterOperator.EQ,
                    //value1: `'${sUname}'`
                    value1: sUname
                }));

                oModel.read(
                    "/LojasSet",
                    {
                        filters: aFilters,
                        success: (oData, oResponse) => {
                            this.getView().setBusy(false);
                            var comboBox = this.getView().byId("idComboLojas");
                            comboBox.setSelectedKey(oData.results[0].Loja);
                            this.saveGlobalData("Werks", oData.results[0].Loja);
                            this.reloadCalendar();
                        },
                        error: (oError) => {
                            this.getView().setBusy(true);
                        }
                    }
                )
            }, 
            loadCalendar: function(oEvent){
                const oModel = this.getView().getModel();
                const sUname = this.sUname = window.location.href.includes("trial") ? "9067001" : sap.ushell.Container.getUser().getId();
                let bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;

                this.saveGlobalData("Usuario", sUname);
                this.saveGlobalData("Repetir", false);
                let aFilters = [];
                this.getView().setBusy(true);
                this.loadLojas(oEvent);

                /*
                aFilters.push(new sap.ui.model.Filter({
                    path: "Usuario",
                    operator: sap.ui.model.FilterOperator.EQ,
                    //value1: `'${sUname}'`
                    value1: sUname
                }));

                oModel.read(
                    "/LojasSet",
                    //sObjectPath,  //"/UsuarioLojaSet",
                    {
                        filters: aFilters,
                        success: (oData, oResponse) => {
                            this.getView().setBusy(false);
                            this.saveGlobalData("Werks", oData.results[0].Loja);
                            this.reloadCalendar();
                        },
                        error: (oError) => {
                            MessageBox.error(
                                "Erro ao carregar os dados do usuário logado.",
                                {
                                    styleClass: bCompact ? "sapUiSizeCompact" : ""
                                }
                            );
                            this.getView().setBusy(false);
                        }
                    }
                ); */

                this.initConfigData();
                this.resetCalendarLegend();
            },

            resetCalendarLegend: function () {
                this._oCalendarLegend.removeAllItems();
                this._oCalendar.destroySpecialDates();
                this._oCalendarLegend.destroyItems();

                // Add legend
                this._oCalendarLegend.setStandardItems( 'Today' );
                this._oCalendarLegend.addItem(
                    new sap.ui.unified.CalendarLegendItem({
                        text: "Semanal",
                        type: "Type02"
                    })
                );
                this._oCalendarLegend.addItem(
                    new sap.ui.unified.CalendarLegendItem({
                        text: "Quinzenal",
                        type: "Type06"
                    })
                );
                this._oCalendarLegend.addItem(
                    new sap.ui.unified.CalendarLegendItem({
                        text: "Mensal",
                        type: "Type08"
                    })
                );
            },
            reloadCalendar: function(){
                const oModel = this.getView().getModel();
                let aFilters = [];

                this.resetCalendarLegend();
//--------------------------------------------------------------------//
// Load CalendarioSet data
//--------------------------------------------------------------------//
                aFilters.push(new sap.ui.model.Filter({
                    path: "Werks",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: this.getGlobalData("Werks")
                }));

                let oDateRange = new Date();
                oDateRange.setDate(1);
                oDateRange.setMonth(oDateRange.getMonth() - 1);
                aFilters.push(new sap.ui.model.Filter({
                    path: "Data",
                    operator: sap.ui.model.FilterOperator.GE,
                    value1: `${oDateRange.toLocaleDateString('fr-CA', {timeZone: 'UTC'})}T00:00`
                }));

                oDateRange.setMonth(oDateRange.getMonth() + 2);
                aFilters.push(new sap.ui.model.Filter({
                    path: "Data",
                    operator: sap.ui.model.FilterOperator.LT,
                    value1: `${oDateRange.toLocaleDateString('fr-CA', {timeZone: 'UTC'})}T00:00`
                }));
                let oDateNow = new Date(this._oCalendar.getStartDate());
                aFilters.push(new sap.ui.model.Filter({
                    path: "FirstDay",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: [ oDateNow.getFullYear(),
                        ('0' + (oDateNow.getMonth() + 1)).slice(-2),
                        ('0' + oDateNow.getDate()).slice(-2)
                      ].join('')
                }));

                oModel.read( "/CalendarioSet", {
                        filters: aFilters,
                        success: function(oData, oResponse){

                            for(let iIndex in oData.results){
                                let oDate = new Date(oData.results[iIndex].Data);
                                let iType, iText;
                                oDate.setDate(oDate.getDate() + 1);
 
                                if (oData.results[iIndex].Intervalo === '1') {
                                    iType = "Type02";
                                };
                                if (oData.results[iIndex].Intervalo === '2') {
                                    iType = "Type06";
                                };
                                if (oData.results[iIndex].Intervalo === '3') {
                                    iType = "Type08";
                                };
                                this._oCalendar.addSpecialDate(
                                    new sap.ui.unified.DateTypeRange({
                                        startDate   : oDate,
                                        // endDate     : new Date(oDateEnd),
                                        type: iType
                                    })
                                );     
                        }
                            
                            this.getView().setBusy(false);
                        }.bind(this),
                        error: function(oError){
                            this.getView().setBusy(false);
                        }.bind(this)
                    }
                );
                this.reloadDate();
            },


//----------------------------------------------------------------------//
// Fornecedor                                                           //
//----------------------------------------------------------------------//
            /**
             * Evento acionado ao abrir o Search Help do campo "idMultiInputFornecedorCod1", onde é acionado o
             * fragmento "ShFornecedor".
             * Carrega os dados previamente selecionados no "SelectDialog" e aplica filtro dos campos
             * que tem interdependência.
             * @public
             * @param {sap.ui.base.Event} oEvent - Dados do evento acionado
             */
            onValueHelpFornecedoresOpen: function(oEvent){
                // Cria o fragmento (ajuda de pesquisa)
                if (!this._ShFornecedorDialog) {
                    this._ShFornecedorDialog = sap.ui.xmlfragment("dma.zedlloja.view.fragments.ShFornecedor", this);
                    this.getView().addDependent(this._ShFornecedorDialog);
                }

                // this.onValueHelpRememberSelections("idMultiInputFornecedorCod1", this._ShFornecedorDialog);

                this.onValueHelpFornecedoresPreFilter(oEvent);
                this._ShFornecedorDialog.open();
            },

            /**
             * Aplica os filtros dos campos que tem interdependência para o campo "idMultiInputFornecedorCod1".
             * @public
             * @param {sap.ui.base.Event} oEvent - Dados do evento acionado
             */
            onValueHelpFornecedoresPreFilter: function(oEvent){
                let aFilters = [];
                let oFilter = "";

                aFilters.push(new sap.ui.model.Filter({
                    path: "Werks",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: this.getGlobalData("Werks")
                }));
                oFilter = new sap.ui.model.Filter( aFilters, false );
                // Define filters
                this._ShFornecedorDialog.getBinding("items").filter(oFilter); // Multiple filter (array), parameter "true" = AND operator
            },


            /**
             * Aplica no campo "idMultiInputFornecedorCod1" os valores selecionados no "SelectDialog" do fragmento.
             * @public
             * @param {sap.ui.base.Event} oEvent - Dados do evento acionado
             */
            onValueHelpFornecedoresClose: function (oEvent) {
                // this.onValueHelpClose(oEvent, "idFragmentInputSupplier", this.getFromType().TITLE); // Only for MultiInput
                sap.ui.getCore().byId("idFragmentInputSupplier").setValue(oEvent.getParameters().selectedItem.getTitle());
                this.saveGlobalData("Fornecedor", oEvent.getParameters().selectedItem.getTitle());
                this.saveGlobalData("FornecedorNome", oEvent.getParameters().selectedItem.getDescription());
            },


            /**
             * Evento acionado ao clicar no botão "Cancelar" do "SelectDialog" do campo "idMultiInputFornecedorCod1".
             * @public
             * @param {sap.ui.base.Event} oEvent - Dados do evento acionado
             */
            onValueHelpFornecedoresCancel: function (oEvent) {

            },


            /**
             * Evento acionado ao clicar no botão de pesquisa do "SelectDialog" para o campo "idMultiInputFornecedorCod1".
             * Aplica os filtros dos campos que tem interdependência para o campo "idMultiInputFornecedorCod1".
             * @public
             * @param {sap.ui.base.Event} oEvent - Dados do evento acionado
             */
            onValueHelpFornecedoresSearch: function(oEvent){
                let aFilters = [];
                let oBinding = oEvent.getSource().getBinding("items");
                
                this.buildSingleFilter(aFilters, "Name1", sap.ui.model.FilterOperator.Contains, oEvent);

                aFilters.push(new sap.ui.model.Filter({
                    path: "Werks",
                    operator: sap.ui.model.FilterOperator.EQ,
                    value1: this.getGlobalData("Werks")
                }));

/*
                // Set previous filter - if "Comprador" is filled (Multiple)
                this.buildArrayFilter(aFilters, "idMultiInputCompradorCod1", "Ekgrp", FilterOperator.EQ, false);
*/

                if(aFilters.length > 0){
                    oBinding.filter(new sap.ui.model.Filter(aFilters, true)); // Multiple filter (array), parameter "true" = AND operator
                }else{
                    oBinding.filter([]);
                }
            },
            onCkbRepetir: function(oEvent){
                this.saveGlobalData("Repetir", sap.ui.getCore().byId("ckbRepetir").getSelected());
            },
            onDelete: function(oEvent){
                let linha = oEvent;
                const oModel = this.getView().getModel();
                let bDataSelecionada = this.getGlobalData("DataSelecionada");
                let lv_fornec = oEvent.getSource().getParent().getAggregation('cells')[3].getProperty('text');

                let sObjectPath = oModel.createKey(
                    "/CalendarioSet",
                    {
                        Werks: this.getGlobalData("Werks"),
                        Data: bDataSelecionada,
                        Lifnr: lv_fornec,
                        Repetir: ''
                    }
                );

                this.getView().setBusy(true);
                oModel.read( sObjectPath, {
                        //filters: aFilters,
                        success: function(oData, oResponse){
                            this.getView().setBusy(false);
                            if (oResponse.data.Repetir === 'Z'){
                                sap.m.MessageBox.error(this.getText("msg_nao_encontrado"),
                                {
                                    styleClass: "sapUiSizeCompact"
                                });
                            } else {
                                if (oResponse.data.Repetir === 'X'){
                                    // Agendamento periódico
                                    sap.m.MessageBox.confirm(this.getText("msg_periodico"), {
                                        title: this.getText("msg_periodico_title"),
                                        actions: [
                                            sap.m.MessageBox.Action.YES,
                                            sap.m.MessageBox.Action.NO,
                                            sap.m.MessageBox.Action.CANCEL
                                        ],
                                        emphasizedAction: sap.m.MessageBox.Action.YES,
                                        initialFocus: sap.m.MessageBox.Action.YES,
                                        onClose: (oAction) => {
                                            if (oAction === sap.m.MessageBox.Action.YES) {
                                                let sObjectPath = oModel.createKey(
                                                    "/CalendarioSet",
                                                    {
                                                        Werks: this.getGlobalData("Werks"),
                                                        Data: bDataSelecionada,
                                                        Lifnr: lv_fornec,
                                                        Repetir: 'X'
                                                    }
                                                );
                                                oModel.remove( sObjectPath, {
                                                    success: function(oData, oResponse){
                                                        sap.m.MessageBox.success(this.getText("msg_eliminado"),
                                                        {
                                                            styleClass: "sapUiSizeCompact"
                                                        });                        
                                                        this.reloadCalendar();
                                                        this.reloadDate();      
                                                    }.bind(this),
                                                    error: function(oError){
                                                        sap.m.MessageBox.error(this.getText("msg_nao_encontrado"),
                                                        {
                                                            styleClass: "sapUiSizeCompact"
                                                        });
                                                    }.bind(this)
                                                })
                                            }
                                            if (oAction === sap.m.MessageBox.Action.NO) {
                                                oModel.remove( sObjectPath, {
                                                    success: function(oData, oResponse){
                                                        sap.m.MessageBox.success(this.getText("msg_eliminado"),
                                                        {
                                                            styleClass: "sapUiSizeCompact"
                                                        });      
                                                        this.reloadCalendar();
                                                        this.reloadDate();
                                                    }.bind(this),
                                                    error: function(oError){
                                                        sap.m.MessageBox.error(this.getText("msg_nao_encontrado"),
                                                        {
                                                            styleClass: "sapUiSizeCompact"
                                                        });
                                                    }.bind(this)
                                                })
                                            }      
                                        }
                                    })
                                }  else {
                                    // Agendamento não periódico
                                    sap.m.MessageBox.confirm(this.getText("msg_nao_periodico"), {
                                        title: this.getText("msg_nao_periodico_title"),
                                        actions: [
                                            sap.m.MessageBox.Action.YES,
                                            sap.m.MessageBox.Action.NO
                                        ],
                                        emphasizedAction: sap.m.MessageBox.Action.YES,
                                        initialFocus: sap.m.MessageBox.Action.YES,
                                        onClose: (oAction) => {
                                            if (oAction === sap.m.MessageBox.Action.YES) {
                                                oModel.remove( sObjectPath, {
                                                    success: function(oData, oResponse){
                                                        sap.m.MessageBox.success(this.getText("msg_eliminado"),
                                                        {
                                                            styleClass: "sapUiSizeCompact"
                                                        });                    
                                                        this.reloadCalendar();    
                                                        this.reloadDate();
                                                    }.bind(this),
                                                    error: function(oError){
                                                        sap.m.MessageBox.error(this.getText("msg_nao_encontrado"),
                                                        {
                                                            styleClass: "sapUiSizeCompact"
                                                        });
                                                    }.bind(this)
                                                })
                                            }
                                        }
                                    })
                                }
                            }
                        }.bind(this),
                        error: function(oError){
                            this.getView().setBusy(false);
                        }.bind(this)
                    }
                );
            },
            reloadDate: function(){
                this._oCalendar.removeAllSelectedDates();
                this._oCalendar.addSelectedDate(new sap.ui.unified.DateRange({startDate: this.getGlobalData("DataSelecionada")}));
                this.updateSchedule(this._oCalendar)
            }
		});
	});
