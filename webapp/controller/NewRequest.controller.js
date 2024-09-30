
sap.ui.define(
  [
    "internal/controller/Helper/BaseController",
    "internal/controller/Helper/SharingRequestFunctions",


  ],
  function (BaseController, SharingRequestFunctions) {
    "use strict";

    return BaseController.extend("internal.controller.NewRequest", {
      onInit: async function () {
        await BaseController.prototype.onInit.apply(this, []);

        // ------------------------------------ Call Classs ------------------------------------
        this.sharingRequestFunctions = new SharingRequestFunctions(this)
        let thisOfScharing = await this.sharingRequestFunctions.onInit()
        thisOfScharing = await this.mergeWithSharing(thisOfScharing)
        Object.assign(this, thisOfScharing);
        Object.assign(Object.getPrototypeOf(this), Object.getPrototypeOf(thisOfScharing));

        this.setVisbileForFormInit()
        // Set Main Service True visible
        this.setVisbileForForm2('MainService', true, true, true);

        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getMainObj()), this.mainFormModel);
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

      onMainSubmit: async function (ev) {
        let data = this.onMainSubmitSharing()
        if (!data) { return false }

        data.RequestDate = new Date()

        data = { ...this.getMainObj(), ...data }
        // ------------------------------------------------------------------------------------------------

        // -------New Request Part---------
        let requesteData = { status: "Pending" }
        data = await this.getRequesteData(data, requesteData)
        console.log("New Request Part: ", data)

        this.setBusy(this.mainFormId, true)
        // ---------Uploade File!-------
        data = await this.uploadeFile.callUploadFiles(data)  //------- callUploadFiles Part--------- Call Uploade Files Function and add File Id on data
        console.log("callUploadFiles Part: ", data)

        // ---------Post!-------
        let resData = await this.crud_z.post_record(this.mainEndPoint, data)
        console.log("res Data Part: ", data)

        // -------History Part---------
        let history = await this.getHistoryDataWorkFlow(resData)

        // -------Mail Part---------
        this.emailService.start(resData, history)

        // -------End Part---------
        this.reSetValues()
        sap.m.MessageBox.success("Thank you! Your request has been successfully submitted.", {
          title: "Success",                                    // default
          onClose: null,                                       // default
          styleClass: "",                                      // default
          actions: sap.m.MessageBox.Action.OK,                 // default
          emphasizedAction: sap.m.MessageBox.Action.OK,        // default
          initialFocus: null,                                  // default
          textDirection: sap.ui.core.TextDirection.Inherit,    // default
          dependentOn: null                                    // default
        });

        this.setBusy(this.mainFormId, false)
      },


      onTaskNameChange: function (oEvent) {
        var sSelectedKey = oEvent.getParameter("selectedItem").getKey();

        this.setVisbileOnSelected(sSelectedKey)

        this.setVisbileForForm2('MainService', true, true, true);
        this.setVisbileForForm2(this.getAdditionObj("b")[0], true, false, false);

        this.reSetValues()

        this.getView().getModel(this.mainFormModel).setProperty('/MainService', sSelectedKey)
      },

      oPayload_modify: function (oPayload) {
        oPayload.Steps = Number(oPayload.Steps)
        oPayload = this.oPayload_modify_parent(oPayload)
        return oPayload
      },

      onDateTimeChange: function (ev) {
        var oDateTimePicker = ev.getSource();
        this.dateTime = oDateTimePicker
        var sValue = oDateTimePicker.getValue();
        this.getView().getModel(this.IGNModel).setProperty('/PublishingDate', sValue)
      },

      // ----------------------------Uplaode Files Start-------------------------------
      onFileChange: function (oEvent) {
        this.uploadeFile.listObjFiles.push({ oEvent: oEvent, key: 'Attachment' });
      },

      onFileChange2: function (oEvent) {
        this.uploadeFile.listObjFiles.push({ oEvent: oEvent, key: 'AdditionalAttachment' });
      },

      // ----------
      onDownloadPress: function (oEvent) {
        // Get the button that triggered the event
        const oButton = oEvent.getSource();

        // Retrieve the Attachment ID from custom data
        const sFileId = oButton.data("Attachment");

        if (sFileId) {
          this.uploadeFile.downloadFile(sFileId);
        } else {
          console.error("No Attachment ID found");
        }
      },
    });
  }
);
