sap.ui.define(
  [
    "internal/controller/Helper/BaseController",
  ],
  function (BaseController) {
    "use strict";

    return BaseController.extend("internal.controller.ProcessedByMe", {
      onInit: async function () {
        BaseController.prototype.onInit.apply(this, []);

        this.mainEndPoint = this.endsPoints['ProcessedByMe']

        this.pageName = 'ProcessedByMe'


        this.mainTableModel = 'mainTableModel'
        this.mainTableId = 'mainTableId' + this.pageName
        this.UiTableFSG2.setTableId(this.mainTableId)
        
        this.getView().setModel(new sap.ui.model.json.JSONModel(await this.getMainTableData()), this.mainTableModel);
      },

      getMainTableData: async function () {
        // let filter = { "name": "Id", "value": RequestId }
        // let data = await this.crud_z.get_record(this.mainEndPoint, '', filter)

        let data = await this.crud_z.get_record(this.mainEndPoint)
        var filteredRecords = data.results.filter(function (record) {
          return record.ProcessedId == this.userInfo.empId;
        }.bind(this));

        if (filteredRecords[0].ProcessedId == this.userInfo.empId) {
          // console.log("ProcessedByMe -> filteredRecords: ",filteredRecords)
          return filteredRecords
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
