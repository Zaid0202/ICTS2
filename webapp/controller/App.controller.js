sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/tnt/ToolPage",
    "sap/ui/core/routing/Router",
    "sap/ui/core/Fragment",
    "sap/ui/core/Configuration",
    "internal/controller/Helper/UserService",
  ],
  function (Controller,
    UIComponent,
    ToolPage,
    Router,
    Fragment,
    Configuration,
    UserService) {
    "use strict";

    return Controller.extend("internal.controller.App", {
      onInit: async function () {
        this.isDarkMode = true;
        this.onToggleTheme();

        this.oView = this.getView();
        this.oMyAvatar = this.oView.byId("Avatar_id");
        this._oPopover = Fragment.load({
          id: this.oView.getId(),
          name: "internal.fragment.auth.Popover",
          controller: this
        }).then(function (oPopover) {
          this.oView.addDependent(oPopover);
          this._oPopover = oPopover;
        }.bind(this));


        //--------------------
        var oUserModel = await this.getOwnerComponent().getModel("userModel");
        if (!oUserModel) {
          await this.getOwnerComponent().setUserModel()
          oUserModel = await this.getOwnerComponent().getModel("userModel");
        }
        this.sUserRole = await oUserModel.getProperty("/role");

        var oModelNavList = await this.getOwnerComponent().getModel("navList");


        // If the data is already loaded in the model
        if (oModelNavList.getData()) {
          let navData = oModelNavList.getData();
          let filteredNavData = this.getOwnerComponent().filterNavigationByRole(navData.navigation, this.sUserRole);
          oModelNavList.navigation = filteredNavData
          // oModelNavList.setData({ navigation: filteredNavData });
          this.getView().setModel(oModelNavList, "navList");
        }

        // RouteRequestStatusForm
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.attachRouteMatched(this._onRouteMatched, this);

        //--------------------

      },

      _onRouteMatched: async function (oEvent) { // Implamints the Rules For Routes.
        var oModelNavList = await this.getOwnerComponent().getModel("navList");
        let navData = oModelNavList.getData();

        var oRouteName = oEvent.getParameter("name");

        let navD = navData.navigation
        console.log(navData.navigation)
        console.log({navD})
        console.log("navData ", navData)
        console.log("navData.navigationAddtion ", navData)
        navD.push(...navData.navigationAddtion);
        console.log(navData.navigationAddtion)

        // Find the object with the matching key
        let foundItem = navD.find(item => item.key === oRouteName);

        if (foundItem) {
          // Check if the roles array contains the role to check
          if (foundItem.roles.includes(this.sUserRole)) {
            // console.log("Role found:", this.sUserRole, "in", foundItem);
          } else {
            this.getOwnerComponent().getRouter().navTo("RouteHome"); // Redirect to the home view or another default view
            // console.log("Role not found in roles:", foundItem.roles);
          }
        } else {
          sap.m.MessageToast.show("Access Denied! You don't have permission to access this view.");
          this.getOwnerComponent().getRouter().navTo("RouteHome"); // Redirect to the home view or another default view
          // console.log("Key not found:", oRouteName);
        }
      },

      onAfterRendering: function () {
        this.onMenuButtonPress();
      },

      onToggleTheme: function () {
        if (!this.isDarkMode) {
          Configuration.setTheme("sap_horizon"); // Set to normal theme
          this.byId("themeToggleButton").setTooltip("Switch to Dark Mode");
          this.byId("themeToggleButton").setIcon("sap-icon://light-mode");
        } else {
          Configuration.setTheme("sap_horizon_dark"); // Set to dark theme
          this.byId("themeToggleButton").setTooltip("Switch to Light Mode");
          this.byId("themeToggleButton").setIcon("sap-icon://dark-mode");
        }
        this.isDarkMode = !this.isDarkMode;
      },


      onMenuButtonPress: function () {
        var toolPage = this.byId('toolPage');
        if (toolPage) {
          toolPage.setSideExpanded(!toolPage.getSideExpanded());
        }
      },

      onItemSelect: function (ev) {
        var oRouter = UIComponent.getRouterFor(this);
        oRouter.navTo(ev.getParameter('item').getKey())

      },

      onPressAvatar: function (oEvent) {
        var oEventSource = oEvent.getSource(),
          bActive = this.oMyAvatar.getActive();

        this.oMyAvatar.setActive(!bActive);

        if (bActive) {
          this._oPopover.close();
        } else {
          this._oPopover.openBy(oEventSource);
        }
      },

      onPopoverClose: function () {
        this.oMyAvatar.setActive(false);
      },

      onListItemPress: function () {
        this.oMyAvatar.setActive(false);
        this._oPopover.close();
      },

      NewItempress: function (oEvent) {
        var oNewItem = this.byId("NewItemId");
        var sStoredUserId = localStorage.getItem("UserId");
        if (oNewItem) {
          oNewItem.setTitle(sStoredUserId); // Set your desired title
        }

      },

      onNewItemSubmit: function (oEvent) {
        // Get the value from the Input field
        var oInput = this.byId("ChangingUserId");
        var sValue = oInput.getValue();

        // Store the value in local storage
        localStorage.setItem("UserId", sValue);

        // Optional: Log the value to confirm it was saved
        console.log("User ID saved:", sValue);
      }

    });
  }
); 