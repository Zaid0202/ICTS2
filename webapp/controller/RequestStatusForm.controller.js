sap.ui.define(
  [
    "internal/controller/Helper/BaseController",
    "sap/ui/core/UIComponent",
    "internal/controller/Helper/SharingRequestFunctions",

  ],
  function (BaseController, UIComponent, SharingRequestFunctions) {
    "use strict";

    return BaseController.extend("internal.controller.RequestStatusForm", {
      onInit: async function () {
        await BaseController.prototype.onInit.apply(this, []);

        // ------------------------------------ Call Classs ------------------------------------
        this.sharingRequestFunctions = new SharingRequestFunctions(this)
        let thisOfScharing = await this.sharingRequestFunctions.onInit()
        thisOfScharing = await this.mergeWithSharing(thisOfScharing)
        Object.assign(this, thisOfScharing);
        Object.assign(Object.getPrototypeOf(this), Object.getPrototypeOf(thisOfScharing));

        this.reSetValues()
        this.setVisbileForFormInit()

        this.mainTableId = 'mainTableIdRequestStatusForm'
        this.helperModelInstance.setProperty("/mainFormTitle", "Request Details")

        const oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        if (oRouter.getRoute("RouteRequestStatusForm")) {
          console.log("if (oRouter.getRoute(RouteRequestStatusForm))")
          oRouter.getRoute("RouteRequestStatusForm").attachPatternMatched(this._onRouteMatcheds2s, this);
        } else {
          console.log("RequestStatusForm -> else (oRouter)", oRouter)

        }

      },

      _onRouteMatcheds2s: async function (ev) {
        this.reSetValues()
        const oArgs = ev.getParameter("arguments");
        const sId = oArgs.Id;

        this.setBusy(this.mainFormId, true)
        this.setBusy(this.mainTableId, true)

        try {
          // mainFormData Part ------------
          let selectedTaskz = await this.getMainFormData(sId)
          let mainTableData = await this.getMainTableData2(sId)

          this.getView().setModel(new sap.ui.model.json.JSONModel(selectedTaskz), this.mainFormModel);
          this.getView().setModel(new sap.ui.model.json.JSONModel(mainTableData), this.mainTableModel);


          // const oDatePicker = this.byId("PublishingDateID"); // Get the DatePicker by its ID
          // if (oDatePicker) {
          //   // Set the date value
          //   oDatePicker.setDateValue(mainFormData?.PublishingDate); // Sets the date in the DatePicker
          //   this.getView().getModel(this.IGNModel).setProperty('/PublishingDate', mainFormData?.PublishingDate)

          //   // mainTable Data Part ------------

          // } else {
          //   console.error("DatePicker with ID 'PublishingDateID' not found.");
          // }

          this.setVisbileOnSelected(selectedTaskz.MainService)
          console.log("Finsheing _onRouteMatched -----------------------try-----------------")


        } catch {
          console.error("RequestStatusForm -> Error")
        }

        this.setBusy(this.mainFormId, false)
        this.setBusy(this.mainTableId, false)

        // You can now use sId in your logic
      },

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

      // ================================== # On Functions # ==================================

      onMainSubmit: async function (ev) {
        this.setBusy(this.mainFormId, true)

        let data = this.getView().getModel(this.mainFormModel).getData()

        let isErr = this.startValidation(data)
        if (isErr) {
          return false
        }

        data = this.oPayload_modify(data);

        if (this.getMode() == 'Create') {
          let res = await this.crud_z.post_record(this.mainEndPoint, data)
        } else {
          let res = await this.crud_z.update_record(this.mainEndPoint, data, data.Id)
        }

        this.setBusy(this.mainFormId, false)

        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getMainObj()), this.mainFormModel)// Reset
      },

      onTaskNameChange: function (oEvent) {
        var sSelectedKey = oEvent.getParameter("selectedItem").getKey();

        if (["Internal Announcement", "Graphic Design", "Nadec Home Post"].includes(sSelectedKey)) {
          this.helperModelInstance.setProperty("/IsIGN", true);
          this.helperModelInstance.setProperty("/IsRevisionRequest", false);

        } else if (sSelectedKey === 'Revision Request') {
          // Set To Visible
          this.helperModelInstance.setProperty("/IsIGN", false);
          this.helperModelInstance.setProperty("/IsRevisionRequest", true);
        }

        this.reSetValues()
      },

      // ================================== # Get Functions # ==================================
      getMainObj: function () {
        return {}
      },

      getObjIGN: function () {
        return {
          "MainService": "",
          "Urgency": "",
          "CommunicationType": "",
          "PublishingDate": "",
          "Brief": "",
          "DesignBriefAndDescription": "",
          "ReportingDepartment": "",
          "Subject": "",
        }
      },

      getObjRevisionRequest: function () {
        return {
          "MainService": "",
          "Description": "",
          "Attachment": "",
          "AdditionalLink": "",
          "AdditionalAttachment": "",
        }
      },

      getMainFormData: async function (RequesteId) {
        // let filter = { "name": "Id", "value": this.userInfo.empId }
        // let data = await this.crud_z.get_record(this.mainEndPoint, '', filter)

        let data = await this.crud_z.get_record(this.mainEndPoint, RequesteId)
        // var filteredRecords = data.results.filter(function (record) {
        //   return record.RequesterId == this.userInfo.empId;
        // }.bind(this));

        if (data.RequesterId == this.userInfo.empId) {
          console.log({ data })
          return data

        }
      },

      getMainTableData2: async function (RequestId) {
        // let filter = { "name": "Id", "value": RequestId }
        // let data = await this.crud_z.get_record(this.mainEndPoint, '', filter)

        let data = await this.crud_z.get_record(this.endsPoints['ProcessedByMe'])
        var filteredRecords = data.results.filter(function (record) {
          return record.RequestId == RequestId;
        }.bind(this));

        if (filteredRecords[0].ProcessedId == this.userInfo.empId) {
          console.log({ filteredRecords })
          return filteredRecords
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

      // reSetValues: function () {
      //   this.getView().setModel(new sap.ui.model.json.JSONModel(this.getObjRevisionRequest()), this.RevisionRequestModel);
      //   this.getView().setModel(new sap.ui.model.json.JSONModel(this.getObjIGN()), this.IGNModel);

      //   this.dateTime?.setValue('')
      // },

      setVisbileForForm: function (sSelectedKey) {
        if (["Internal Announcement", "Graphic Design", "Nadec Home Post"].includes(sSelectedKey)) {
          this.helperModelInstance.setProperty("/IsIGN", true);
          this.helperModelInstance.setProperty("/IsRevisionRequest", false);

        } else if (sSelectedKey === 'Revision Request') {
          // Set To Visible
          this.helperModelInstance.setProperty("/IsIGN", false);
          this.helperModelInstance.setProperty("/IsRevisionRequest", true);
        }
      },


      onDownloadPress: function (oEvent) {
        // Get the button that triggered the event
        const oButton = oEvent.getSource();

        // Retrieve the Attachment ID Form custom data
        const sFileId = oButton.data("Attachment");

        if (sFileId) {
          this.uploadeFile.downloadFile(sFileId);
        } else {
          console.error("No Attachment ID found");
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
