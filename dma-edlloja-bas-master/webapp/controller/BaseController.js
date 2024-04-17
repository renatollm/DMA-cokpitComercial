sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox"
], function (Controller, UIComponent, History, MessageBox) {
	"use strict";
	
	return Controller.extend("dma.zedlloja.controller.BaseController", {

        initConfigData: function(){
            const oJson = this.getModel("modelConfigData").getData();
            oJson.dateInterval = [
                {
                    key: 0,
                    text: "Nenhum"
                },
                {
                    key: 1,
                    text: "Diário"
                },
                {
                    key: 2,
                    text: "Quinzenal"
                },
                {
                    key: 3,
                    text: "Mensal"
                }
            ];
        },


        /**
         * Constrói um objeto de filtro
         * @public
         * @param {array} aFilters - Array com os objetos de filtro (sap.ui.model.Filter)
         * @param {string} sFilterFieldName - Nome do campo no serviço
         * @param {sap.ui.model.FilterOperator} sOperator - Operador lógico
         * @param {sap.ui.base.Event} oEvt - Dados do evento acionado
         */
        buildSingleFilter: function(aFilters, sFilterFieldName, sOperator, oEvt){
            let oFilter = {};
            let sValue;

            // if(JSON.stringify(oEvt) !== "{}" && JSON.stringify(oEvt) !== "[]"){
            if(Object.keys(oEvt).length > 0 || oEvt.constructor !== Object){
                sValue = oEvt.getParameter("value").toUpperCase();
                if(sValue){
                    oFilter = new sap.ui.model.Filter(sFilterFieldName, sOperator, sValue);
                    aFilters.push(oFilter); // Single filter (not array), don't need operator AND or OR
                }
            }
        },


        /**
         * Acionado quando o SelectDialog é fechado, efetuando a lógica de atualizar os dados no MultiInput
         * @public
         * @param {sap.ui.base.Event} oEvt - Dados do evento acionado
         * @param {string} sId - ID do MultiInput
         * @param {string} sTextGetFrom - Define qual propriedade vai ser utilizada na propriedade "text" do
         * Token (valor padrão = this.getFromType().DESCRIPTION)
         */
        onValueHelpClose: function(oEvt, sId, sTextGetFrom = this.getFromType().DESCRIPTION){
/*
            let aSelectedItems = oEvt.getParameter("selectedItems");
            let enumFromType = this.getFromType();
            let oMultiInput = this.byId(sId);
            let sTextGetFromValue;

            oMultiInput.removeAllTokens();

            if (aSelectedItems && aSelectedItems.length > 0) {
                aSelectedItems.forEach(function (oItem) {
                    switch(sTextGetFrom){
                        case enumFromType.TITLE:
                            sTextGetFromValue = oItem.getTitle();
                            break;
                        case enumFromType.DESCRIPTION:
                            sTextGetFromValue = oItem.getDescription();
                            break;
                        default:
                            break;
                    }

                    oMultiInput.addToken(
                        new Token(
                            {
                                key: oItem.getTitle(),
                                text: sTextGetFromValue
                            }
                        )
                    );
                });
            }
*/
            let aSelectedContexts   = oEvt.getParameter("selectedContexts");
            let enumFromType        = this.getFromType();
            let oModel              = this.getView().getModel(),
                oMultiInput         = this.byId(sId),
                oSelectedItem       = oEvt.getParameter("selectedItem");
            let sTextGetFromValue;

            oMultiInput.removeAllTokens();

            if(aSelectedContexts && aSelectedContexts.length > 0){
                aSelectedContexts.forEach(function(oItem){
                    switch(sTextGetFrom){
                        case enumFromType.TITLE:
                            sTextGetFromValue = oModel.getProperty(oItem.getPath())[oSelectedItem.getBinding("title").getPath()];
                            break;
                        case enumFromType.DESCRIPTION:
                            sTextGetFromValue = oModel.getProperty(oItem.getPath())[oSelectedItem.getBinding("description").getPath()];
                            break;
                        default:
                            break;
                    }
                    
                    oMultiInput.addToken(
                        new Token(
                            {
                                key: oModel.getProperty(oItem.getPath())[oSelectedItem.getBinding("title").getPath()],
                                text: sTextGetFromValue
                            }
                        )
                    );
                });
            }
        },


        /**
         * 
         * @param {*} sPropName 
         */
        getGlobalData: function(sPropName){
            return this.getModel("modelGlobalData").getData()[sPropName];
        },


        /**
         * 
         * @param {*} sPropName 
         * @param {*} sValue 
         */
        saveGlobalData: function(sPropName, sValue){
            const oJson = this.getModel("modelGlobalData").getData();
            oJson[sPropName] = sValue;
        },

		/**
		 * Shortcut to command {this.getView().getModel("MODEL_NAME")}
		 * @param {string} sModelName - Model name configured on "manifest.json"
		 * @returns {sap.ui.model.Model} View model
		 */
		getModel: function (sModelName) {
			return this.getView().getModel(sModelName);
		},

		/**
		 * Shortcut to command {this.getOwnerComponent().getModel("i18n").getResourceBundle()}
		 * @returns {sap/base/i18n/ResourceBundle} I18N resource bundle
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Shortcut to command {UIComponent.getRouterFor(this)}
		 * @returns {sap.ui.core.routing.Router} I18N resource bundle
		 */
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},
		
		/**
		 * Shortcut to command {this.getView().setModel(oModel, "MODEL_NAME")}
		 * @param {sap.ui.model.Model} oModel - Model object
		 * @param {string} sModelName - Model name configured on "manifest.json"
		 * @returns {sap.ui.core.Core} -
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		getText: function(sText){
			return this.getResourceBundle().getText(sText);
		},
		getTextWithParams: function(sText, aParams){
			return this.getResourceBundle().getText(sText,aParams);
		},

        /**
         * 
         * @param {*} sRouteName 
         */
		navBack: function(sRouteName){
			var sPreviousHash = History.getInstance().getPreviousHash();
			
			//The history contains a previous entry
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				// There is no history!
				// replace the current hash with page 1 (will not add an history entry)
				this.getOwnerComponent().getRouter().navTo(sRouteName, null, true);
			}
		}
	});

});