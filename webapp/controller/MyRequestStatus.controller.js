sap.ui.define(
  [
    "internal/controller/Helper/BaseController",
    "sap/ui/core/UIComponent",

  ],
  function (BaseController, UIComponent) {
    "use strict";

    return BaseController.extend("internal.controller.MyRequestStatus", {
      onInit: async function () {
        console.log("Initializing MyRequestStatus")

        await BaseController.prototype.onInit.apply(this, []);

        this.mainEndPoint = this.endsPoints['NewRequest']

        this.pageName = 'MyRequestStatus'

        this.mainFormModel = 'mainFormModel'
        this.mainFormErrModel = "mainFormErrModel"
        this.mainFormId = 'mainFormId' + this.pageName

        this.mainTableModel = 'mainTableModel'
        this.mainTableId = 'mainTableId' + this.pageName
        this.UiTableFSG2.setTableId(this.mainTableId)

        await this.onRefresh()

      },


      onRefresh: async function () {
        this.setBusy(this.mainTableId, true)
        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getObjMain()), this.mainFormModel);
        let tableData = await this.getMainTableData()
        this.getView().setModel(new sap.ui.model.json.JSONModel(tableData), this.mainTableModel)// Set
        this.setBusy(this.mainTableId, false)
      },

      getObjMain: function () {
        return { Id: '' }
      },

      getMainTableData: async function () {
        // let filter = { "name": "Id", "value": this.userInfo.empId }
        // let data = await this.crud_z.get_record(this.mainEndPoint, '', filter)

        let data = await this.crud_z.get_record(this.mainEndPoint)
        var filteredRecords = data.results.filter(function (record) {
          return record.RequesterId == this.userInfo?.empId;
        }.bind(this));

        // console.log("MyRequestStatus-> filteredRecords: ", filteredRecords)
        // console.log("MyRequestStatus-> this.userInfo.empId: ", this.userInfo.empId)

        return filteredRecords
      },

      formatAttachmentText: async function (sAttachment) {
        if (sAttachment) {
          this.setBusy('AttachmentButtonId', true)
          try {
            // Retrieve the file details based on the Attachment ID
            let fileDetails = await this.crud_z.get_record(this.endsPoints['UploadFile'], sAttachment, {});

            // Return the desired text (e.g., file name or description)
            this.setBusy('AttachmentButtonId', false)
            return fileDetails.FileName || "Download";
          } catch (error) {
            console.error("Failed to retrieve file details:", error);
            this.setBusy('AttachmentButtonId', false)
            return "Error";
          }
        }
        return "No Attachment";
      },

      formatAttachmentText2: async function (sAttachment) {
        if (sAttachment) {
          this.setBusy('AttachmentButtonId2', true)
          try {
            // Retrieve the file details based on the Attachment ID
            let fileDetails = await this.crud_z.get_record(this.endsPoints['UploadFile'], sAttachment, {});

            // Return the desired text (e.g., file name or description)
            this.setBusy('AttachmentButtonId2', false)
            return fileDetails.FileName || "Download";
          } catch (error) {
            console.error("Failed to retrieve file details:", error);
            this.setBusy('AttachmentButtonId', false)
            return "Error";
          }
        }
        return "No Attachment";
      },

      onRowSelectionChange: function (ev) {
        // Get the selected index
        const iSelectedIndex = ev.getParameter("rowIndex");

        // Get the binding context of the selected row
        const oTable = this.byId(this.mainTableId);
        const oContext = oTable.getContextByIndex(iSelectedIndex);

        // Check if a row is selected and if there's a valid context
        if (oContext) {
          // Retrieve the data from the selected row
          const oSelectedRowData = oContext.getObject();

          // Assuming 'Id' is the field in your model for the row's unique ID
          const sSelectedId = oSelectedRowData.Id;

          console.log("Selected Row ID:", sSelectedId);

          // You can now use the ID for navigation or any other purpose
          // this.onRowNavigate(sSelectedId);
          var oRouter = UIComponent.getRouterFor(this);

          oRouter.navTo('RouteRequestStatusForm', {
            Id: sSelectedId
          })

        }
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
