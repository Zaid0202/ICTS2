sap.ui.define(
  [
    "internal/controller/Helper/BaseController",
    "sap/ui/core/UIComponent",
    "internal/controller/Helper/SharingRequestFunctions",
    "sap/m/MessageBox",


  ],

  function (BaseController, UIComponent, SharingRequestFunctions, MessageBox) {
    "use strict";

    return BaseController.extend("internal.controller.ReAssignee", {
      onInit: async function () {
        await BaseController.prototype.onInit.apply(this, []);

        // ------------------------------------ Call Classs ------------------------------------
        this.sharingRequestFunctions = new SharingRequestFunctions(this)
        let thisOfScharing = await this.sharingRequestFunctions.onInit()
        thisOfScharing = await this.mergeWithSharing(thisOfScharing)
        Object.assign(this, thisOfScharing);
        Object.assign(Object.getPrototypeOf(this), Object.getPrototypeOf(thisOfScharing));

        this.pageName = 'ReAssignee'

        this.mainFormId = 'mainFormId' + this.pageName
        this.mainFromModel = 'mainFormModel'
        this.mainFormErrModel = "mainFormErrModel"

        this.mainEndPoint = this.endsPoints['NewRequest']
        this.mainTableModel_MyRequestStatus_XX = "mainTableModel_MyRequestStatus_XX"

        this.mainTableId_MyRequestStatus_XX = 'mainTableId_MyRequestStatus_XX'
        this.UiTableFSG2.setTableId(this.mainTableId_MyRequestStatus_XX)

        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getMainObj()), this.mainFromModel)
        this.getView().setModel(new sap.ui.model.json.JSONModel({}), this.mainFormErrModel)

        this.getView().setModel(new sap.ui.model.json.JSONModel(await this.getMainTableData1()), this.mainTableModel_MyRequestStatus_XX)// Set

        // ---------------------------
        // this.reSetValues()
        // this.setVisbileForFormInit()

        this.helperModelInstance.setProperty("/mainFormTitle", "Request Details")
        this.switchState();

      },

      // ================================== # On Functions # ==================================

      onMainSubmit: async function (ev) {
        let isError = false

        let dataUserInfo = this.getView().getModel(this.mainFromModel).getData()

        let isErr = this.startValidationX(dataUserInfo)
        if (isErr) { return false }

        let selectedRows = this.handleActionButtonPressed()
        if (!selectedRows) { return false }


        let namesSendtoXForUni = this.formatSendToNames(dataUserInfo.EmployeeId, dataUserInfo.EmployeeName)


        for (let index = 0; index < selectedRows.length; index++) {
          this.setBusy(this.mainFormId, true)
          this.setBusy(this.mainTableId_MyRequestStatus_XX, true)

          let data = selectedRows[index];


          // -------New Request Part---------
          this.setMode("Edit")
          let requesteData = {
            status: "ReAssignee", // This will be one of: Pending, Approved, Rejected, Returned, Closed,  Assigned , Progress
            status2: data.Status, // This will be one of: Pending, Approved, Rejected, Returned, Closed,  Assigned , Progress
            sendTo: dataUserInfo.EmployeeId,
            sendToName: namesSendtoXForUni,
            step: data.Steps,
            escalationId: '',
            lastActionBy: data.LastActionBy
          };
          data = await this.getRequesteData(data, requesteData)
          data = this.oPayload_modify(data)
          console.log("New Request Part: ", data)

          // ---------Post!-------
          await this.crud_z.update_record(this.mainEndPoint, data, data.Id) // Call------------


          // -------History Part---------
          let history = await this.getHistoryDataWorkFlow(data, "Re Assignee")
          console.log("NewRequest -> history: ", history)
          if (!history) { isError = true }

          // -------Mail Part---------
          let mail = this.emailService.start(data, history)
          if (!mail) { isError = true }

          this.setBusy(this.mainFormId, false)
          if (isError) {
            sap.m.MessageBox.error("Something went wrong, please contact the support team.", {
              title: "Error",                                      // Set the title to "Error"
              onClose: null,                                       // default behavior, no specific action on close
              styleClass: "",                                      // default
              actions: sap.m.MessageBox.Action.OK,                 // default
              emphasizedAction: sap.m.MessageBox.Action.OK,        // default
              initialFocus: null,                                  // default
              textDirection: sap.ui.core.TextDirection.Inherit,    // default
              dependentOn: null                                    // default
            });
            return false
          }

          let messageOfSuccess = `Thank you! The request Id: ${Number(data.Id)} has been successfully re assignee to: ${namesSendtoXForUni}.`
          sap.m.MessageBox.success(messageOfSuccess, {
            title: "Success",                                    // default
            onClose: null,                                       // default
            styleClass: "",                                      // default
            actions: sap.m.MessageBox.Action.OK,                 // default
            emphasizedAction: sap.m.MessageBox.Action.OK,        // default
            initialFocus: null,                                  // default
            textDirection: sap.ui.core.TextDirection.Inherit,    // default
            dependentOn: null                                    // default
          });

        }

        // -------End Part---------
        this.reSetValues()

        // data = this.oPayload_modify(data);

        // if (this.getMode() == 'Create') {
        //   let res = await this.crud_z.post_record(this.mainEndPoint, data)
        // } else {
        //   let res = await this.crud_z.update_record(this.mainEndPoint, data, data.Id)
        // }

        this.setBusy(this.mainFormId, false)
        this.setBusy(this.mainTableId_MyRequestStatus_XX, false)

        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getMainObj()), this.mainFromModel)// Reset
        this.getView().setModel(new sap.ui.model.json.JSONModel(await this.getMainTableData1()), this.mainTableModel)// Set
      },

      onSubmitInputUserId: async function (ev) {
        console.log("hh----------")
        this.getUserByIdOnInputUser(ev, true)
      },

      onChangeInputUserId: async function (ev) {
        this.getUserByIdOnInputUser(ev)
      },

      onRefresh: async function () {
        this.setBusy(this.mainTableId_MyRequestStatus_XX, true)
        
        this.getView().setModel(new sap.ui.model.json.JSONModel(await this.getMainTableData1()), this.mainTableModel_MyRequestStatus_XX)// Set
        this.setBusy(this.mainTableId_MyRequestStatus_XX, false)

      },

      // ================================== # Get Functions # ==================================
      getMainObj: function () {
        return {
          'EmployeeId': "",
          'EmployeeName': "",
        }
      },

      getMainTableData1: async function () {
        let data = await this.crud_z.get_record(this.mainEndPoint)
        return data.results.filter(el => el.Steps != 100)
      },

      // ================================== # Helper Functions # ==================================
      startValidationX: function (oPayload) {
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

      // oPayload_modify: function (oPayload) {
      //   oPayload = this.oPayload_modify_parent(oPayload)
      //   return oPayload
      // },

      // ================================== # Table FSG Functions # ==================================
      getDataXkeysAItems: function (ev) {
        let changeTextAItems = [{ oldtext: "Comment Z", newtext: "Comment" }]
        return this.UiTableFSG2.getDataXkeysAItems(ev, this.mainTableModel_MyRequestStatus_XX, changeTextAItems, ["RequesterId"])
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

      // ======
      switchState: function () {
        const oTable = this.byId(this.mainTableId_MyRequestStatus_XX);

        let oTemplate = oTable.getRowActionTemplate();
        if (oTemplate) {
          oTemplate.destroy();
          oTemplate = null;
        }
        // Define the press function

        let mode_x =
        {
          key: "Navigation",
          text: "Navigation",
          handler: function () {
            const oTemplate = new sap.ui.table.RowAction({
              items: [
                new sap.ui.table.RowActionItem({
                  type: "Navigation",
                  press: this.onRowSelectionChange.bind(this),
                  visible: "{Available}"
                })
              ]
            });
            return [1, oTemplate];
          }.bind(this)
        }

        oTable.setRowActionTemplate(mode_x.handler()[1]);
        oTable.setRowActionCount(mode_x.handler()[0]);
      },

      //======
      handleActionButtonPressed: function () {
        // Get the reference to the sap.m.Table
        var oTable = this.byId(this.mainTableId_MyRequestStatus_XX);

        // Get the selected indices (selected row indices)
        var aSelectedIndices = oTable.getSelectedIndices();
        // console.log({ aSelectedIndices });

        if (aSelectedIndices.length === 0) {
          sap.m.MessageToast.show("No rows selected.");
          return false;
        }

        // Extract the data for each selected index
        var aSelectedData = aSelectedIndices.map(function (iIndex) {
          // Get the context by index and retrieve the data object
          var oContext = oTable.getContextByIndex(iIndex);
          return oContext ? oContext.getObject() : null;
        }).filter(Boolean); // Remove any null values

        console.log("aSelectedData: ", aSelectedData)
        return aSelectedData
      },

      // ================================== # XX Functions# ==================================
      mergeWithSharing: async function (thisOfScharing) {
        // Helper function to introduce a 2-second delay
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        // Loop until thisOfScharing is available
        while (!thisOfScharing) {
          thisOfScharing = await this.sharingRequestFunctions.onInit()

          // Wait for 2 seconds before each iteration
          await delay(2000);

          // After delay, do the assignments (only if thisOfScharing is still undefined/null)
          if (thisOfScharing) {
            return thisOfScharing
          }
        }
        return thisOfScharing
      },

      // ================================== # XX Functions# ==================================
      onRowSelectionChange: function (ev) {
        // Get the selected index
        const iSelectedIndex = ev.getParameter("rowIndex");

        // Get the binding context of the selected row
        const oTable = this.byId(this.mainTableId_MyRequestStatus_XX);
        const oContext = oTable.getContextByIndex(iSelectedIndex);

        // Check if a row is selected and if there's a valid context
        if (oContext) {
          // Retrieve the data from the selected row
          const oSelectedRowData = oContext.getObject();

          // Assuming 'Id' is the field in your model for the row's unique ID
          const sSelectedId = oSelectedRowData.Id;

          console.log("Selected Row ID:", sSelectedId);

          this.getOwnerComponent().setModel(new sap.ui.model.json.JSONModel({ isShowAllRequest: true }), "isShowAllRequest");
          // You can now use the ID for navigation or any other purpose
          // this.onRowNavigate(sSelectedId);
          var oRouter = UIComponent.getRouterFor(this);

          oRouter.navTo('RouteRequestStatusForm', {
            Id: sSelectedId
          })

        }
      },




    });
  }
);
