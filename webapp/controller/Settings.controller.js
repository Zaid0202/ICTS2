sap.ui.define(
  [
    "internal/controller/Helper/BaseController",
    "sap/m/MessageBox",
    "sap/ui/core/UIComponent",
  ],
  function (BaseController, MessageBox,UIComponent) {
    "use strict";
    var sResponsivePaddingClasses = "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer";

    return BaseController.extend("internal.controller.Settings", {
      onInit:async function () {
        await BaseController.prototype.onInit.apply(this, []);

        // const navList = this.getOwnerComponent().getModel("navList").getData().navigation

        // let data = navList
        //   .filter(el => el.title2 === "navSettings")[0].items.map(el => {return { title: el.title, subtitle: "Focus Area Tracking", footer: "Focus Area Tracking", unit: "EUR", kpivalue: 12, scale: "k", color: "Good", trend: "Up", route: el.key, icon: el.icon};}); // Filter out elements with title "Home"
         

        // this.getView().setModel(new sap.ui.model.json.JSONModel(data), 'tiles')

      },

      press: function (evt) {
        var oTile = evt.getSource();
        var oBindingContext = oTile.getBindingContext("tilesSettings");
        var sRoute = oBindingContext.getProperty("route");

        var oRouter = UIComponent.getRouterFor(this);
        oRouter.navTo(sRoute);
      },

      // ================================== # ++ Functions # ==================================
      // ================================== # ++ Functions # ==================================
      // ================================== # ++ Functions # ==================================
    });
  }
);
