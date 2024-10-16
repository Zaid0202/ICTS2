sap.ui.define(
  [
    "internal/controller/Helper/BaseController",
    "sap/ui/core/UIComponent",
    "internal/controller/Helper/SharingRequestFunctions",

  ],
  function (BaseController, UIComponent, SharingRequestFunctions) {
    "use strict";

    return BaseController.extend("internal.controller.Helper.SharingMyRequestStatusForm", {

      constructor: function (currentController) {
        this._currentController = currentController
        this.viewName = this._currentController.getView().getViewName();
        this.getViewIsName()
      },

      onInit: async function () {
        // ------------------------------------ Call Classs ------------------------------------
        this.sharingRequestFunctions = new SharingRequestFunctions(this._currentController)
        let thisOfScharing = await this.sharingRequestFunctions.onInit()
        thisOfScharing = await this.mergeWithSharing(thisOfScharing)
        Object.assign(this, thisOfScharing);
        Object.assign(Object.getPrototypeOf(this), Object.getPrototypeOf(thisOfScharing));

        console.log("SharingMyRequestStatusForm -> this",this)
        // this.reSetValues()
        this.setVisbileForFormInit()

        this.mainTableId = 'mainTableIdRequestStatusForm'
        this._currentController.helperModelInstance.setProperty("/mainFormTitle", "Request Details")

        const oRouter = sap.ui.core.UIComponent.getRouterFor(this._currentController);
        if (oRouter.getRoute("RouteRequestStatusForm")) {
          // console.log("if (oRouter.getRoute(RouteRequestStatusForm))")
          oRouter.getRoute("RouteRequestStatusForm").attachPatternMatched(this._onRouteMatcheds2s, this);
        } else {
          // console.log("RequestStatusForm -> else (oRouter)", oRouter)
        }
      },

      _onRouteMatcheds2s: async function (ev) {
        console.log("SharingMyRequestStatusForm -> _onRouteMatcheds2s -> this",this)

        this._currentController.setBusy('page_id_RequestStatusForm', true)
        this._currentController.setBusy('mainFormVboxId', true)
        this._currentController.setBusy(this.mainFormId, true)
        this._currentController.setBusy(this.mainTableId, true)

        this.reSetValues()
        await this.setInVlus()

        const oArgs = ev.getParameter("arguments");
        const sId = oArgs.Id;

        console.log("SharingMyRequestStatusForm -> this._currentController",this._currentController)
        console.log("SharingMyRequestStatusForm -> oArgs",oArgs)
        console.log("SharingMyRequestStatusForm -> sId",sId)

        try {
          // mainFormData Part ------------
          let selectedTaskz = await this.getMainFormData(sId)
          // let mainTableData = await this.getMainTableDataProcessedByMe(sId)

          // selectedTaskz.PublishingDate = this.formatRequestDate(selectedTaskz.PublishingDate);

          // this._currentController.getView().setModel(new sap.ui.model.json.JSONModel(selectedTaskz), this.mainFormModel);
          // this._currentController.getView().setModel(new sap.ui.model.json.JSONModel(mainTableData), this.mainTableModel);


          // this.setComments(selectedTaskz)

          // this.setVisbileOnSelected(selectedTaskz.MainService)

          // //Fileds Commnets 
          // this.setVisbileForForm2(this.getAdditionObj("c")[0], true, false, false);

          // this.setVisbileForForm2('AttachmentInput', false, false, false);
          // this.setVisbileForForm2('AdditionalAttachmentInput', false, false, false);


          // this.setVisbileForForm2('AttachmentButton', true, false, false);
          // this.setVisbileForForm2('AdditionalAttachmentButton', true, false, false);


          console.log("Finsheing _onRouteMatched -----------------------try-----------------")


        } catch {
          console.error("RequestStatusForm -> Error")
        }

        this._currentController.setBusy(this.mainFormId, false)
        this._currentController.setBusy(this.mainTableId, false)
        this._currentController.setBusy('mainFormVboxId', false)
        this._currentController.setBusy('page_id_RequestStatusForm', false)

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
        this._currentController.setBusy(this.mainFormId, true)

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

        this._currentController.setBusy(this.mainFormId, false)

        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getMainObj()), this.mainFormModel)// Reset
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

      // getMainFormData: async function (RequesteId) {
      //   // let filter = { "name": "Id", "value": this.userInfo.empId }
      //   // let data = await this.crud_z.get_record(this.mainEndPoint, '', filter)
      //   console.log("this.mainEndPoint",this.mainEndPoint)
      //   // let data = await this._currentController.crud_z.get_record(this.mainEndPoint, RequesteId)
      //   // // var filteredRecords = data.results.filter(function (record) {
      //   // //   return record.RequesterId == this.userInfo.empId;
      //   // // }.bind(this));

      //   // if (data.RequesterId == this.userInfo.empId) {
      //   //   console.log({ data })
      //   //   return data

      //   // }
      // },

      getMainTableDataProcessedByMe: async function (RequestId) {
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
      // setBusy: function (id, status) {
      //   this.getView().byId(id).setBusy(status);
      // },

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

      // ================================== # XXXX Functions # ==================================

      getViewIsName: function () {
        this.isMyTasks = this.viewName == "internal.view.MyTasks"
        this.isNewRequest = this.viewName == "internal.view.NewRequest"
        this.isRequestStatusForm = this.viewName == "internal.view.RequestStatusForm"
        this._currentController.getView().setModel(new sap.ui.model.json.JSONModel({ isMyTasks: this.isMyTasks, isNewRequest: this.isNewRequest, isRequestStatusForm: this.isRequestStatusForm }), 'isPageNameModel');
      },

    });
  }
);
