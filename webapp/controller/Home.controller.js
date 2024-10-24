sap.ui.define([
    "internal/controller/Helper/BaseController",
    "sap/ui/core/UIComponent",

],
    function (BaseController, UIComponent) {
        "use strict";

        return BaseController.extend("internal.controller.Home", {
            onInit: async function () {
                await BaseController.prototype.onInit.apply(this, []);


            },

            press: function (evt) {
                
                var oTile = evt.getSource();
                var oBindingContext = oTile.getBindingContext("tilesHome");
                var sRoute = oBindingContext.getProperty("route");

                var oRouter = UIComponent.getRouterFor(this);
                oRouter.navTo(sRoute);
            },
        });
    });
