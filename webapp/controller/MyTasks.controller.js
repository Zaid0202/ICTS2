sap.ui.define(
  [
    "internal/controller/Helper/BaseController",
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel",
    "internal/controller/Helper/UploadeFile",
    "sap/m/MessageBox",
    "internal/controller/Helper/SharingRequestFunctions",
    "sap/m/MessageToast",

  ],
  function (BaseController, Device, JSONModel, UploadeFile, MessageBox, SharingRequestFunctions, MessageToast) {
    "use strict";

    return BaseController.extend("internal.controller.MyTasks", {

      onInit: async function () {
        await BaseController.prototype.onInit.apply(this, []);


        this.isMyTask = true
        // ------------------------------------ Call Classs ------------------------------------
        this.sharingRequestFunctions = new SharingRequestFunctions(this)
        let thisOfScharing = await this.sharingRequestFunctions.onInit()
        thisOfScharing = await this.mergeWithSharing(thisOfScharing)
        Object.assign(this, thisOfScharing);
        Object.assign(Object.getPrototypeOf(this), Object.getPrototypeOf(thisOfScharing));

        // -------------- Dont Useing this in Prodections Dengers ---------------------- 
        // await this.deleteAllIn() 

        // ------------------------------------ Constents ------------------------------------
        this.mainEndPoint = this.endsPoints['NewRequest']
        this.mainFormId = 'mainFormId'
        this.mainFormModel = 'mainFormModel'
        this.mainFormErrModel = "mainFormErrModel"

        this.mainTableId = 'mainTableId'
        this.mainTableModel = 'mainTableModel'

        this.CommentModel = 'CommentModel'
        this.CommentErrModel = 'CommentErrModel'

        this.pageName = 'MyTasks'

        // ------------------------------------ Initials Values ------------------------------------
        this.helperModelInstance.setProperty("/mainFormTitle", "Request Details")
        this.onRefresh()
        this.setVisbileForFormInit()

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

      // ================================== # Init Functiolns XX # ==================================
      updateRequesteData: async function (data, requesteData) {
        let approvalNextLvlData = {}
        let employeeIds = {}
        let employeeNames = {}

        if (this.objStatus.status === 'Pending') {

        }

        if (this.objStatus.status === 'Approved') {
          approvalNextLvlData = await this.getSelectedMainServiceNextLvl(data)

          if ((approvalNextLvlData.length == 0) && ((data.Steps + 1) <= 2)) { // Sheck if lvl 2 is not Exist! return false
            this.setBusy(this.mainFormId, false);
            MessageToast.show("This Main Service Dose not Have Approvel Level! (" + (data.Steps + 1) + ")");
            return false;
          }

          // Extract EmployeeIds as a comma-separated string
          employeeIds = approvalNextLvlData?.map(function (emp) {
            return emp.EmployeeId;
          }).join(", ");

          // Extract EmployeeNames as a comma-separated string
          employeeNames = approvalNextLvlData?.map(function (emp) {
            return emp.EmployeeName;
          }).join(", ");

          requesteData.sendTo = employeeIds
          requesteData.sendToName = employeeNames

          let approvalNextLvlData2 = await this.getSelectedMainServiceNextLvl({ MainService: data.MainService, Steps: data.Steps + 1 })

          if (approvalNextLvlData2.length == 0) {
            let approvalNextLvlData2_ = await this.getSelectedMainServiceNextLvl2(data)
            if (approvalNextLvlData2_.length != 0) {
              requesteData.escalationId = approvalNextLvlData2_.EmployeeId
            }
          }
        }

        if (this.objStatus.status === 'Returned') {
          requesteData.sendTo = data.RequesterId
          requesteData.sendToName = data.RequesterName
          // console.log("New Request Returned:  ", requesteData)
          // console.log("New Request data.RequesterId:  ", data.RequesterId)
          // console.log("New Request data.RequesterName:  ", data.RequesterName)

        }

        if (this.objStatus.status === 'Rejected') {

        }


        if (this.objStatus.status === 'Assigned') {
          let assigneesTableModel = this.getView().getModel("SettingsAssigneesTableModel").getData()

          let AssigneesData = this.getView().getModel("SettingsAssigneesFormModel").getData();
          employeeIds = AssigneesData.SendTo
          employeeNames = assigneesTableModel.filter(elm => elm.EmployeeId == AssigneesData.SendTo)[0].EmployeeName

          requesteData.sendTo = employeeIds
          requesteData.sendToName = employeeNames
        }

        if (this.objStatus.status === 'WorkInProgress') {
          // approvalNextLvlData = await this.getSelectedMainServiceNextLvl(data, true)
          // console.log("approvalNextLvlData:  ", approvalNextLvlData)

          // // Extract EmployeeIds as a comma-separated string
          // employeeIds = approvalNextLvlData?.map(function (emp) {
          //   return emp.EmployeeId;
          // }).join(", ");

          // // Extract EmployeeNames as a comma-separated string
          // employeeNames = approvalNextLvlData?.map(function (emp) {
          //   return emp.EmployeeName;
          // }).join(", ");

          requesteData.sendTo = data.sendTo
          requesteData.sendToName = this.extractNameFromStatusDisplay(data.StatusDisplay)

        }

        if (this.objStatus.status === 'Completed') {
          // approvalNextLvlData = await this.getSelectedMainServiceNextLvl(data, true)
          // console.log("approvalNextLvlData:  ", approvalNextLvlData)

          // // Extract EmployeeIds as a comma-separated string
          // employeeIds = approvalNextLvlData?.map(function (emp) {
          //   return emp.EmployeeId;
          // }).join(", ");

          // // Extract EmployeeNames as a comma-separated string
          // employeeNames = approvalNextLvlData?.map(function (emp) {
          //   return emp.EmployeeName;
          // }).join(", ");
          let str = data.lastActionBy
          // Use regular expressions to extract the name and the number
          employeeIds = str.match(/\((\d+)\)/)[1]; // Extract the number inside parentheses
          employeeNames = str.match(/^[a-zA-Z]+/)[0]; // Extract the name part


          requesteData.sendTo = employeeIds
          requesteData.sendToName = employeeNames
        }

        if (this.objStatus.status === 'Closed') {

        }

        return requesteData
      },

      onMainSubmit: async function () {
        console.log("this.objStatus: ", this.objStatus)

        let data = this.onMainSubmitSharing()
        if (!data) { return false }

        let commentData = this.getView().getModel(this.CommentModel).getData();

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


        let isErr = this.startValidationComment(commentData)
        if (isErr) {
          // For AssigneesData startValidationAssingees
          let AssigneesData = this.getView().getModel("SettingsAssigneesFormModel").getData();
          let isErrAssingees = this.startValidationAssingees(AssigneesData)
          if (isErrAssingees && (this.objStatus == "Assigned")) {
            return false
          }
          return false
        }
        // ------------------------------------------------------------------------------------------------
        // Set Mode --> Edit.
        this.setMode("Edit")
        this.setBusy(this.mainFormId, true)

        // -------New Request Part---------
        let requesteData = {
          status: this.objStatus.status, // This will be one of: Pending, Approved, Rejected, Returned, Closed,  Assigned , Progress
          sendTo: "",
          sendToName: "",
          step: data.Steps,
          escalationId: '',
          lastActionBy: data.LastActionBy
        };
        requesteData = await this.updateRequesteData(data, requesteData) // Here Set Values Bese in Status

        if (!requesteData) { return false }

        let requesteDataTamp = requesteData
        console.log("MyTasks -> requesteDataTamp: ", requesteDataTamp)

        let namesSendto = this.formatSendToNames(requesteDataTamp.sendTo, requesteDataTamp.sendToName)
        console.log("MyTasks -> requesteDataTamp: ", requesteDataTamp)
        console.log("MyTasks -> namesSendto: ", namesSendto)

        data = await this.getRequesteData(data, requesteData) // Here Get Values Bese in Status
        console.log("MyTasks -> data: ", data)

        if (!data) { return false }
        // return 1
        // ---------Uploade File!-------
        if (this.objStatus.isUpload) { data = await this.uploadeFile.callUploadFiles(data) } //------- callUploadFiles Part--------- Call Uploade Files Function and add File Id on data

        // ---------Post!-------
        let resData = await this.crud_z.update_record(this.mainEndPoint, data, data.Id) // Call------------
        console.log("data -> resData ", resData)


        // Set Mode --> Create.
        this.setMode("Create")

        // -------History Part---------
        let history = await this.getHistoryDataWorkFlow(data, commentData.CommentZ)
        if (!history) { return false }

        // -------Mail Part---------
        this.emailService.start(data, history)

        // -------End Part---------
        this.onRefresh()
        let sendTo = `Forwarded to: ${namesSendto}`;
        let messageOfSuccess = `Thank you! The Request Id:(${Number(data.Id)}) has been successfully submitted,\n${sendTo}.`
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

        this.setBusy(this.mainFormId, false)

      },

      formatSendToNames: function (sIds, sNames) {
        if (!sIds || !sNames) return "";

        // Split IDs and names by commas
        const idArray = sIds.split(", ");
        const nameArray = sNames.split(", ");

        // Ensure both arrays are the same length
        if (idArray.length !== nameArray.length) return "";

        // Combine names and IDs in the format "FirstName LastName (ID)"
        const combinedArray = nameArray.map((name, index) => {
          const firstNameLastName = name.split(" ").slice(0, 2).join(" ");  // Assuming names are formatted with first and last names
          return `${firstNameLastName} (${idArray[index]})`;
        });

        // Join the results with a separator (e.g., comma)
        return combinedArray.join(", ");
      },


      onRefresh: async function (oEvent) {
        console.log("Start Refreshiung")
        this.setBusy('listContinerId', true)
        this.reSetValues()
        this.getSplitContObj().toDetail(this.createId("empty"));
        await this.setInVlus()
        this.setBusy('listContinerId', false)
      },

      // ================================== # Work Flow Presses (Buttons) # ==================================
      onAssignees: function (ev) {
        this.objStatus = { status: "Assigned" }
        this.onMainSubmit()

      },

      onReSumbit: function (ev) {
        this.objStatus = { status: "Pending", isUpload: true }
        this.onMainSubmit()

      },

      onApproval: function (ev) {
        this.objStatus = { status: "Approved" }

        this.onMainSubmit()
      },

      onRejected: function (ev) {
        this.objStatus = { status: "Rejected" }

        this.onMainSubmit()
      },

      onRetrun: function (ev) {
        this.objStatus = { status: "Returned" }

        this.onMainSubmit()
      },

      onWorkInProgress: function (ev) {
        this.objStatus = { status: "WorkInProgress" }

        this.onMainSubmit()
      },

      onCompleted: function (ev) {
        this.objStatus = { status: "Completed" }

        this.onMainSubmit()
      },

      onClosedStatus: function (ev) {
        this.objStatus = { status: "Closed" }

        this.onMainSubmit()
      },

      onConvirme: function () {
        // MessageBox.confirm(`Are you sure you want to ${this.objStatus.status} the request?`, {
        //   actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        //   emphasizedAction: MessageBox.Action.OK,
        //   onClose: function (sAction) {
        //     if (sAction === "OK") {
        //       this.onMainSubmit();
        //     }
        //   }.bind(this)
        // });
      },


      // ================================== # Chaange Events Functions # ==================================
      onListItemPress: async function (oEvent) {
        this.setBusy('mainFormVboxId', true)
        // Start ------------------
        var oListItem = oEvent.getSource(); // This retrieves the ObjectListItem that triggered the event

        // Safeguard in case there's no custom data or it's undefined
        if (oListItem && oListItem.getCustomData().length > 0) {
          var sToPageId = oListItem.getCustomData()[0].getValue();
        } else {
          console.warn("No CustomData found or list item is undefined.");
        }

        let aTasks = this.getView().getModel(this.mainTableModel).getData() // The All Data!
        // console.log({ aTasks })

        let selectedTaskz = aTasks.find(task => task.Id === sToPageId); // The Selected -> Data! ...........The Data Need It...............
        console.log({ selectedTaskz })

        // Startxxx ------------------
        // Set Data TO Models
        this.helperModelInstance.setProperty('/pageTitle', "Requset Id: #" + this.removeLeadingZeros(selectedTaskz.Id)) // Set Title Of Page ON Selecting.

        this.getView().setModel(new JSONModel(selectedTaskz), this.mainFormModel);

        let status = selectedTaskz.Status;

        selectedTaskz.PublishingDate = this.formatRequestDate(selectedTaskz.PublishingDate);

        // Startxxx ---------Set Visibiles---------
        // console.log("this.getAdditionObj()", this.getAdditionObj())

        this.setVisbileOnSelected(selectedTaskz.MainService, status)

        //Fileds Commnets 
        this.setVisbileForForm2(this.getAdditionObj("c")[0], true, false, false);
        this.setVisbileForForm2(this.getAdditionObj("c")[1], true, true, true);
        this.setVisbileForForm2('MainService', true, false, false);

        if (selectedTaskz.Status == "Returned") {
          this.setVisbileForForm2('AttachmentInput', true, false, false);
          this.setVisbileForForm2('AdditionalAttachmentInput', true, false, false);
        } else {
          this.setVisbileForForm2('AttachmentInput', false, false, false);
          this.setVisbileForForm2('AdditionalAttachmentInput', false, false, false);
        }
        this.setVisbileForForm2('AttachmentButton', true, false, false);
        this.setVisbileForForm2('AdditionalAttachmentButton', true, false, false);



        //Buttons
        // Check if the status is "Approved" and get the next level only when needed
        let indexButtons = {
          "Pending": 2,
          "Returned": 1,
          "Approved": (await this.getSelectedMainServiceNextLvl(selectedTaskz)).length === 0 ? 3 : 2,
          "Assigned": 4,
          "WorkInProgress": 5,
          "Completed": 6
        }[status] || '';

        // Only perform the form update if indexButtons has a valid value
        if (indexButtons !== '') {
          this.setVisbileForForm2(this.getAdditionObj("b")[indexButtons], true, false, false);
          if (indexButtons == 3) {
            this.setVisbileForForm2(this.getAdditionObj("a"), true, true, true);
          }
        }


        // Set CommentZ Part  ------------------
        this.setComments(selectedTaskz)
        // console.log("MyTasks -> selectedTaskz: ", selectedTaskz)

        //Assginees Part ------------------
        // if (await this.isAssginees(selectedTaskz)) {
        //   this.helperModelInstance.setProperty("/isAssigneesWorkFlow", true)
        // }

        this.setBusy('mainFormVboxId', false)

        this.getSplitContObj().toDetail(this.createId("detailPage"));
      },

      // ================================== # Set Values on List Selected # ==================================
      isAssginees: async function (selectedTaskz) {
        let approvalNextLvlData = await this.getSelectedMainServiceNextLvl(selectedTaskz)

        if ((selectedTaskz.Status == "Assigned")) {
          this.helperModelInstance.setProperty("/isClosedWorkFlow", true)
        }

        return ((approvalNextLvlData.length == 0) && ((selectedTaskz.Steps + 1) > 2) && (selectedTaskz.Status != "Assigned"))
      },

      // setComments: function (selectedTaskz) {
      //   let historyDataSelected = this.historyData?.results.filter(function (item) {
      //     return item.RequestId === selectedTaskz.Id;
      //   });

      //   let showMessageComment = "" // Foor loop to all Request history and set all Comments.
      //   for (let i = historyDataSelected.length - 1; i >= 0; i--) {
      //     const element = historyDataSelected[i];
      //     const separator = "\n---------\n";
      //     showMessageComment = showMessageComment + `${element.ProcessedBy}(${element.ProcessedId}): ${element.CommentZ}\nRequest: ${this.formatDateToCustomPattern(element.CreatedDate)}${separator}`;
      //   }
      //   this.getView().getModel(this.CommentModel)?.setProperty('/PreviseComment', `${showMessageComment}`)
      // },

      // ================================== # Uploade Files Functions # ==================================
      onTaskNameChange: function (oEvent) {
        // console.log(oEvent)
        // var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
        // this.setVisbileForForm(sSelectedKey)
        // this.reSetValues()
      },

      onDateTimeChange: function (ev) {
        var oDateTimePicker = ev.getSource();
        this.dateTime = oDateTimePicker
        var sValue = oDateTimePicker.getValue();
        this.getView().getModel(this.IGNModel).setProperty('/PublishingDate', sValue)
      },
      // ================================== # Get Functions # ==================================

      // ================================== # Validations # ==================================

      // ================================== # Helper Functions # ==================================

      // ================================== # XXXX Functions # ==================================
      getSplitContObj: function () {
        var result = this.byId("SplitContDemo");
        if (!result) {
          Log.error("SplitApp object can't be found");
        }
        return result;
      },

      // ================================== # Uploade Files Functions # ==================================
      onFileChange: function (oEvent) {
        this.uploadeFile.listObjFiles.push({ oEvent: oEvent, key: 'Attachment' });

      },

      onFileChange2: function (oEvent) {
        this.uploadeFile.listObjFiles.push({ oEvent: oEvent, key: 'AdditionalAttachment' });
      },

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

      // ================================== # Dont Use it in Proeduction!!! Delete All Data from oData!!! Dengers # ==================================
      deleteAllIn: async function () {
        // let endsPoints = ["NewRequestSet", "RequestHistorySet", "UploadFileSet", "SettingsApprovalsSet", "SettingsAssigneesSet"];
        let endsPoints = ["NewRequestSet", "RequestHistorySet", "UploadFileSet"];
        console.log("start Deleting...")
        for (let element of endsPoints) {
          let data = await this.crud_z.get_record(element);
          data = data.results;

          for (let elementIn of data) {
            try {
              await this.crud_z.delete_record(element, elementIn.Id);
              console.log("Deleted: ", element, elementIn.Id)
            } catch (error) {
              console.error(`Failed to delete record with ID: ${elementIn.Id}`, error);
            }
          }
        }
        console.log("Finshed Deleting...")
        return true
      },


      // ================================== # Uploade Files Functions # ==================================


    });
  }
);
