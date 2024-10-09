/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "internal/model/models",
    "sap/f/FlexibleColumnLayoutSemanticHelper",
    "internal/controller/Helper/UserService",
    "internal/controller/Helper/CRUD_z",



],
    function (UIComponent, Device, models, FlexibleColumnLayoutSemanticHelper, UserService, CRUD_z) {
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

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");

                // Id:5 
                // admin:true 
                // analytics:true 
                // appId:"3" 
                // appName:"3 - Internal Communication Ticketing system" 
                // create:true 
                // report:true 
                // status : true 
                // userId : "22225"

            },

            getUserIdAndRule: function () {
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
                return [userId, userRule]
            },

            getUserData: async function () {
                const [userId] = this.getUserIdAndRule(); // Unpack only userId since userRule2 is not used
                let userRule = 'Normal User';

                // Initialize userService
                this.userService = new UserService(this, userId);

                // Fetch user info if not already present
                if (!this.userInfo) {
                    this.userInfo = await this.userService.getUserInfo();
                    const crud_z = new CRUD_z(this, "ZACCOMODATION_APPS_SRV", true);

                    // Fetch access user set
                    const access_UserSet = await crud_z.get_record('Access_UserSet', '', {});

                    // Filter access user set for specific appId and userId
                    const access_UserSet_Filtered = access_UserSet?.results.filter(el =>
                        String(el.appId) === '3' && String(el.userId) === userId
                    );

                    // Assign the first match or null
                    const accessUser = access_UserSet_Filtered.length > 0 ? access_UserSet_Filtered[0] : null;

                    // Determine user role based on access user data
                    if (accessUser) {
                        if (accessUser.admin && accessUser.report) {
                            userRule = 'Super User';
                        } else if (accessUser.report) {
                            userRule = 'Mid User';
                        }
                    }

                    // Store user role in local storage
                    localStorage.setItem("UserRole", userRule);
                }

                return {
                    userInfo: this.userInfo,
                    role: userRule
                };
            },

            // getUserData: async function () {
            //     let [userId, userRule2] = this.getUserIdAndRule()
            //     let userRule = 'Normal User'

            //     this.userService = new UserService(this, userId);

            //     if (!this.userInfo) {
            //         this.userInfo = await this.userService.getUserInfo()
            //         let crud_z = new CRUD_z(this, "ZACCOMODATION_APPS_SRV", true)
            //         let access_UserSet = await crud_z.get_record('Access_UserSet', '', {})
            //         let access_UserSet_Filterd = access_UserSet?.results.filter(el => String(el.appId) === String(3) && String(el.userId) === String(userId));
            //         if (access_UserSet_Filterd.length > 0) {
            //             access_UserSet_Filterd = access_UserSet_Filterd[0];
            //         } else {
            //             access_UserSet_Filterd = null; // or handle the case when the array is empty as needed
            //         }
            //         if (access_UserSet_Filterd) {
            //             if (access_UserSet_Filterd.admin && access_UserSet_Filterd.report) {
            //                 userRule = 'Super User'
            //             } else if (access_UserSet_Filterd.report) {
            //                 userRule = 'Mid User'
            //             }
            //             else {
            //                 userRule = 'Normal User'
            //             }
            //         }
            //         localStorage.setItem("UserRole", userRule)
            //     }
            //     return {
            //         userInfo: this.userInfo,
            //         role: userRule
            //     }
            // },


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