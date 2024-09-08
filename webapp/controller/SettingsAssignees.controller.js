sap.ui.define(
  [
    "internal/controller/Helper/BaseController"
  ],
  function (BaseController) {
    "use strict";

    return BaseController.extend("internal.controller.SettingsAssignees", {
      onInit: async function () {
        BaseController.prototype.onInit.apply(this, []);

        this.mainEndPoint = "SettingsAssigneesSet"
        this.pageName = 'SettingsAssignees'

        this.mainFormId = 'mainFormId' + this.pageName
        this.mainFromModel = 'mainFormModel'
        this.mainFormErrModel = "mainFormErrModel"

        this.mainTableId = 'mainTableId' + this.pageName
        this.mainTableModel = "mainTableModel"


        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getMainObj()), this.mainFromModel)
        this.getView().setModel(new sap.ui.model.json.JSONModel(await this.getMainTableData()), this.mainTableModel)
        this.getView().setModel(new sap.ui.model.json.JSONModel({}), this.mainFormErrModel)

        console.log(this.getView().getModel(this.mainTableModel).getData())

        // let filter = { "name": "Sendto", "value": '28141' }
        // let data = await this.crud_z.get_record('NewRequestSet', '', filter)
        // console.log(": ",data)

        // let filter = { "name": 'Id', "value": '28141'}
        // let data = await this.crud_z.get_record(this.mainEndPoint, '', filter)

      },

      // ================================== # On Functions # ==================================

      onMainSubmit: async function (ev) {
        this.setBusy(this.mainFormId, true)
        this.setBusy(this.mainTableId, true)

        let data = this.getView().getModel(this.mainFromModel).getData()

        let isErr = this.startValidation(data)
        if (isErr) {
          this.setBusy(this.mainFormId, false)
          return false
        }

        data = this.oPayload_modify(data);

        if (this.getMode() == 'Create') {
          let res = await this.crud_z.post_record(this.mainEndPoint, data)
        } else {
          let res = await this.crud_z.update_record(this.mainEndPoint, data, data.Id)
        }

        this.setBusy(this.mainFormId, false)
        this.setBusy(this.mainTableId, false)

        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getMainObj()), this.mainFromModel)// Reset
        this.getView().setModel(new sap.ui.model.json.JSONModel(await this.getMainTableData()), this.mainTableModel)// Set

      },

      onChangeInputUserId: async function (ev) {
        const input = ev.getSource();
        const userId = input.getValue();
        console.log(this.getView().getModel(this.mainFormErrModel))
        if (userId.length == 5) {
          this.getView().byId('inputEmployeeNameId').setBusy(true);
          let userDetail = await this.getManagerId(userId);
          this.getView().getModel(this.mainFormErrModel).setProperty('/EmployeeId', { 'valueStateText': '', 'valueState': "None" });

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
          this.getView().getModel(this.mainFromModel).setProperty('/EmployeeName', `${userDetail?.displayName}`);
          this.getView().byId('inputEmployeeNameId').setBusy(false);
        } else {
          this.getView().getModel(this.mainFormErrModel).setProperty('/EmployeeId', { 'valueStateText': '', 'valueState': "None" });
          this.getView().getModel(this.mainFromModel).setProperty('/EmployeeName', '');
        }

        // this.getView().byId('inputEmployeeNameId').setBusy(false);
      },

      onDelete: async function (oEvent) {
        var oButton = oEvent.getSource();
        var oRow = oButton.getParent(); // Go from Button to Row
        var oContext = oRow.getBindingContext(this.mainTableModel);
        var oData = oContext.getObject();
        console.log(oData)
        sap.m.MessageBox.confirm("Are you sure you want to delete this item?", {
          title: "Confirm Deletion",
          actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
          onClose: async function (oAction) {
            if (oAction === sap.m.MessageBox.Action.YES) {
              // Proceed with the delete action
              this.setBusy(this.mainTableId, true)
              let res = await this.crud_z.delete_record(this.mainEndPoint, oData.Id)
              this.getView().setModel(new sap.ui.model.json.JSONModel(await this.getMainTableData()), this.mainTableModel)
              this.setBusy(this.mainTableId, false)
              sap.m.MessageToast.show("Item deleted successfully.");
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
          'EmployeeId': "",
          'EmployeeName': "",
        }
      },

      getMainTableData: async function () {
        let data = await this.crud_z.get_record(this.mainEndPoint)
        return data.results

      },

      getManagerId: async function (userId) {
        const mModel = this.getOwnerComponent()?.getModel("SF");
        try {
          const userDetailurl = `${mModel.sServiceUrl}/User?$filter=userId eq '${userId}'&$format=json`;
          const response = await fetch(userDetailurl);
          const jobData = await response.json();
          return jobData.d.results[0];
        } catch (error) {
          console.error("Failed to fetch roles Details", error);
        }
      },
      // ================================== # Helper Functions # ==================================

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

      oPayload_modify: function (oPayload) {
        oPayload = this.oPayload_modify_parent(oPayload)
        return oPayload
      },

      setBusy: function (id, status) {
        this.getView().byId(id).setBusy(status);
      },

    });
  }
);
