sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (
    Controller
) {
    "use strict";

    return Controller.extend("internal.controller.Helper.UiTableFSG", {
        constructor: function (currentController) {
            Controller.apply(this, currentController);

            this._currentController = currentController
            // Define your grouping functions
        },

        onInit: function () {
            this._mViewSettingsDialogs = {};

            // this.mGroupFunctions = {
            //     EmployeeName: function (oContext) {
            //         var name = oContext.getProperty();
            //         if (name && name.EmployeeName) {
            //             console.log("data for EmployeeName: ", name);
            //             return {
            //                 key: name.EmployeeName,
            //                 text: name.EmployeeName
            //             };
            //         } else {
            //             console.error("Invalid data for EmployeeName: ", name);
            //             return {
            //                 key: "Unknown",
            //                 text: "Unknown"
            //             };
            //         }
            //     },
            //     ApprovalLevels: function (oContext) {
            //         var name = oContext.getProperty();
            //         if (name && name.ApprovalLevels) {
            //             console.log("data for ApprovalLevels: ", name);
            //             return {
            //                 key: name.ApprovalLevels,
            //                 text: name.ApprovalLevels
            //             };
            //         } else {
            //             console.error("Invalid data for ApprovalLevels: ", name);
            //             return {
            //                 key: "Unknown",
            //                 text: "Unknown"
            //             };
            //         }
            //     },
            //     TaskName: function (oContext) {
            //         var name = oContext.getProperty();
            //         if (name && name.TaskName) {
            //             console.log("data for TaskName: ", name);
            //             return {
            //                 key: name.TaskName,
            //                 text: name.TaskName
            //             };
            //         } else {
            //             console.error("Invalid data for TaskName: ", name);
            //             return {
            //                 key: "Unknown",
            //                 text: "Unknown"
            //             };
            //         }
            //     }
            // };

        },
        // ================================== # Tables Functions # ==================================
        setDialogData: function (oDialog, dialogData) {
            // Custom logic to set data to the dialog
            if (oDialog && dialogData) {
                // Create a JSON model for the dialog data if not already present
                var oModel = oDialog.getModel("dialogModel");
                if (!oModel) {
                    oModel = new sap.ui.model.json.JSONModel();
                    oDialog.setModel(oModel, "dialogModel");
                }
                // Set the provided data to the dialog model
                oModel.setData(dialogData);
            }
        },

        getViewSettingsDialog: function (sDialogFragmentName, dialogData) {

            var pDialog = this._currentController._mViewSettingsDialogs[sDialogFragmentName];

            if (!pDialog) {
                pDialog = sap.ui.core.Fragment.load({
                    id: this._currentController.getView().getId(),
                    name: sDialogFragmentName,
                    controller: this._currentController
                }).then(function (oDialog) {
                    if (sap.ui.Device.system.desktop) {
                        oDialog.addStyleClass("sapUiSizeCompact");
                    }
                    // Set values to the dialog using the provided data
                    this.setDialogData(oDialog, dialogData);
                    return oDialog;
                }.bind(this));  // `bind` is used to maintain the context of `this`
                this._currentController._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
            } else {
                // Dialog is already loaded, set values directly
                pDialog.then(function (oDialog) {
                    this.setDialogData(oDialog, dialogData);
                }.bind(this));
            }
            return pDialog;
        },

        handleSortButtonPressed: function () {
            this.getViewSettingsDialog("internal.fragment.TableFragment.Sort", [
                { 'Text': 'Employee ID', 'Key': 'EmployeeId' },
                { 'Text': 'Level', 'Key': 'ApprovalLevels' }
            ]).then(function (oViewSettingsDialog) {
                oViewSettingsDialog.open();
            });
        },

        handleSortDialogConfirm: function (oEvent) {
            var oTable = this._currentController.byId(this._currentController.mainTableId),
                mParams = oEvent.getParameters(),
                oBinding = oTable ? oTable.getBinding("rows") : null, // For sap.ui.table.Table, binding is on "rows"
                sPath,
                bDescending,
                aSorters = [];

            if (mParams.sortItem) {
                sPath = mParams.sortItem.getKey();
                bDescending = mParams.sortDescending;
                aSorters.push(new sap.ui.model.Sorter(sPath, bDescending)); // sap.ui.model.Sorter is used for sorting
            }

            // Apply the selected sort settings
            if (oBinding) {
                oBinding.sort(aSorters);
            }
        },
        // ------
        text_key_Filter: function (dataArray) {
            // Define the type for objects in the unique arrays
            var uniqueEmployeeId = [];
            var uniqueEmployeeName = [];
            var uniqueLevel = [];

            // Helper function to check uniqueness and add to array
            var addUniqueItem = function (array, item) {
                var exists = array.some(function (existingItem) {
                    return existingItem.Text === item.Text && existingItem.Key === item.Key;
                });
                if (!exists) {
                    array.push(item);
                }
            };

            // Process the data array to collect unique values
            dataArray.forEach(function (item) {
                addUniqueItem(uniqueEmployeeId, { Text: item.EmployeeId, Key: "EmployeeId" });
                addUniqueItem(uniqueEmployeeName, { Text: item.EmployeeName, Key: "EmployeeName" });
                addUniqueItem(uniqueLevel, { Text: item.ApprovalLevels, Key: "ApprovalLevels" });
            });

            // Construct the result object
            var resultObject = {
                EmployeeId: uniqueEmployeeId,
                EmployeeName: uniqueEmployeeName,
                ApprovalLevels: uniqueLevel
            };

            return resultObject;
        },

        handleFilterButtonPressed: function () {
            var that = this._currentController;
            var dataArray = this._currentController.getView().getModel(this._currentController.mainTableModel).getData();

            // Define the type for each item in the data array
            var resultObject = this.text_key_Filter(dataArray);

            this.getViewSettingsDialog("internal.fragment.TableFragment.Filter", resultObject)
                .then(function (oViewSettingsDialog) {
                    oViewSettingsDialog.setModel(that.getOwnerComponent().getModel('gbModel'));
                    oViewSettingsDialog.open();
                });
        },

        handleFilterDialogConfirm: function (ev) {
            var oTable = this._currentController.byId(this._currentController.mainTableId),
                mParams = ev.getParameters(),
                oBinding = oTable.getBinding("rows"),
                aFilters = [];

            mParams.filterItems.forEach(function (oItem) {
                var aSplit = oItem.getKey().split("___"),
                    sPath = aSplit[0],
                    sOperator = sap.ui.model.FilterOperator.EQ,
                    sValue1 = oItem.getText(),
                    oFilter = new sap.ui.model.Filter(sPath, sOperator, sValue1);
                // console.log("aSplit: ", aSplit, ", sPath: ", sPath, ", sOperator: ", sOperator, ", sValue1: ", sValue1,  ", oBinding: ", oBinding);
                aFilters.push(oFilter);
            });

            if (oBinding) {
                oBinding.filter(aFilters);
            }
        },

        handleGroupButtonPressed: function () {
            var dataArray = this._currentController.getView().getModel(this._currentController.mainTableModel).getData();

            // Define the type for each item in the data array
            var resultObject = this.text_key_Filter(dataArray);
            // console.log(resultObject);

            // Assuming this.getViewSettingsDialog returns a promise
            this.getViewSettingsDialog("internal.fragment.TableFragment.Group", {})
                .then(function (oViewSettingsDialog) {
                    oViewSettingsDialog.open();
                });
        },

        // Function to handle grouping confirmation
        handleGroupDialogConfirm: function (oEvent) {
            var oTable = this._currentController.byId(this._currentController.mainTableId),
                mParams = oEvent.getParameters(),
                oBinding = oTable.getBinding("rows"), // Use "rows" for sap.ui.table.Table
                sPath,
                bDescending,
                vGroup,
                aGroupers = [];

            if (mParams.groupItem) {
                sPath = mParams.groupItem.getKey();
                bDescending = mParams.groupDescending;
                vGroup = this._currentController.mGroupFunctions[sPath];

                if (typeof vGroup === 'function') {
                    aGroupers.push(new sap.ui.model.Sorter(sPath, bDescending, vGroup));
                    // Apply the selected group settings
                    oBinding.sort(aGroupers);
                } else {
                    console.error("Invalid group function for key: ", sPath);
                }
            } else if (this.groupReset) {
                oBinding.sort(); // Reset sorting
                this.groupReset = false;
            }

            console.log("\nmParams: ", mParams, "\noBinding: ", oBinding, "\nsPath: ", sPath, "\nbDescending: ", bDescending, "\nvGroup: ", vGroup, "\naGroupers: ", aGroupers);
        },

        resetGroupDialog: function (oEvent) {
            this.groupReset = true;
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query"),
                oTable = this._currentController.byId(this._currentController.mainTableId), // Assuming you have a table with this ID
                oBinding = oTable.getBinding("rows"), // Use "rows" for sap.ui.table.Table
                aFilters = [];

            if (sQuery && sQuery.length > 0) {
                var oFilter = new sap.ui.model.Filter("EmployeeName", sap.ui.model.FilterOperator.Contains, sQuery); // Adjust "someProperty" to your model property
                aFilters.push(oFilter);
            }

            // Apply the filter to the table binding
            if (oBinding) {
                oBinding.filter(aFilters);
            }
        },

    });
});