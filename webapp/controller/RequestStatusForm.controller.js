sap.ui.define(
  [
    "internal/controller/Helper/BaseController",
    "sap/ui/core/UIComponent",
    "internal/controller/Helper/UploadeFile",

  ],
  function (BaseController, UIComponent, UploadeFile) {
    "use strict";

    return BaseController.extend("internal.controller.RequestStatusForm", {
      onInit: async function () {
        BaseController.prototype.onInit.apply(this, []);
        this.uploadeFile = new UploadeFile(this)


        this.mainEndPoint = this.endsPoints['NewRequest']

        this.pageName = 'RequestStatusForm'
        this.mainFormModel = 'mainFormModel'
        this.mainFormErrModel = "mainFormErrModel"

        this.mainFormId = 'mainFormId' + this.pageName

        this.mainTableId = 'mainTableId' + this.pageName
        this.UiTableFSG2.setTableId(this.mainTableId)


        this.mainTableModel = 'mainTableModel'


        this.IGNModel = 'IGNModel'
        this.IGNErrModel = 'IGNErrModel'

        this.RevisionRequestModel = 'RevisionRequestModel'
        this.RevisionRequestErrModel = 'RevisionRequestErrModel'

        this.helperModelInstance.setProperty('/IsIGN', false)
        this.helperModelInstance.setProperty('/IsRevisionRequest', false)
        this.reSetValues()

        const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        if (oRouter.getRoute("RouteRequestStatusForm")) {
          oRouter.getRoute("RouteRequestStatusForm").attachPatternMatched(this._onRouteMatched, this);
        }

      },

      _onRouteMatched: async function (ev) {
        this.reSetValues()
        const oArgs = ev.getParameter("arguments");
        const sId = oArgs.Id;

        try {
          this.setBusy(this.mainFormId, true)
          this.setBusy(this.mainTableId, true)

          // mainFormData Part ------------
          let mainFormData = await this.getMainFormData(sId)

          this.getView().setModel(new sap.ui.model.json.JSONModel(mainFormData), this.IGNModel);
          this.getView().setModel(new sap.ui.model.json.JSONModel(mainFormData), this.RevisionRequestModel);

          this.helperModelInstance.setProperty('/MainServices', mainFormData.MainService)

          const oDatePicker = this.byId("PublishingDateID"); // Get the DatePicker by its ID
          if (oDatePicker) {
            // Set the date value
            oDatePicker.setDateValue(mainFormData?.PublishingDate); // Sets the date in the DatePicker
            this.getView().getModel(this.IGNModel).setProperty('/PublishingDate', mainFormData?.PublishingDate)

            // mainTable Data Part ------------
            let mainTableData = await this.getMainTableData(sId)
            this.getView().setModel(new sap.ui.model.json.JSONModel(mainTableData), this.mainTableModel);

          } else {
            console.error("DatePicker with ID 'PublishingDateID' not found.");
          }

          this.setBusy(this.mainFormId, false)
          this.setBusy(this.mainTableId, false)
          this.setVisbileForForm(mainFormData.MainService)


        } catch {

        }
        // You can now use sId in your logic
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

      getMainTableData: async function (RequestId) {
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

      reSetValues: function () {
        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getObjRevisionRequest()), this.RevisionRequestModel);
        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getObjIGN()), this.IGNModel);

        this.dateTime?.setValue('')
      },

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
