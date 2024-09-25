sap.ui.define(
  [
    "internal/controller/Helper/BaseController",
    "sap/ui/Device",
    "sap/ui/model/json/JSONModel",
    "internal/controller/Helper/UploadeFile",
    "sap/m/MessageBox"

  ],
  function (BaseController, Device, JSONModel, UploadeFile, MessageBox) {
    "use strict";

    return BaseController.extend("internal.controller.MyTasks", {
      onInit: async function () {
        await BaseController.prototype.onInit.apply(this, []);

        this.uploadeFile = new UploadeFile(this)

        this.mainEndPoint = this.endsPoints['NewRequest']

        this.pageName = 'MyTasks'
        this.mainFromModel = 'mainFormModel'
        this.mainFormErrModel = "mainFormErrModel"
        this.mainTableId = 'mainTableId'
        this.mainFormId = 'mainFormId'

        this.mainTableModel = 'mainTableModel'

        this.IGNModel = 'IGNModel'
        this.IGNErrModel = 'IGNErrModel'

        this.CommentModel = 'CommentModel'
        this.CommentErrModel = 'CommentErrModel'


        this.RevisionRequestModel = 'RevisionRequestModel'
        this.RevisionRequestErrModel = 'RevisionRequestErrModel'

        var oDeviceModel = new JSONModel(Device);
        oDeviceModel.setDefaultBindingMode("OneWay");
        this.getView().setModel(oDeviceModel, "device");

        this.onRefresh()
        // this.deleteAllIn()  
        // ------------------------------------

      },

      setInVlus: async function () {
        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getObjIGN()), this.IGNModel);
        this.getView().setModel(new sap.ui.model.json.JSONModel(await this.getMainTableData()), this.mainTableModel)// Set

        this.getView().setModel(new sap.ui.model.json.JSONModel({ CommentZ: '', PreviseComment: '' }), this.CommentModel);

        this.helperModelInstance.setProperty('/IsIGN', false)
        this.helperModelInstance.setProperty('/IsRevisionRequest', false)
        this.helperModelInstance.setProperty('/MainServices', '')

        this.historyData = await this.getHistoryData()

        await this.setSettingsAssigneesData()
        this.helperModelInstance.setProperty("/isAssigneesWorkFlow", false)
        this.helperModelInstance.setProperty("/isClosedWorkFlow", false)


      },

      // onAfterRendering: function () {
      //   var oSplitCont = this.getSplitContObj(),
      //     ref = oSplitCont.getDomRef() && oSplitCont.getDomRef().parentNode;
      //   // set all parent elements to 100% height, this should be done by app developer, but just in case
      //   if (ref && !ref._sapUI5HeightFixed) {
      //     ref._sapUI5HeightFixed = true;
      //     while (ref && ref !== document.documentElement) {
      //       var $ref = jQuery(ref);
      //       if ($ref.attr("data-sap-ui-root-content")) { // Shell as parent does this already
      //         break;
      //       }
      //       if (!ref.style.height) {
      //         ref.style.height = "100%";
      //       }
      //       ref = ref.parentNode;
      //     }
      //   }
      // },
      // ================================== # On Functions # ==================================

      onClosed: async function (ev) {
        let obj = { status: "Closed" }
        this.onConvirme(obj)

      },

      onAssignees: async function (ev) {
        let obj = { status: "Assigned" }
        this.onConvirme(obj)

      },

      onReSumbit: async function (ev) {
        let obj = { status: "Pending" }
        this.onConvirme(obj)

      },

      onApproval: async function (ev) {
        let obj = { status: "Approved" }

        this.onConvirme(obj)
      },

      onRejected: async function (ev) {
        let obj = { status: "Rejected" }

        this.onConvirme(obj)
      },

      onRetrun: async function (ev) {
        let obj = { status: "Returned" }

        this.onConvirme(obj)
      },

      onConvirme: function (obj) {
        MessageBox.confirm(`Are you sure you want to ${obj.status} the request?`, {
          actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.OK,
          onClose: function (sAction) {
            if (sAction === "OK") {
              this.onMainSubmit(obj);
            }
          }.bind(this)
        });
      },

      onMainSubmit: async function (obj) {
        this.setMode("Edit")

        let MainService = this.helperModelInstance.getProperty('/MainServices');
        let IsIGN = this.helperModelInstance.getProperty('/IsIGN');
        let IsIIsRevisionRequestGN = this.helperModelInstance.getProperty('/IsRevisionRequest');

        let data;

        // ----------------
        let commentData = this.getView().getModel(this.CommentModel).getData();

        let isErr = this.startValidationComment(commentData)
        if (isErr) {
          return false
        }

        // ----------------
        if (IsIGN) {
          data = this.getView().getModel(this.IGNModel).getData();
          data.MainService = MainService;

          let isErr = this.startValidationIGN(data)
          if (isErr) {
            return false
          }
          data = this.oPayload_modify_IGN(data)
          data = { ...data, ...this.getObjRevisionRequest() }

        }

        // ----------------
        if (IsIIsRevisionRequestGN) {
          data = this.getView().getModel(this.RevisionRequestModel).getData();
          data.MainService = MainService;

          let isErr = this.startValidationRevisionRequest(data)
          if (isErr) {
            return false
          }

          data = this.oPayload_modify_RevisionRequest(data)
          data = { ...data, ...this.getObjIGN() }
          data.PublishingDate = new Date()
        }

        if (!IsIGN && !IsIIsRevisionRequestGN) {
          sap.m.MessageToast.error("Please Select the Main Services!");
          return false
        }



        // ----------------
        data.MainService = MainService

        let approvalNextLvlData = {}
        let employeeIds = {}
        let employeeNames = {}

        if (obj.status === 'Approved') {
          approvalNextLvlData = await this.getSelectedMainServiceLvl(data)

          if ((approvalNextLvlData.length == 0) && ((data.Steps + 1) <= 2)) { // Sheck if lvl 2 is not Exist! return false
            this.setBusy(this.mainFormId, false);
            sap.m.MessageToast.show("This Main Service Dose not Have Approvel Level! (" + (data.Steps + 1) + ")");
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

        }

        if (obj.status === 'Assigned') {
          approvalNextLvlData = await this.getSelectedMainServiceLvl(data)

          if ((approvalNextLvlData.length == 0) && ((data.Steps + 1) > 2)) { // Assigne Part
            let AssigneesData = this.getView().getModel("SettingsAssigneesFormModel").getData();

            let isErrAssingees = this.startValidationAssingees(AssigneesData)
            if (isErrAssingees) {
              return false
            }

            let assigneesTableModel = this.getView().getModel("SettingsAssigneesTableModel").getData()

            employeeIds = AssigneesData.SendTo
            employeeNames = assigneesTableModel.filter(elm => elm.EmployeeId == AssigneesData.SendTo)[0].EmployeeName
          }
        }

        this.setBusy(this.mainFormId, true)

        // -------New Request Part---------
        const requestDataWORKFLOW = {
          status: obj.status, // This will be one of: Pending, Approved, Rejecteded, Returned, Closed

          sendToName: obj.status === "Returned" ? data.RequesterName :
            (obj.status === "Approved" || obj.status === "Assigned") ? employeeNames : "",

          sendTo: obj.status === "Returned" ? data.RequesterId :
            (obj.status === "Approved" || obj.status === "Assigned") ? employeeIds : "",

          step: data.Steps
          // step: obj.status === "Approved" ? data.Steps : ''
        };

        console.log("requestDataWORKFLOW", this.getOwnerComponent().userService.getRequesteData(requestDataWORKFLOW))
        let finallData = this.oPayload_modify({ ...data, ...this.getOwnerComponent().userService.getRequesteData(requestDataWORKFLOW) })
        console.log("finallData", finallData)
        // return 1
        if (IsIIsRevisionRequestGN) { finallData = await this.uploadeFile.callUploadFiles(finallData) } //------- callUploadFiles Part--------- Call Uploade Files Function and add File Id on finallData

        let res = await this.crud_z.update_record(this.mainEndPoint, finallData, finallData.Id) // Call------------
        console.log("finallData -> res ", res)

        // -------History Part---------
        // let historyDataSelected = this.historyData.results.filter(function (item) {
        //   return item.RequestId === finallData.Id;
        // })[0];

        // console.log({ historyDataSelected })

        this.setMode("Create") // Set Mode --> Create.
        let SendtoName = obj.status === "Returned" ? data.RequesterName : obj.status === "Approved" ? employeeNames : obj.status !== "Rejected" ? this.extractNameFromStatusDisplay(finallData.StatusDisplay) : ''
        // let CommentZ = `#${this.userInfo.displayName}(${this.userId})#\n${commentData.CommentZ}\n${commentData.PreviseComment}`
        let CommentZ = commentData.CommentZ

        let processedByMeObj = {
          "RequestId": finallData.Id,
          "SendtoName": SendtoName,
          "Status": obj.status,
          "CommentZ": CommentZ,
        }

        let historyObj = this.getOwnerComponent().userService.getRequestHistoryObj(processedByMeObj)

        if (historyObj.CommentZ.length > 200) {
          historyObj.CommentZ = historyObj.CommentZ.slice(0, 200);
        }

        let resProcessedByMe = await this.crud_z.post_record(this.endsPoints['ProcessedByMe'], this.oPayload_modify_parent(historyObj))  // Call------------

        // -------End Part---------


        this.onRefresh()

        this.setBusy(this.mainFormId, false)
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

      onTaskNameChange: function (oEvent) {
        var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
        this.setVisbileForForm(sSelectedKey)
        this.reSetValues()
      },

      onRefresh: async function (oEvent) {
        console.log("Start Refreshiung")
        this.setBusy('listContinerId', true)
        this.reSetValues()
        this.getSplitContObj().toDetail(this.createId("empty"));
        await this.setInVlus()
        this.setBusy('listContinerId', false)
      },

      setSettingsAssigneesData: async function () {
        let data = await this.crud_z.get_record(this.endsPoints['SettingsAssignees'])
        this.getView().setModel(new sap.ui.model.json.JSONModel(data.results), 'SettingsAssigneesTableModel');
        this.getView().setModel(new sap.ui.model.json.JSONModel({ "SendTo": '' }), 'SettingsAssigneesFormModel');
      },

      // ================================== # Get Functions # ==================================
      getNextLvlApproval: async function (filter) {
        let data = await this.crud_z.get_record(this.mainEndPoint, '', filter)
        return data.results
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
          // "Subject": "",
        }
      },

      getMainTableData: async function () {
        // let filter = { "name": "Sendto", "value": this.userInfo.empId }
        // let data = await this.crud_z.get_record(this.endsPoints['NewRequest'], '', filter)
        let data = await this.crud_z.get_record(this.endsPoints['NewRequest'])
        var filteredRecords = data?.results?.filter(function (record) {
          return record.Sendto.split(', ').includes(this.userInfo.empId);
        }.bind(this));

        console.log(data.results)
        console.log(filteredRecords)
        return filteredRecords
      },

      getHistoryData: async function (requestId) {
        let filter = { "name": "ProcessedId", "value": requestId }
        let data = await this.crud_z.get_record(this.endsPoints['ProcessedByMe'], '', {})
        return data
      },

      getObjRevisionRequest: function () {
        // let userInfo = {}

        // const userInfo1 = {
        //   RequestId: '', // Renamed from request_id
        //   RequestDate: new Date().toISOString(), // Renamed from request_date
        //   RequesterId: userInfo.empId, // Renamed from requester_id
        //   RequesterName: userInfo.displayName, // Renamed from requester_name
        //   RequesterPosition: userInfo.jobCode, // Renamed from requester_position
        //   RequesterSection: userInfo.department, // Renamed from requester_section
        //   RequesterDept: userInfo.division, // Renamed from requester_dept
        //   RequesterLocation: userInfo.city, // Renamed from requester_location
        //   Status: "Pending", // Renamed from status
        //   StatusDisplay: "forwarded to " + userInfo?.manager?.displayName, // Renamed from status_display
        //   Steps: 1, // Renamed from steps
        //   Sendto: userInfo?.manager?.userId, // Renamed from Sendto
        //   AssignedDate: new Date().toISOString(), // Renamed from assigned_date
        //   LastActionBy: 10125, // Renamed from last_action_by
        //   LastActionDate: new Date().toISOString(), // Renamed from last_action_date
        //   Action: 'Closed By' // Renamed from action
        // };

        // "Id" : "0000000005",
        // "MainService" : "ZUPDATED_DATE",
        // "Urgency" : "ZUPDATED_DATE",
        // "CommunicationType" : "ZUPDATED_DATE",
        // "PublishingDate" : "\/Date(1723507200000)\/",
        // "Brief" : "ZUPDATED_DATE",
        // "DesignBriefAndDescription" : "ZUPDATED_DATE",
        // "ReportingDepartment" : "ZUPDATED_DATE",
        // "Subject" : "ZUPDATED_DATE",
        // "Description" : "ZUPDATED_DATE",
        // "Attachment" : "ZUPDATED_DATE",
        // "AdditionalLink" : "ZUPDATED_DATE",
        // "AdditionalAttachment" : "ZUPDATED_DATE",
        // "RequestDate" : "\/Date(1723507200000)\/",
        // "RequesterId" : 12344,
        // "RequesterName" : "ZUPDATED_DATE",
        // "RequesterPosition" : "ZUPDATED_DATE",
        // "RequesterSection" : "ZUPDATED_DATE",
        // "RequesterDept" : "ZUPDATED_DATE",
        // "RequesterLocation" : "ZUPDATED_DATE",
        // "Status" : "ZUPDATED_DATE",
        // "StatusDisplay" : "ZUPDATED_DATE",
        // "Steps" : 1,
        // "Sendto" : 12345,
        // "AssignedDate" : "\/Date(1724284800000)\/",
        // "LastActionBy" : "ZUPDATED_DATE",
        // "LastActionDate" : "\/Date(1723593600000)\/",
        // "CreatedDate" : "\/Date(1723593600000)\/",
        // "UpdatedDate" : "\/Date(1723593600000)\/"

        return {
          "MainService": "",
          "Description": "",
          "Attachment": "",
          "AdditionalLink": "",
          "AdditionalAttachment": "",
        }
      },

      getSelectedMainServiceLvl: async function (data) {
        let filterMainServiceName = { "name": 'MainServiceName', "value": data.MainService }
        let dataMainServiceName = await this.crud_z.get_record(this.endsPoints['SettingsApprovals'], '', filterMainServiceName)

        return dataMainServiceName.results.filter(function (item) {
          return item.ApprovalLevels === (data.Steps + 1);
        });
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

        let setvalueStateValues1 = this.validation_z.reSetValuesState(Object.keys(this.getObjIGN()), {})
        this.getView().setModel(new sap.ui.model.json.JSONModel(setvalueStateValues1), this.IGNErrModel);

        let setvalueStateValues2 = this.validation_z.reSetValuesState(Object.keys(this.getObjRevisionRequest()), {})
        this.getView().setModel(new sap.ui.model.json.JSONModel(setvalueStateValues2), this.RevisionRequestErrModel);

        this.dateTime?.setValue('')

      },

      startValidationIGN: function (oPayload) {
        let fieldsName = Object.keys(this.getObjIGN());
        let requiredList = fieldsName.filter(field => field);

        const rulesArrName = [
          { arr: requiredList, name: 'required' },
        ];

        let { isErr, setvalueStateValues } = this.validation_z.startValidation(fieldsName, rulesArrName, oPayload)
        console.log(setvalueStateValues)
        this.getView().setModel(new sap.ui.model.json.JSONModel(setvalueStateValues), this.IGNErrModel);
        return isErr
      },

      startValidationComment: function (oPayload) {
        let fieldsName = Object.keys({ CommentZ: '' });
        let requiredList = fieldsName.filter(field => field);

        const rulesArrName = [
          { arr: requiredList, name: 'required' },
        ];

        let { isErr, setvalueStateValues } = this.validation_z.startValidation(fieldsName, rulesArrName, oPayload)
        console.log(setvalueStateValues)
        this.getView().setModel(new sap.ui.model.json.JSONModel(setvalueStateValues), this.CommentErrModel);
        return isErr
      },

      startValidationAssingees: function (oPayload) {
        let fieldsName = Object.keys({ SendTo: '' });
        let requiredList = fieldsName.filter(field => field);

        const rulesArrName = [
          { arr: requiredList, name: 'required' },
        ];

        let { isErr, setvalueStateValues } = this.validation_z.startValidation(fieldsName, rulesArrName, oPayload)
        console.log(setvalueStateValues)
        this.getView().setModel(new sap.ui.model.json.JSONModel(setvalueStateValues), "SettingsAssigneesFormErrModel");
        return isErr
      },

      startValidationRevisionRequest: function (oPayload) {
        let fieldsName = Object.keys(this.getObjRevisionRequest());
        let requiredList = ['MainService', "Description"];

        const rulesArrName = [
          { arr: requiredList, name: 'required' },
        ];

        let { isErr, setvalueStateValues } = this.validation_z.startValidation(fieldsName, rulesArrName, oPayload)
        console.log(setvalueStateValues)
        this.getView().setModel(new sap.ui.model.json.JSONModel(setvalueStateValues), this.RevisionRequestErrModel);
        return isErr
      },

      oPayload_modify: function (oPayload) {
        oPayload = this.convertDateStringsToDateObjects(oPayload)
        oPayload.Steps = Number(oPayload.Steps)
        oPayload.LastActionBy = oPayload.LastActionBy
        return oPayload
      },

      oPayload_modify_IGN: function (oPayload) {
        oPayload = this.oPayload_modify_parent(oPayload)
        return oPayload
      },

      oPayload_modify_RevisionRequest: function (oPayload) {
        oPayload = this.oPayload_modify_parent(oPayload)
        return oPayload
      },

      onDateTimeChange: function (ev) {
        var oDateTimePicker = ev.getSource();
        this.dateTime = oDateTimePicker
        var sValue = oDateTimePicker.getValue();
        this.getView().getModel(this.IGNModel).setProperty('/PublishingDate', sValue)
      },

      // ================================== # XXXX Functions # ==================================
      onListItemPress: async function (oEvent) {
        // Ensure you get the selected list item properly
        var oListItem = oEvent.getSource(); // This retrieves the ObjectListItem that triggered the event

        // Safeguard in case there's no custom data or it's undefined
        if (oListItem && oListItem.getCustomData().length > 0) {
          var sToPageId = oListItem.getCustomData()[0].getValue();
        } else {
          console.warn("No CustomData found or list item is undefined.");
        }

        let aTasks = this.getView().getModel(this.mainTableModel).getData() // The All Data!
        console.log({ aTasks })

        let selectedTaskz = aTasks.find(task => task.Id === sToPageId); // The Selected -> Data!

        // Set Data TO Models
        var oSelectedTask = new JSONModel(selectedTaskz);
        this.getView().setModel(oSelectedTask, this.IGNModel);
        this.getView().setModel(oSelectedTask, this.RevisionRequestModel);

        // Set MainServices To Models
        this.helperModelInstance.setProperty('/MainServices', selectedTaskz.MainService)
        this.setVisbileForForm(selectedTaskz.MainService)

        // Set Buttons is Visble and Title of Page
        this.helperModelInstance.setProperty('/isEditModeWorkFlow', selectedTaskz.Status === "Returned" ? true : false)
        this.helperModelInstance.setProperty('/pageTitle', "Requset Id: #" + this.removeLeadingZeros(selectedTaskz.Id))

        // Set CommentZ 
        let historyDataSelected = this.historyData?.results.filter(function (item) {
          return item.RequestId === selectedTaskz.Id;
        });

        let showMessageComment = "" // Foor loop to all Request history and set all Comments.
        for (let i = historyDataSelected.length - 1; i >= 0; i--) {
          const element = historyDataSelected[i];
          const separator = "\n---------\n";
          const centeredSeparator = `\n             ---------             \n`; // Add spaces to center manually

          showMessageComment = showMessageComment + `${element.ProcessedBy}(${element.ProcessedId}): ${element.CommentZ}\nRequest: ${this.formatDateToCustomPattern(element.CreatedDate)}${separator}`;
        }

        console.log("1historyDataSelected: ", historyDataSelected)
        console.log("showMessageComment: ", showMessageComment)
        // if (historyDataSelected?.length > 0) {
        //   historyDataSelected = historyDataSelected[historyDataSelected.length - 1];
        //   console.log("historyDataSelected.CommentZ.length: ", historyDataSelected.CommentZ.length)

        // }

        this.getView().getModel(this.CommentModel).setProperty('/PreviseComment', `${showMessageComment}`)
        // this.getView().getModel(this.CommentModel).setProperty('/CommentZ', `\n\n${historyDataSelected.CommentZ}`)
        console.log(this.getView().getModel(this.CommentModel).getData())

        const oDateTimePicker = this.byId("PublishingDateID");
        if (oDateTimePicker) {
          oDateTimePicker.setValue(selectedTaskz.PublishingDate); // Example value
        }

        //Assginees Part...
        let approvalNextLvlData = await this.getSelectedMainServiceLvl(selectedTaskz)
        if ((approvalNextLvlData.length == 0) && ((selectedTaskz.Steps + 1) > 2) && (selectedTaskz.Status != "Assigned")) {
          let data = this.getView().getModel("SettingsAssigneesTableModel").getData()
          // Assginee 
          this.helperModelInstance.setProperty("/isAssigneesWorkFlow", true)
        }

        if ((selectedTaskz.Status == "Assigned")) {
          this.helperModelInstance.setProperty("/isClosedWorkFlow", true)

        }

        this.getSplitContObj().toDetail(this.createId("detailPage"));
      },

      getSplitContObj: function () {
        var result = this.byId("SplitContDemo");
        if (!result) {
          Log.error("SplitApp object can't be found");
        }
        return result;
      },

      statusState: function (sStatus) {
        // You can set the state of the ObjectStatus based on the status value
        switch (sStatus) {
          case "Pending":
            return 'Information';
          case "Rejecteded":
            return 'Error';
          case "Approved":
            return 'Success';
          default:
            return 'None';
        }
      },

      deleteAllIn: async function () {
        let endsPoints = ["NewRequestSet", "RequestHistorySet", "UploadFileSet"];
        console.log("start Deleting...")
        for (let element of endsPoints) {
          let data = await this.crud_z.get_record(element);
          data = data.results;

          for (let elementIn of data) {
            try {
              await this.crud_z.delete_record(element, elementIn.Id);
            } catch (error) {
              console.error(`Failed to delete record with ID: ${elementIn.Id}`, error);
            }
          }
        }
        console.log("Finshed Deleting...")

      },

      // Inside your controller
      removeLeadingZeros: function (sId) {
        if (sId) {
          // Convert the string to a number to remove leading zeros
          return Number(sId) || 0; // Return 0 if conversion fails
        }
        return 0; // Default return value if sId is falsy
      },

      // Inside your controller
      formatRequesterName: function (sRequesterName, sRequesterId) {
        // If RequesterId is undefined, assign it an empty string
        sRequesterId = sRequesterId || '';

        if (sRequesterName) {
          // Split the full name into parts
          const nameParts = sRequesterName.split(" ");
          let formattedName = "";

          // Get the first name
          formattedName += nameParts[0];

          // Check if there's a last name
          if (nameParts.length > 1) {
            // Get the last name
            formattedName += " " + nameParts[nameParts.length - 1];
          }

          // Add the ID in parentheses
          return `${formattedName} (${sRequesterId})`;
        }

        return `(${sRequesterId})`; // If no name is provided, just return the ID
      },

      // formatRequestDate: function (oDate) {
      //   if (!oDate) return '';

      //   // Create a date object from the input
      //   const date = new Date(oDate);

      //   // Options for formatting
      //   const options = { month: 'short', day: '2-digit', year: 'numeric' };

      //   // Get the formatted date as a string
      //   const formattedDate = date.toLocaleDateString('en-US', options);

      //   // Convert the formatted date to the desired format (MMM/DD/YYYY)
      //   const [month, day, year] = formattedDate.split(' ');
      //   return `${month}/${day.replace(',', '')}/${year}`; // Remove comma from day if exists
      // },

      formatRequestDate: function (oDate) {
        if (!oDate) return '';

        // Create a date object from the input
        const date = new Date(oDate);

        // Get month, day, and year
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-based, pad with zero
        const day = String(date.getDate()).padStart(2, '0'); // Pad day with zero
        const year = date.getFullYear();

        // Return formatted date
        return `${month}/${day}/${year}`;
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

      // ================================== # Uploade Files Functions # ==================================
      onFileChange: function (oEvent) {
        this.uploadeFile.listObjFiles.push({ oEvent: oEvent, key: 'Attachment' });
        // Now you can use the fileId for further processing
        const oModel = this.getView().getModel(this.RevisionRequestModel);
        oModel.setProperty("/Attachment", '0000000000');

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

      formatVisibilityReturnRejectAbrov: function (isEditModeWorkFlow, isAssigneesWorkFlow, isClosedWorkFlow) {
        return !(isEditModeWorkFlow || isAssigneesWorkFlow || isClosedWorkFlow)
      },

    });
  }
);
