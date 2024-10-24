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
                var userData = await this.getUserData();
                this.setModel(new sap.ui.model.json.JSONModel(userData), 'userDataModel')

                this.changeLange()

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
                let userRule = ["Normal"];

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
                    const accessUser = access_UserSet_Filtered?.length > 0 ? access_UserSet_Filtered[0] : null;

                    // Determine user role based on access user data
                    if (accessUser) {
                        if (accessUser.admin) {
                            userRule.push("Settings")
                        }
                        if (accessUser.report) {
                            userRule.push("Report")
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

            filterNavigationByRole: function (navigationItems, userRoles) {
                return navigationItems.filter(item => {
                    // Check if the current item has roles
                    if (item.roles) {
                        // Check if any of the user roles match the item's roles
                        const hasRole = userRoles.some(role => item.roles.includes(role));
                        if (hasRole) {
                            // If there are subitems (e.g., for Settings), filter them too
                            if (item.items) {
                                item.items = this.filterNavigationByRole(item.items, userRoles);
                            }
                            return true;
                        }
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

            // Langeuge ........ 
            changeLanguage: function () {
                var oModel = this.getModel("i18n");
                var sCurrentLanguage = oModel.getResourceBundle().sLocale; // Get current language
                console.log({ sCurrentLanguage });

                // Toggle language
                var sNewLanguage = sCurrentLanguage === "ar" ? "en" : "ar";

                // Set new language
                sap.ui.getCore().getConfiguration().setLanguage(sNewLanguage);

                // Reload i18n model
                var i18nModel = new sap.ui.model.resource.ResourceModel({
                    bundleName: "internal.i18n.i18n",  // Adjust the bundle path
                    bundleLocale: sNewLanguage
                });
                this.setModel(i18nModel, "i18n");

                // Ensure new language is active
                // console.log(sap.ui.getCore().getConfiguration().getLanguage());

                this.changeLange();
                return sNewLanguage;
            },

            changeLange: function () {
                // Get the i18n model
                var i18nModel = this.getModel("i18n");
                var oResourceBundle = i18nModel.getResourceBundle();
                // console.log("Component -> oResourceBundle", oResourceBundle)

                // Load the navigation JSON model
                var navModel = this.getModel("navList");
                var navData = navModel.getData(); // Directly get the data
                // console.log("Component -> navData", navData);

                if (navData && navData.navigation) {
                    // Replace i18n placeholders with actual values for main navigation items
                    navData.navigation.forEach(function (navItem) {
                        // console.log("Component -> navItem", navItem);
                        navItem.title = oResourceBundle.getText(navItem.title2.replace("{i18n>", "").replace("}", ""));

                        // Check if there are nested items and update their titles as well
                        if (navItem.items && Array.isArray(navItem.items)) {
                            navItem.items.forEach(function (subItem) {
                                // console.log("Component -> subItem", subItem);
                                subItem.title = oResourceBundle.getText(subItem.title2.replace("{i18n>", "").replace("}", ""));
                            });
                        }
                    });

                    // console.log("Component -> navModel updated", navData);
                    // Set the updated model
                    navModel.setData(navData);
                    this.setModel(navModel, "navList");
                } else {
                    console.error("No navigation data found in the navList model");
                }
                this.setTails()
            },

            setTails: function () {
                var userData = this.getModel("userDataModel").getData();
                var userRules = userData.role

                //  For Home Page 
                const navList = this.getModel("navList").getData().navigation
                console.log("Component -> navList", navList)
                console.log("Component -> userRules", userRules)

                let filteredNavData = this.filterNavigationByRole(navList, userRules);
                let dataHome = filteredNavData
                    .filter(el => el.title !== "Home") // Filter out elements with title "Home"
                    .map(el => {
                        return {
                            title: el.title,
                            route: el.key,
                            icon: el.icon,
                            subtitle: "Focus Area Tracking",
                            footer: "Focus Area Tracking",
                            unit: "EUR",
                            kpivalue: 12,
                            scale: "k",
                            color: "Good",
                            trend: "Up"
                        };
                    });

                this.setModel(new sap.ui.model.json.JSONModel(dataHome), 'tilesHome')

                //  For Settings Page
                let dataSettings = navList
                    .filter(el => el.title2 === "navSettings")[0].items.map(el => {
                        return {
                            title: el.title, subtitle: "Focus Area Tracking", footer: "Focus Area Tracking",
                            unit: "EUR", kpivalue: 12, scale: "k", color: "Good", trend: "Up", route: el.key, icon: el.icon
                        };
                    }); 

                this.setModel(new sap.ui.model.json.JSONModel(dataSettings), 'tilesSettings')

            }

        });
    }
);