sap.ui.define([
    "internal/controller/Helper/BaseController",
    "sap/ui/core/UIComponent",

],
    function (BaseController, UIComponent) {
        "use strict";

        return BaseController.extend("internal.controller.Home", {
            onInit: async function () {
                await BaseController.prototype.onInit.apply(this, []);

                // var oUserModel = await this.getOwnerComponent().getModel("userModel");
                // this.sUserRole = await oUserModel.getProperty("/role");

                const navList = await this.getOwnerComponent().getModel("navList").getData().navigation
                let filteredNavData = this.getOwnerComponent().filterNavigationByRole(navList, this.sUserRole);

                let data = filteredNavData
                    .filter(el => el.title !== "Home") // Filter out elements with title "Home"
                    .map(el => {
                        return {
                            title: el.title,
                            subtitle: "Focus Area Tracking",
                            footer: "Focus Area Tracking",
                            unit: "EUR",
                            kpivalue: 12,
                            scale: "k",
                            color: "Good",
                            trend: "Up",
                            route: el.key,
                            icon: el.icon
                        };
                    });

                this.getView().setModel(new sap.ui.model.json.JSONModel(data), 'tiles')
                console.log("Home -> helperModelInstance.getData", this.helperModelInstance.getData())

                // console.log(data)
            },

            press: function (evt) {
                var oTile = evt.getSource();
                var oBindingContext = oTile.getBindingContext("tiles");
                var sRoute = oBindingContext.getProperty("route");

                var oRouter = UIComponent.getRouterFor(this);
                oRouter.navTo(sRoute);
            },
        });
    });
