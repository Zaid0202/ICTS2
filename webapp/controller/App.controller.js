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

        this.getView()?.byId('App_id').setBusy(true)

        this.isDarkMode = false;
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
          this.getOwnerComponent().setModel(new sap.ui.model.json.JSONModel({ isShowAllRequest: false }), "isShowAllRequest");

        }


        //-----------Route Part---------
        // var oRouter2 = sap.ui.core.UIComponent.getRouterFor(this);
        // oRouter2.attachRouteMatched(this._onRouteMatched, this);

        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        // Attach routeMatched event for dynamic navigation
        oRouter.attachRouteMatched(this._onRouteMatched, this);

        // Get the current URL hash (e.g., 'RouteNewRequest')
        var oHash = oRouter.getHashChanger().getHash();
        // console.log("App -> _onRouteMatched -> oHash:", oHash);

        // If a hash exists, attempt to find a route based on the hash
        if (oHash) {
          // The route might be correctly identified using the hash (which should match the route pattern)
          var oRoute = oRouter.getRoute(oHash);

          // Check if the route exists
          if (oRoute) {
            // console.log("App -> _onRouteMatched -> oRoute:", oRoute);

            // Since getName() doesn't exist, we manually pass the hash as the route name
            this._onRouteMatched({
              getParameter: function () {
                return oHash; // Return the hash as the route name
              }
            });
          } else {
            console.error("No route found for the current hash:", oHash);
          }
        }
        this.getView()?.byId('App_id').setBusy(false)

        //--------------------

      },

      _onRouteMatched: async function (oEvent) { // Implamints the Rules For Routes.
        var oRouteName = oEvent.getParameter("name");

        // console.log("App -> _onRouteMatched -> oRouteName:", oRouteName)

        var oModelNavList = await this.getOwnerComponent().getModel("navList");
        let oModelNavListData = oModelNavList.getData();

        var allRouteNew = [...oModelNavListData.navigation, ...oModelNavListData.navigationAddtion]


        // Find the object with the matching key
        let foundItem = this.findItem(allRouteNew, oRouteName)
        // console.log("foundItem", foundItem);

        // Check if the roles array contains the role to check
        if (foundItem) {
          if (this.sUserRole.some(role => foundItem.roles.includes(role))) {
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
          this?.byId("themeToggleButton")?.setTooltip("Switch to Dark Mode");
          this?.byId("themeToggleButton")?.setIcon("sap-icon://light-mode");
        } else {
          Configuration.setTheme("sap_horizon_dark"); // Set to dark theme
          this?.byId("themeToggleButton")?.setTooltip("Switch to Light Mode");
          this?.byId("themeToggleButton")?.setIcon("sap-icon://dark-mode");
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
      },


      // Languse ... 
      onChangeLanguage: function () {
        let sNewLanguage = this.getOwnerComponent().changeLanguage();

        // Update button text and tooltip dynamically
        this.updateButtonText(sNewLanguage);
      },

      updateButtonText: function (sLanguage) {
        var sButtonText = sLanguage === "ar" ? "Change to English" : "Change to Arabic";
        var oButton = this.getView().byId("languageChangeButton"); // Assuming you give an ID to your button
        oButton.setText(sButtonText);

        // Optionally update tooltip if needed
        var sTooltipText = sLanguage === "ar" ? "تغيير إلى الإنجليزية" : "Change to Arabic";
        oButton.setTooltip(sTooltipText);
      },

    });
  }
); 