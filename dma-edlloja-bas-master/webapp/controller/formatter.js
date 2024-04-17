sap.ui.define([], function () {
	"use strict";
	return {
		defineIconColorByDate: function(oDate){
            //debugger;
            let oActualDate     = new Date(),
                // oAdjustedDate   = new Date();
                oAdjustedDate   = new Date(oDate);
            oAdjustedDate.setDate(oDate.getDate() + 1);

            let fDiffDateInMs   = oActualDate - oAdjustedDate;
            let fDiffDateInDays = fDiffDateInMs / (1000 * 60 * 60 * 24);

            if(fDiffDateInDays < 1){
                return "#00FF00";
            }else if(fDiffDateInDays <= 2){
                return "#FFFF00";
            }else{
                return "#FF0000"; 
            }
        },
		defineIconByDate: function(oDate){
            //debugger;
            let oActualDate     = new Date(),
                // oAdjustedDate   = new Date();
                oAdjustedDate   = new Date(oDate);
            oAdjustedDate.setDate(oDate.getDate() + 1);

            let fDiffDateInMs   = oActualDate - oAdjustedDate;
            let fDiffDateInDays = fDiffDateInMs / (1000 * 60 * 60 * 24);

            if(fDiffDateInDays < 1){
                return "sap-icon://appear-offline";
            }else if(fDiffDateInDays <= 2){
                return "sap-icon://lateness";
            }else{
                return "sap-icon://decline";
            }
        },
        defineDaysDiff: function(oDate){
            debugger;
            let oActualDate     = new Date(),
                // oAdjustedDate   = new Date();
                oAdjustedDate   = new Date(oDate);
            oAdjustedDate.setDate(oDate.getDate() + 1);

            let fDiffDateInMs   = oActualDate - oAdjustedDate;
            let fDiffDateInDays = fDiffDateInMs / (1000 * 60 * 60 * 24);

            if(fDiffDateInDays > 0){
                // return Math.floor(fDiffDateInDays);
                return Math.ceil(fDiffDateInDays);
            }else{
                return "";
            }
        },
		fullNumberStr: function (sValue) {
			var number = new Intl.NumberFormat("pt-BR", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			});
			if (!sValue) {
				return "";
			}
			return number.format(sValue).toString();
		},
        zeroEmpty: (sValue) => {
			var number = new Intl.NumberFormat("pt-BR", {
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			});
			if (sValue === "0" || sValue === 0 || sValue === "0.00" || sValue === 0.00) {
				return "";
			}
			return number.format(sValue).toString(); 
        },
        leadingZeroOutput: function(sNum) {
			return parseInt(sNum);
		},
		toInteger: function (sValue) {
			var number = new Intl.NumberFormat("pt-BR", {
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			});
			if (!sValue) {
				return "0";
			}
			return number.format(sValue);
		},
		toIntReqSugStr: function (sValue) {
			var number = new Intl.NumberFormat("pt-BR", {
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			});
			if ((!sValue) || (sValue === 0)) {
				return "0";
			}
			return number.format(sValue).toString();
		},
		zeroToEmpty: function (sValue) {

			var number = new Intl.NumberFormat("pt-BR", {
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			});
			
			if (sValue === "0" || sValue === 0 || sValue === "0.00" || sValue === 0.00) {
				return "0";
			}
			return number.format(sValue).toString(); 
		},
		float2digStr: function (sValue) {
			var number = new Intl.NumberFormat("pt-BR", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			});
			if ((!sValue) || (sValue === 0)) {
				return "";
			}
			return number.format(sValue).toString();
		},
		statusTextFormat: function(sStatus){
            switch (sStatus) {
                case "A": return "Aprovado";
                case "R": return "Reprovado";
                case "P": return "Parcial";
                case "N": return "Aprovado";
                default: return "Aguardando";
            }
		},
		statusStateFormat: function(sStatus){
            switch (sStatus) {
                //case "Aprovado":
                case "A": return sap.ui.core.ValueState.Success;
                //case "Reprovado":
                case "R": return sap.ui.core.ValueState.Error;
                //case "Parcial":
                case "P": return sap.ui.core.ValueState.Warning;
                //case "Não necessita":
                case "N": return sap.ui.core.ValueState.Success;
                //case Falta Aprovação
                default: return sap.ui.core.ValueState.Information;
            }
		},
		statusIconFormat: function(sStatus){
            switch (sStatus) {
                //case "Aprovado":
                case "A": return "sap-icon://sys-enter-2";
                //case "Reprovado":
                case "R": return "sap-icon://sys-cancel-2";
                //case "Não necessita":
                case "N": return "sap-icon://sys-enter-2";
                //case "Parcial":
                case "P": return "sap-icon://sys-cancel-2";
                //case Falta Aprovação
                default: return "sap-icon://sys-help-2";
            }
		},
		dateFormatDdMm: function (a) {
			if (a !== null) {
				var b = new Date(a.getFullYear(), a.getUTCMonth(), a.getUTCDate());
				a = b.toLocaleString("pt-BR", {
					month: "2-digit",
					day: "2-digit"
				});
			} else {
				a = "";
			}
			return a;
		},
    	dateFormat: function (a) {
			if (a !== null) {
				a = a.substring(6,8) + "/" + a.substring(4,6) + "/" + a.substring(0,4);
			} else {
				a = "";
			}
			return a;
		},
        positiveNegative: function(sValue){
            if (sValue <= 0) {
                return "Error";
            } else {
                return "Success";
            }
        }
    }
});