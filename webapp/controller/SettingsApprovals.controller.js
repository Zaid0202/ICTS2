sap.ui.define(
  [
    "internal/controller/Helper/BaseController",
    "sap/m/MessageBox",
  ],
  function (BaseController, MessageBox) {
    "use strict";
    var sResponsivePaddingClasses = "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer";

    return BaseController.extend("internal.controller.SettingsApprovals", {
      onInit: async function () {
        await BaseController.prototype.onInit.apply(this, []);
        this.pageName = 'SettingsApprovals'
        this.mainEndPoint = this.endsPoints['SettingsApprovals']

        this.mainFormId = 'mainFormId' + this.pageName
        this.mainFromModel = 'mainFormModel'
        this.mainFormErrModel = "mainFormErrModel"

        this.mainTableId = 'mainTableId' + this.pageName
        this.mainTableModel = "mainTableModel"
        this.UiTableFSG2.setTableId(this.mainTableId)


        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getMainObj()), this.mainFromModel)
        this.getView().setModel(new sap.ui.model.json.JSONModel(await this.getMainTableData()), this.mainTableModel)
        this.getView().setModel(new sap.ui.model.json.JSONModel({}), this.mainFormErrModel)


        // const localData = this.getOwnerComponent().getModel("localData").getData()
        // console.log({ localData })
        // let userInfo = await this.getManagerId(28443)
        // console.log({ userInfo })


        // let filter = { "name": 'MainServiceName', "value": 'Internal Announcement'}
        // let data = await this.crud_z.get_record(this.mainEndPoint, '', filter)
        // console.log(": ",data)

        //Table ___
        this._mViewSettingsDialogs = {};
        // Define your grouping functions
        this.mGroupFunctions = {
          EmployeeName: function (oContext) {
            var name = oContext.getProperty();
            if (name && name.EmployeeName) {
              console.log("data for EmployeeName: ", name);
              return {
                key: name.EmployeeName,
                text: name.EmployeeName
              };
            } else {
              console.error("Invalid data for EmployeeName: ", name);
              return {
                key: "Unknown",
                text: "Unknown"
              };
            }
          },

          ApprovalLevels: function (oContext) {
            var name = oContext.getProperty();
            if (name && name.ApprovalLevels) {
              console.log("data for ApprovalLevels: ", name);
              return {
                key: name.ApprovalLevels,
                text: name.ApprovalLevels
              };
            } else {
              console.error("Invalid data for ApprovalLevels: ", name);
              return {
                key: "Unknown",
                text: "Unknown"
              };
            }
          },
          MainServiceName: function (oContext) {
            var name = oContext.getProperty();
            if (name && name.MainServiceName) {
              console.log("data for MainServiceName: ", name);
              return {
                key: name.MainServiceName,
                text: name.MainServiceName
              };
            } else {
              console.error("Invalid data for MainServiceName: ", name);
              return {
                key: "Unknown",
                text: "Unknown"
              };
            }
          }
        };


        console.log("Finst Init!---------------")
        // let userInfo = await this.userService.getUserInfo()

        // const userInfo1 = {
        //   RequestId: '', // Renamed from request_id
        //   RequestDate: new Date().toISOString(), // Renamed from request_date
        //   RequesterId: userInfo.empId, // Renamed from requester_id
        //   RequesterName: userInfo.displayName, // Renamed from requester_name
        //   RequesterPosition: userInfo.jobCode, // Renamed from requester_position
        //   RequesterSection: userInfo.department, // Renamed from requester_section
        //   RequesterDept: userInfo.division, // Renamed from requester_dept
        //   RequesterLocation: userInfo.city, // Renamed from requester_location
        //   Status: "Pending", // Renamed from status
        //   StatusDisplay: "forwarded to " + userInfo?.manager?.displayName, // Renamed from status_display
        //   Steps: 1, // Renamed from steps
        //   Sendto: userInfo?.manager?.userId, // Renamed from Sendto
        //   AssignedDate: new Date().toISOString(), // Renamed from assigned_date
        //   LastActionBy: 10125, // Renamed from last_action_by
        //   LastActionDate: new Date().toISOString(), // Renamed from last_action_date
        //   Action: 'Closed By' // Renamed from action
        // };

        // console.log(userInfo1)
      },

      // ================================== # On Functions # ==================================
      onChangeInputUserId: async function (ev) {
        const input = ev.getSource();
        const userId = input.getValue();

        if (userId.length == 5) {
          this.getView().byId('inputEmployeeNameId').setBusy(true);
          let userDetail = await this.getManagerId(userId);
          this.getView().getModel(this.mainFormErrModel).setProperty('/EmployeeId', { 'valueStateText': '', 'valueState': "None" });
          console.log({ userDetail })
          if (!userDetail) {
            this.getView().getModel(this.mainFormErrModel).setProperty('/EmployeeId', { 'valueStateText': 'Not Found User Id!', 'valueState': "Error" });
            this.getView().getModel(this.mainFromModel).setProperty('/EmployeeName', '');
            console.log(this.getView().getModel(this.mainFormErrModel).getData())
            this.getView().byId('inputEmployeeNameId').setBusy(false);
            return 0;
          }

          // Set the user detail in the model
          const division = userDetail?.division.split('(')[0].trim();

          // this.getView().getModel(this.mainFromModel).setProperty('/EmployeeId', `${userDetail?.displayName}(${division})`);
          this.getView().getModel(this.mainFromModel)?.setProperty('/EmployeeName', `${userDetail?.displayName}`);
          this.getView().byId('inputEmployeeNameId')?.setBusy(false);
        } else {
          this.getView().getModel(this.mainFormErrModel)?.setProperty('/EmployeeId', { 'valueStateText': '', 'valueState': "None" });
          this.getView().getModel(this.mainFromModel)?.setProperty('/EmployeeName', '');
        }

        // this.getView().byId('inputEmployeeNameId').setBusy(false);
      },

      onMainSubmit: async function (ev) {
        let data = this.getView().getModel(this.mainFromModel).getData()

        let isErr = this.startValidation(data)
        if (isErr) {
          return false
        }

        this.setBusy(this.mainTableId, true)
        this.setBusy(this.mainFormId, true)

        data = this.oPayload_modify(data);

        if (this.getMode() == 'Create') {
          let res = await this.crud_z.post_record(this.mainEndPoint, data)
        } else {
          let res = await this.crud_z.update_record(this.mainEndPoint, data, data.Id)
        }

        this.setBusy(this.mainTableId, false)
        this.setBusy(this.mainFormId, false)

        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getMainObj()), this.mainFromModel)// Reset
        this.getView().setModel(new sap.ui.model.json.JSONModel(await this.getMainTableData()), this.mainTableModel)// Set

        sap.m.MessageToast.show("Saved Successfully");

        //   for (let i = 0; i < 10; i++) {
        //     let xx = this.generateRandomData();
        //     let data = this.oPayload_modify(xx);
        //     let results =  await this.crud_z.post_record(this.mainEndPoint, data)
        //     console.log("d")
        // }

      },

      onEdit: function (oEvent) {
        var oButton = oEvent.getSource();
        var oRow = oButton.getParent(); // Go from Button to Row
        var oContext = oRow.getBindingContext(this.mainTableModel);
        var oData = oContext.getObject();
        this.setMode('Edit')

        this.getView().setModel(new sap.ui.model.json.JSONModel(oData), this.mainFromModel)
        // You can perform further actions with the data here
      },

      onCleare: function (oEvent) {
        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getMainObj()), this.mainFromModel)
        this.setMode('Create')

        console.log(oEvent)
      },

      onSubmitInputUserId: async function (ev) {
        console.log("hh----------")
        this.getUserByIdOnInputUser(ev, true)
      },

      onChangeInputUserId: async function (ev) {
        this.getUserByIdOnInputUser(ev)

      },

      onDelete: async function (oEvent) {
        var oButton = oEvent.getSource();
        var oRow = oButton.getParent(); // Go from Button to Row
        var oContext = oRow.getBindingContext(this.mainTableModel);
        var oData = oContext.getObject();

        sap.m.MessageBox.confirm("Are you sure you want to delete this user?", {
          title: "Confirm Deletion",
          actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
          onClose: async function (oAction) {
            if (oAction === sap.m.MessageBox.Action.YES) {
              // Proceed with the delete action
              this.setBusy(this.mainTableId, true)
              let res = await this.crud_z.delete_record(this.mainEndPoint, oData.Id)
              this.getView().setModel(new sap.ui.model.json.JSONModel(await this.getMainTableData()), this.mainTableModel)
              this.setBusy(this.mainTableId, false)
              sap.m.MessageToast.show("User deleted successfully.");
            } else {
              // Cancel the delete action
              sap.m.MessageToast.show("Deletion Canceled.");
            }
          }.bind(this)
        });
      },

      // ================================== # Get Functions # ==================================
      getMainObj: function () {
        return {
          'MainServiceName': "",
          'ApprovalLevels': "",
          'EmployeeId': "",
          'EmployeeName': "",
        }
      },

      getMainTableData: async function () {
        let data = await this.crud_z.get_record(this.mainEndPoint)
        return data ? data?.results : []
      },

      // ================================== # Helper Functions # ==================================
      oPayload_modify: function (oPayload) {
        oPayload = this.oPayload_modify_parent(oPayload)
        oPayload['ApprovalLevels'] = Number(oPayload['ApprovalLevels'])
        return oPayload
      },

      startValidation: function (oPayload) {
        let fieldsName = Object.keys(this.getMainObj());
        let requiredList = fieldsName.filter(field => field);

        const rulesArrName = [
          { arr: requiredList, name: 'required' },
        ];

        let { isErr, setvalueStateValues } = this.validation_z.startValidation(fieldsName, rulesArrName, oPayload)
        console.log(setvalueStateValues)
        this.getView().setModel(new sap.ui.model.json.JSONModel(setvalueStateValues), this.mainFormErrModel);
        return isErr
      },

      // ================================== # Get Functions # ==================================
      generateRandomData: function () {
        const randomObjData = {
          MainServiceName: "",
          ApprovalLevels: "",
          EmployeeId: "",
          EmployeeName: ""
        };

        const MainServicesName = [
          "Internal Announcement",
          "Graphic Design",
          "Nadec Home Post",
          "Revision Request"
        ];

        const randomNames = [
          "John Doe", "Jane Smith", "Michael Brown", "Emily Davis",
          "David Wilson", "Sarah Johnson", "Chris Lee", "Jessica Moore",
          "James White", "Megan Taylor"
        ];

        const getRandomElement = function (arr) {
          return arr[Math.floor(Math.random() * arr.length)];
        };

        const getRandomNumber = function (length) {
          return Math.floor(Math.random() * (9 * Math.pow(10, length - 1))) + Math.pow(10, length - 1);
        };

        randomObjData.MainServiceName = getRandomElement(MainServicesName);
        randomObjData.ApprovalLevels = Math.floor(Math.random() * 10) + 1; // ApprovalLevels from 1 to 10
        // randomObjData.EmployeeId = getRandomNumber(5); // EmployeeId with length 5
        randomObjData.EmployeeName = getRandomElement(randomNames);

        return randomObjData;
      },

      // ================================== # Tables Functions # ==================================
      // setDialogData: function (oDialog, dialogData) {
      //   // Custom logic to set data to the dialog
      //   if (oDialog && dialogData) {
      //     // Create a JSON model for the dialog data if not already present
      //     var oModel = oDialog.getModel("dialogModel");
      //     if (!oModel) {
      //       oModel = new sap.ui.model.json.JSONModel();
      //       oDialog.setModel(oModel, "dialogModel");
      //     }
      //     // Set the provided data to the dialog model
      //     oModel.setData(dialogData);
      //   }
      // },

      // getViewSettingsDialog: function (sDialogFragmentName, dialogData) {
      //   var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];

      //   if (!pDialog) {
      //     pDialog = sap.ui.core.Fragment.load({
      //       id: this.getView().getId(),
      //       name: sDialogFragmentName,
      //       controller: this
      //     }).then(function (oDialog) {
      //       if (sap.ui.Device.system.desktop) {
      //         oDialog.addStyleClass("sapUiSizeCompact");
      //       }
      //       // Set values to the dialog using the provided data
      //       this.setDialogData(oDialog, dialogData);
      //       return oDialog;
      //     }.bind(this));  // `bind` is used to maintain the context of `this`
      //     this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
      //   } else {
      //     // Dialog is already loaded, set values directly
      //     pDialog.then(function (oDialog) {
      //       this.setDialogData(oDialog, dialogData);
      //     }.bind(this));
      //   }
      //   return pDialog;
      // },

      // handleSortButtonPressed: function () {
      //   this.uiTableFSG.handleSortButtonPressed()
      //   // this.getViewSettingsDialog("internal.fragment.TableFragment.Sort", [
      //   //   { 'Text': 'Employee ID', 'Key': 'EmployeeId' },
      //   //   { 'Text': 'Level', 'Key': 'ApprovalLevels' }
      //   // ]).then(function (oViewSettingsDialog) {
      //   //   oViewSettingsDialog.open();
      //   // });
      // },

      // handleSortDialogConfirm: function (oEvent) {
      //   this.uiTableFSG.handleSortDialogConfirm(oEvent)
      //   // var oTable = this.byId(this.mainTableId),
      //   //   mParams = oEvent.getParameters(),
      //   //   oBinding = oTable ? oTable.getBinding("rows") : null, // For sap.ui.table.Table, binding is on "rows"
      //   //   sPath,
      //   //   bDescending,
      //   //   aSorters = [];

      //   // if (mParams.sortItem) {
      //   //   sPath = mParams.sortItem.getKey();
      //   //   bDescending = mParams.sortDescending;
      //   //   aSorters.push(new sap.ui.model.Sorter(sPath, bDescending)); // sap.ui.model.Sorter is used for sorting
      //   // }

      //   // // Apply the selected sort settings
      //   // if (oBinding) {
      //   //   oBinding.sort(aSorters);
      //   // }
      // },

      // // ------
      // text_key_Filter: function (dataArray) {
      //   // Define the type for objects in the unique arrays
      //   var uniqueEmployeeId = [];
      //   var uniqueEmployeeName = [];
      //   var uniqueLevel = [];

      //   // Helper function to check uniqueness and add to array
      //   var addUniqueItem = function (array, item) {
      //     var exists = array.some(function (existingItem) {
      //       return existingItem.Text === item.Text && existingItem.Key === item.Key;
      //     });
      //     if (!exists) {
      //       array.push(item);
      //     }
      //   };

      //   // Process the data array to collect unique values
      //   dataArray.forEach(function (item) {
      //     addUniqueItem(uniqueEmployeeId, { Text: item.EmployeeId, Key: "EmployeeId" });
      //     addUniqueItem(uniqueEmployeeName, { Text: item.EmployeeName, Key: "EmployeeName" });
      //     addUniqueItem(uniqueLevel, { Text: item.ApprovalLevels, Key: "ApprovalLevels" });
      //   });

      //   // Construct the result object
      //   var resultObject = {
      //     EmployeeId: uniqueEmployeeId,
      //     EmployeeName: uniqueEmployeeName,
      //     ApprovalLevels: uniqueLevel
      //   };

      //   return resultObject;
      // },

      // handleFilterButtonPressed: function () {
      //   this.uiTableFSG.handleFilterButtonPressed()
      //   // var that = this;
      //   // var dataArray = this.getView().getModel(this.mainTableModel).getData();

      //   // // Define the type for each item in the data array
      //   // var resultObject = this.text_key_Filter(dataArray);

      //   // this.getViewSettingsDialog("internal.fragment.TableFragment.Filter", resultObject)
      //   //   .then(function (oViewSettingsDialog) {
      //   //     oViewSettingsDialog.setModel(that.getOwnerComponent().getModel('gbModel'));
      //   //     oViewSettingsDialog.open();
      //   //   });
      // },

      // handleFilterDialogConfirm: function (ev) {
      //   this.uiTableFSG.handleFilterDialogConfirm(ev)
      //   // var oTable = this.byId(this.mainTableId),
      //   //   mParams = ev.getParameters(),
      //   //   oBinding = oTable.getBinding("rows"),
      //   //   aFilters = [];

      //   // mParams.filterItems.forEach(function (oItem) {
      //   //   var aSplit = oItem.getKey().split("___"),
      //   //     sPath = aSplit[0],
      //   //     sOperator = sap.ui.model.FilterOperator.EQ,
      //   //     sValue1 = oItem.getText(),
      //   //     oFilter = new sap.ui.model.Filter(sPath, sOperator, sValue1);
      //   //   // console.log("aSplit: ", aSplit, ", sPath: ", sPath, ", sOperator: ", sOperator, ", sValue1: ", sValue1,  ", oBinding: ", oBinding);
      //   //   aFilters.push(oFilter);
      //   // });

      //   // if (oBinding) {
      //   //   oBinding.filter(aFilters);
      //   // }
      // },

      // handleGroupButtonPressed: function () {
      //   this.uiTableFSG.handleGroupButtonPressed()
      //   // var dataArray = this.getView().getModel(this.mainTableModel).getData();

      //   // // Define the type for each item in the data array
      //   // var resultObject = this.text_key_Filter(dataArray);
      //   // // console.log(resultObject);

      //   // // Assuming this.getViewSettingsDialog returns a promise
      //   // this.getViewSettingsDialog("internal.fragment.TableFragment.Group", {})
      //   //   .then(function (oViewSettingsDialog) {
      //   //     oViewSettingsDialog.open();
      //   //   });
      // },

      // // Function to handle grouping confirmation
      // handleGroupDialogConfirm: function (oEvent) {
      //   this.uiTableFSG.handleGroupDialogConfirm(oEvent)
      //   // var oTable = this.byId(this.mainTableId),
      //   //   mParams = oEvent.getParameters(),
      //   //   oBinding = oTable.getBinding("rows"), // Use "rows" for sap.ui.table.Table
      //   //   sPath,
      //   //   bDescending,
      //   //   vGroup,
      //   //   aGroupers = [];

      //   // if (mParams.groupItem) {
      //   //   sPath = mParams.groupItem.getKey();
      //   //   bDescending = mParams.groupDescending;
      //   //   vGroup = this.mGroupFunctions[sPath];

      //   //   if (typeof vGroup === 'function') {
      //   //     aGroupers.push(new sap.ui.model.Sorter(sPath, bDescending, vGroup));
      //   //     // Apply the selected group settings
      //   //     oBinding.sort(aGroupers);
      //   //   } else {
      //   //     console.error("Invalid group function for key: ", sPath);
      //   //   }
      //   // } else if (this.groupReset) {
      //   //   oBinding.sort(); // Reset sorting
      //   //   this.groupReset = false;
      //   // }

      //   // console.log("\nmParams: ", mParams, "\noBinding: ", oBinding, "\nsPath: ", sPath, "\nbDescending: ", bDescending, "\nvGroup: ", vGroup, "\naGroupers: ", aGroupers);
      // },

      // resetGroupDialog: function (oEvent) {
      //   this.uiTableFSG.resetGroupDialog(oEvent)
      //   this.groupReset = true;
      // },

      // onSearch: function (oEvent) {
      //   // this.uiTableFSG.onSearch(oEvent)

      //   var sQuery = oEvent.getParameter("query"),
      //     oTable = this.byId(this.mainTableId), // Assuming you have a table with this ID
      //     oBinding = oTable.getBinding("rows"), // Use "rows" for sap.ui.table.Table
      //     aFilters = [];

      //   if (sQuery && sQuery.length > 0) {
      //     var oFilter = new sap.ui.model.Filter("EmployeeName", sap.ui.model.FilterOperator.Contains, sQuery); // Adjust "someProperty" to your model property
      //     aFilters.push(oFilter);
      //   }

      //   // Apply the filter to the table binding
      //   if (oBinding) {
      //     oBinding.filter(aFilters);
      //   }
      // },

      // ================================== # Table FSG Functions # ==================================
      getDataXkeysAItems: function (ev) {
        let changeTextAItems = [{ oldtext: "Comment Z", newtext: "Comment" }]
        return this.UiTableFSG2.getDataXkeysAItems(ev, this.mainTableId, changeTextAItems)
      },
      // ======

      handleSortButtonPressed: function (ev) {
        this.UiTableFSG2.handleSortButtonPressed(ev)
      },

      handleFilterButtonPressed: function (ev) {
        this.UiTableFSG2.handleFilterButtonPressed(ev)
      },

      handleGroupButtonPressed: function (ev) {
        this.UiTableFSG2.handleGroupButtonPressed(ev)

      },

      // ======
      onSearch: function (oEvent) {
        this.UiTableFSG2.onSearch(oEvent)
      },

      // ================================== # ++ Functions # ==================================
      // ================================== # ++ Functions # ==================================
      // ================================== # ++ Functions # ==================================
    });
  }
);
