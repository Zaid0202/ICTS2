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

        // this.userService = new UserService(this);

        // // Fetch user data
        // // const userId = '10125'; // Example user ID
        // const userId = '28141'; // Example user ID
        // const userD = await this.userService.getUserD(userId);
        // const userInfoWithRequestTamp = await this.userService.getUserInfoWithRequestTamp(userId);

        // // Create a global JSON model
        // const userModel = new sap.ui.model.json.JSONModel({
        //   userD: userD,
        //   userInfoWithRequestTamp: userInfoWithRequestTamp
        // });

        // // Set the model globally
        // sap.ui.getCore().setModel(userModel, "globalUserModel");

        // // Get the model globally
        // this.userModel = sap.ui.getCore().getModel("globalUserModel");
        // this.userInfo = this.userModel.getProperty("/userD");
        // this.userInfoWithRequestTamp = this.userModel.getProperty("/userInfoWithRequestTamp");

        // console.log("userD", this.userInfo)
        // console.log("userInfoWithRequestTamp", this.userInfoWithRequestTamp)
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