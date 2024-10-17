
sap.ui.define(
  [
    "internal/controller/Helper/BaseController",
    "internal/controller/Helper/SharingRequestFunctions",
    "sap/m/MessageBox",


  ],
  function (BaseController, SharingRequestFunctions, MessageBox) {
    "use strict";

    return BaseController.extend("internal.controller.NewRequest", {
      onInit: async function () {
        this.getView()?.byId('mainFormVboxId')?.setBusy(true);
        await BaseController.prototype.onInit.apply(this, []);

        // ------------------------------------ Call Classs ------------------------------------
        this.sharingRequestFunctions = new SharingRequestFunctions(this)
        let thisOfScharing = await this.sharingRequestFunctions.onInit()
        thisOfScharing = await this.mergeWithSharing(thisOfScharing)
        Object.assign(this, thisOfScharing);
        Object.assign(Object.getPrototypeOf(this), Object.getPrototypeOf(thisOfScharing));

        this.setVisbileForFormInit()

        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getMainObjCharing()), this.mainFormModel);
        this.helperModelInstance.setProperty("/mainFormTitle", "Create New Request")
        this.getView()?.byId('mainFormVboxId')?.setBusy(false);

        // Set Main Service True visible
        this.setVisbileForForm2('MainService', true, true, true);

      },


      onBeforeRendering: function () {
        console.log(" ----------------------- onBeforeRendering-----------------------")
        let aFieldNames = this.getaFieldNames("mainFormId")
        console.log("aFieldNames", aFieldNames)
        aFieldNames.forEach(function (sFieldName) {
          // Set the visibility to false in the helper model for each field
          this.getView().getModel("helperModel").setProperty(`/view/${sFieldName}/visible`, false);
        }.bind(this));

        // Manipulate the view elements before rendering
      },

      onAfterRendering: function () {
        console.log(" ----------------------- onAfterRendering----------------------")
        // Access the DOM and manipulate UI elements after rendering
      },

      onExit: function () {
        console.log(" ----------------------- onExit-------------------")
        // Cleanup code, like detaching events or clearing resources
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
        let isError = false

        let data = this.onMainSubmitSharing()
        if (!data) { return false }

        data = { ...this.getMainObjCharing(), ...data }

        if (!data) { isError = true } // Set Error True
        // ------------------------------------------------------------------------------------------------

        this.isConfired = false
        // Create a promise for the confirmation
        const confirmation = await new Promise((resolve) => {

          MessageBox.confirm(`Are you sure you want to send the request?`, {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.OK,
            onClose: function (sAction) {
              if (sAction === "OK") {
                this.isConfired = true;
              }
              resolve(this.isConfired); // Resolve the promise with the user's choice
            }.bind(this)
          });

        });

        if (!confirmation) { return false }
        this.setBusy(this.mainFormId, true)

        // -------New Request Part---------

        let requesteData = { status: "Pending" }
        data = await this.getRequesteData(data, requesteData)
        data = this.oPayload_modify(data)
        console.log("New Request Part: ", data)

        // return

        // ---------Uploade File!-------
        data = await this.uploadeFile.callUploadFiles(data)  //------- callUploadFiles Part--------- Call Uploade Files Function and add File Id on data
        console.log("callUploadFiles Part: ", data)

        if (!data) { isError = true } // Set Error True

        // ---------Post!-------
        let resData = await this.crud_z.post_record(this.mainEndPoint, data)
        console.log("res Data Part: ", data)
        if (!resData) { return false }
        
        // -------History Part---------
        let history = await this.getHistoryDataWorkFlow(resData)
        console.log("NewRequest -> history: ", history)
        if (!history) { isError = true }

        // -------Mail Part---------
        let mail = this.emailService.start(resData, history)
        if (!mail) { isError = true }

        let messageOfSuccess = `Thank you! Your request Id: ${Number(resData.Id)} has been successfully submitted,\n${resData.StatusDisplay}.`
        // -------End Part---------

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
        }

        this.reSetValues()
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

      },


      onTaskNameChange: function (oEvent) {
        var sSelectedKey = oEvent.getParameter("selectedItem").getKey();

        this.setVisbileOnSelected(sSelectedKey)

        this.setVisbileForForm2('MainService', true, true, true);
        this.setVisbileForForm2(this.getAdditionObj("b")[0], true, false, false);

        this.reSetValues()

        this.getView().getModel(this.mainFormModel).setProperty('/MainService', sSelectedKey)
      },


      // onDateTimeChange: function (ev) {
      //   var oDateTimePicker = ev.getSource();
      //   this.dateTime = oDateTimePicker
      //   var sValue = oDateTimePicker.getValue();
      //   this.getView().getModel(this.IGNModel).setProperty('/PublishingDate', sValue)
      // },

      // ----------------------------Uplaode Files Start-------------------------------
      onFileChange: function (oEvent) {
        const oFile = oEvent.getParameter("files")[0];

        const sFileName = oFile.name;
        const sFileType = oFile.type || "application/octet-stream";

        console.log(oFile)
        console.log(sFileName)
        console.log(sFileType)
        this.getView().getModel(this.mainFormModel).setProperty("/Attachment", sFileName)
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
