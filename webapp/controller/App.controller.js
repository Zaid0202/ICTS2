sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/tnt/ToolPage",
    "sap/ui/core/routing/Router",
    "sap/ui/core/Fragment",
    "sap/ui/core/Configuration",
  ],
  function (Controller,
    UIComponent,
    ToolPage,
    Router,
    Fragment,
    Configuration) {
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


        //-----------User Part---------
        var userData = await this.getOwnerComponent().getUserData();
        if (!userData) {
          console.log("NO Uset Data!")
        }
        this.userInfo = userData.userInfo
        this.sUserRole = userData.role
        console.log("App -> this.userInfo", this.userInfo)
        console.log("App -> this.sUserRole", this.sUserRole)

        //-----------Nav Part---------
        var oModelNavList = this.getOwnerComponent().getModel("navList");
        var oModelNavListData = oModelNavList.getData();

        // If the data is already loaded in the model
        if (oModelNavListData) {
          let filteredNavData = this.getOwnerComponent().filterNavigationByRole(oModelNavListData.navigation, this.sUserRole);
          let filteredNavDataAddtion = this.getOwnerComponent().filterNavigationByRole(oModelNavListData.navigationAddtion, this.sUserRole);

          oModelNavListData.navigation = filteredNavData
          oModelNavListData.navigationAddtion = filteredNavDataAddtion

          oModelNavList.setData(oModelNavListData);
          this.getView().setModel(oModelNavList, "navList");
        }


        //-----------Route Part---------
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.attachRouteMatched(this._onRouteMatched, this);
        //--------------------

      },

      _onRouteMatched: async function (oEvent) { // Implamints the Rules For Routes.
        var oRouteName = oEvent.getParameter("name");

        var oModelNavList = await this.getOwnerComponent().getModel("navList");
        let oModelNavListData = oModelNavList.getData();

        var allRouteNew = [...oModelNavListData.navigation, ...oModelNavListData.navigationAddtion]


        // Find the object with the matching key
        let foundItem = this.findItem(allRouteNew, oRouteName)
        console.log("foundItem", foundItem);

        // Check if the roles array contains the role to check
        if (foundItem) {
          if (foundItem.roles.includes(this.sUserRole)) {
          } else {
            this.getOwnerComponent().getRouter().navTo("RouteHome"); // Redirect to the home view or another default view
            sap.m.MessageToast.show("Access Denied! You don't have permission to access this view.");
          }
        } else {
          sap.m.MessageToast.show("Access Denied! You don't have permission to access this view.");
          this.getOwnerComponent().getRouter().navTo("RouteHome"); // Redirect to the home view or another default view
        }
      },

      findItem: function (navD, oRouteName) {
        // First, check if the key exists in the top-level array
        let foundItem = navD.find(item => item.key === oRouteName);

        // If not found at the top level, check inside the "items" array of each object, if it exists
        if (!foundItem) {
          navD.forEach(item => {
            if (item.items && Array.isArray(item.items)) {
              const subItem = item.items.find(sub => sub.key === oRouteName);
              if (subItem) {
                foundItem = subItem;
              }
            }
          });
        }

        return foundItem;
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

      // -----------------For Fast Test Set Uset Id And Role-----------------------
      NewItempress: function (oEvent) {
        var oNewItem = this.byId("NewItemId");
        var sStoredUserId = localStorage.getItem("UserId");
        var sStoredUserRole = localStorage.getItem("UserRole");
        if (oNewItem) {
          oNewItem.setTitle(sStoredUserId + " - " + sStoredUserRole); // Set your desired title
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
      },

      onNewItemSubmitRole: function (oEvent) {
        // Get the value from the Input field
        var oInput = this.byId("ChangingUserRole");
        var sValue = oInput.getValue();

        // Store the value in local storage
        localStorage.setItem("UserRole", sValue);

        // Optional: Log the value to confirm it was saved
        console.log("User Role saved:", sValue);
      }

    });
  }
); 