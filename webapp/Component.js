/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "internal/model/models",
    "sap/f/FlexibleColumnLayoutSemanticHelper",
    "internal/controller/Helper/UserService",



],
    function (UIComponent, Device, models, FlexibleColumnLayoutSemanticHelper, UserService) {
        "use strict";


        return UIComponent.extend("internal.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: async function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                await this.setUserModel()
                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");

            },

            setUserModel: async function () {
                // Check if UserId and UserRole exist in local storage
                var sStoredUserId = localStorage.getItem("UserId");
                var sStoredUserRole = localStorage.getItem("UserRole");

                // Set default values if not found
                if (!sStoredUserId) {
                    sStoredUserId = "22225";
                    localStorage.setItem("UserId", sStoredUserId);
                }

                if (!sStoredUserRole) {
                    sStoredUserRole = "Normal User";
                    localStorage.setItem("UserRole", sStoredUserRole);
                }

                // Use the values
                let userId = sStoredUserId; // Now this is either from localStorage or the default value
                let userRule = sStoredUserRole; // Same as above

                this.userService = new UserService(this, userId);
                await this.userService.onInit()

                this.setModel(new sap.ui.model.json.JSONModel({
                    userInfo: this.userService.userInfo,
                    role: userRule
                }), "userModel");
            },


            // getuserInfo_f: function () { return this.getModel("userModel").getProperty("/userInfo") },

            filterNavigationByRole: function (navigationItems, userRole) {
                return navigationItems.filter(item => {
                    // Check if the current role is allowed for this item
                    if (item.roles && item.roles.includes(userRole)) {
                        // If there are subitems (e.g., for Settings), filter them too
                        if (item.items) {
                            item.items = this.filterNavigationByRole(item.items, userRole);
                        }
                        return true;
                    }
                    return false;
                });
            },

            inSureUserInfo: async function () {
                let attempts = 0;
                const maxAttempts = 5; // Set a maximum number of attempts to avoid infinite loops

                while (attempts < maxAttempts) {
                    // Fetch user data
                    const userInfo = this.userService.userInfo;
                    console.log("userInfo: in COmponmnnet: ", userInfo)

                    if (userInfo) {
                        // If the userinfoFullObj is found, return it
                        return userInfo;
                    }

                    attempts++;
                    console.log(`Attempt ${attempts}: User info not found, retrying...`);

                    // Optionally, you can wait for some time before retrying
                    await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for 1.5 second
                }

                // If the loop ends without finding the user info, handle accordingly
                return 'User info does not exist after maximum attempts';
            },
        });
    }
);