sap.ui.define(
  [
    "internal/controller/Helper/BaseController",
    "sap/ui/core/UIComponent",

  ],

  function (BaseController, UIComponent) {
    "use strict";

    return BaseController.extend("internal.controller.ReAssignee", {
      onInit: async function () {
        await BaseController.prototype.onInit.apply(this, []);

        this.pageName = 'ReAssignee'
        this.mainEndPoint = this.endsPoints['NewRequest']
        this.mainTableModel_MyRequestStatus_XX = "mainTableModel_MyRequestStatus_XX"

        this.mainTableId_MyRequestStatus_XX = 'mainTableId_MyRequestStatus_XX'
        this.UiTableFSG2.setTableId(this.mainTableId_MyRequestStatus_XX)

        this.getView().setModel(new sap.ui.model.json.JSONModel(await this.getMainTableData1()), this.mainTableModel_MyRequestStatus_XX)// Set

        // ---------------------------
        // this.reSetValues()
        // this.setVisbileForFormInit()

        this.mainTableId = 'mainTableIdRequestStatusForm'
        this.helperModelInstance.setProperty("/mainFormTitle", "Request Details")

      },

      // ================================== # On Functions # ==================================


      // ================================== # Get Functions # ==================================
      getMainTableData1: async function () {
        let data = await this.crud_z.get_record(this.mainEndPoint)
        return data.results
      },

      // ================================== # Helper Functions # ==================================

      // ================================== # Table FSG Functions # ==================================
      getDataXkeysAItems: function (ev) {
        let changeTextAItems = [{ oldtext: "Comment Z", newtext: "Comment" }]
        return this.UiTableFSG2.getDataXkeysAItems(ev, this.mainTableModel_MyRequestStatus_XX, changeTextAItems)
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
