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



                // this.userInfo = this.userModel.getProperty("/userD");
                // this.userInfoWithRequestTamp = this.userModel.getProperty("/userInfoWithRequestTamp");

                // console.log("userD C", this.userInfo)
                // console.log("userInfoWithRequestTamp C", this.userInfoWithRequestTamp)

                // console.log("userD Cff", this.getUserD_f())
                // console.log("userInfoWithRequestTamp Cff", this.getUserInfoWithRequestTamp_f())

                // Set the title of the StandardListItem



            },

            setUserModel: async function () {
                // Check if UserId exists in local storage
                var sStoredUserId = localStorage.getItem("UserId");

                // const userId = '28141'; // Example user ID
                let userId = '28141'; // Example user ID
                // const userId = '10125'; // Example user ID

                if (sStoredUserId) {
                    console.log(sStoredUserId)
                    userId = sStoredUserId
                    // Get the core UI5 control and then find the input by its global ID
                    var oInput = sap.ui.getCore().byId("ChangingUserId");

                    // Check if the input field exists and set the stored UserId
                    if (oInput) {
                        oInput.setValue(sStoredUserId);
                    }
                }


                this.userService = new UserService(this, userId);
                await this.userService.onInit()

                // Fetch user data
                const userInfo = await this.userService.getUserInfo();
                // const userInfoWithRequestTamp = await this.userService.getUserInfoWithRequestTamp();

                // Create a global JSON model
                const userModel = new sap.ui.model.json.JSONModel({
                    userD: userInfo,
                    // userInfoWithRequestTamp: userInfoWithRequestTamp
                });

                // Set the model globally
                this.setModel(userModel, "globalUserModel");


            },


            getUserD_f: function () { return this.getModel("globalUserModel").getProperty("/userD") },

            // getUserInfoWithRequestTamp_f: function () { return this.getModel("globalUserModel").getProperty("/userInfoWithRequestTamp") },

            // getHelper: function () {
            //     var oFCL = this.getOwnerComponent().byId("fcl"),
            //         oParams = new URLSearchParams(window.location.search),
            //         oSettings = {
            //             defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
            //             defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded,
            //             maxColumnsCount: oParams.get("max")
            //         };

            //     return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
            // }
        });
    }
);