sap.ui.define(
  [
    "internal/controller/Helper/BaseController"
  ],
  function (BaseController) {
    "use strict";

    return BaseController.extend("internal.controller.SettingsAssignees", {
      onInit: async function () {
        BaseController.prototype.onInit.apply(this, []);

        this.mainEndPoint = this.endsPoints['SettingsAssignees']
        this.pageName = 'SettingsAssignees'

        this.mainFormId = 'mainFormId' + this.pageName
        this.mainFromModel = 'mainFormModel'
        this.mainFormErrModel = "mainFormErrModel"

        this.mainTableModel = "mainTableModel"
        this.mainTableId = 'mainTableId' + this.pageName
        this.UiTableFSG2.setTableId(this.mainTableId)


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

    });
  }
);
