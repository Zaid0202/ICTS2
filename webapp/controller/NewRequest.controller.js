
sap.ui.define(
  [
    "internal/controller/Helper/BaseController",
    "internal/controller/Helper/UploadeFile",
    "internal/controller/Helper/EmailService",

  ],
  function (BaseController, UploadeFile, EmailService) {
    "use strict";

    return BaseController.extend("internal.controller.NewRequest", {
      onInit: async function () {
        await BaseController.prototype.onInit.apply(this, []);

        this.emailService = new EmailService(this)

        this.uploadeFile = new UploadeFile(this)

        this.pageName = 'NewRequest'
        this.mainEndPoint = this.endsPoints['NewRequest']

        this.mainFormId = 'mainFormId'

        this.IGNModel = 'IGNModel'
        this.IGNErrModel = 'IGNErrModel'

        this.RevisionRequestModel = 'RevisionRequestModel'
        this.RevisionRequestErrModel = 'RevisionRequestErrModel'


        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getObjIGN()), this.IGNModel);
        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getObjRevisionRequest()), this.RevisionRequestModel);

        this.helperModelInstance.setProperty('/IsIGN', false)
        this.helperModelInstance.setProperty('/IsRevisionRequest', false)
        this.helperModelInstance.setProperty('/MainServices', '')

        // console.log(this.uploadeFile.callUploadFiles(data, this.listObjFiles))
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
        let userInfo = {}

        const userInfo1 = {
          RequestId: '', // Renamed from request_id
          RequestDate: new Date().toISOString(), // Renamed from request_date
          RequesterId: userInfo.empId, // Renamed from requester_id
          RequesterName: userInfo.displayName, // Renamed from requester_name
          RequesterPosition: userInfo.jobCode, // Renamed from requester_position
          RequesterSection: userInfo.department, // Renamed from requester_section
          RequesterDept: userInfo.division, // Renamed from requester_dept
          RequesterLocation: userInfo.city, // Renamed from requester_location
          Status: "Pending", // Renamed from status
          StatusDisplay: "forwarded to " + userInfo?.manager?.displayName, // Renamed from status_display
          Steps: 1, // Renamed from steps
          Sendto: userInfo?.manager?.userId, // Renamed from Sendto
          AssignedDate: new Date().toISOString(), // Renamed from assigned_date
          LastActionBy: 10125, // Renamed from last_action_by
          LastActionDate: new Date().toISOString(), // Renamed from last_action_date
          Action: 'Closed By' // Renamed from action
        };

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

      onMainSubmit: async function () {
        let MainService = this.helperModelInstance.getProperty('/MainServices');
        let IsIGN = this.helperModelInstance.getProperty('/IsIGN');
        let IsIIsRevisionRequestGN = this.helperModelInstance.getProperty('/IsRevisionRequest');

        let data;

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
          sap.m.MessageToast.show("Please choose the main service(s)!");
          return false
        }

        this.setBusy(this.mainFormId, true)

        // ---------Set Static Values-------
        data.MainService = MainService
        data.RequestDate = new Date()

        // -------New Request Part---------
        const requestDataWORKFLOW = {
          RequesteData: {
            status: "Pending", // This will be one of: Pending, Approved, Rejected, Returned, Closed
            sendToName: '',
            sendTo: '',
            step: 1
          }
        };

        let userInfoWithRequestTamp = await this.getOwnerComponent().userService.getUserInfoWithRequestTamp(requestDataWORKFLOW)
        let finallData = this.oPayload_modify({ ...data, ...userInfoWithRequestTamp })
        // console.log({ userInfoWithRequestTamp })
        // console.log({ finallData })
        // this.setBusy(this.mainFormId, false)

        // return 1
        if (IsIIsRevisionRequestGN) { finallData = await this.uploadeFile.callUploadFiles(finallData) } //------- callUploadFiles Part--------- Call Uploade Files Function and add File Id on finallData
        let res = await this.crud_z.post_record(this.mainEndPoint, finallData)

        // -------History Part---------
        let processedByMeObj = {
          "RequestId": res.Id,
          "SendtoName": this.extractNameFromStatusDisplay(finallData.StatusDisplay),
          "Status": finallData.Status,
        }

        let historyObj = this.getOwnerComponent().userService.getRequestHistoryObj(processedByMeObj)

        historyObj = this.oPayload_modify_parent(historyObj)

        // console.log("history: ", historyObj)

        let resProcessedByMe = await this.crud_z.post_record(this.endsPoints['ProcessedByMe'], historyObj)
        // console.log({ resProcessedByMe })

        console.log({ finallData })
        console.log({ historyObj })

        // -------Mail Part---------
        this.emailService.start(finallData, historyObj)



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

      reSetValues: function () {
        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getObjRevisionRequest()), this.RevisionRequestModel);
        this.getView().setModel(new sap.ui.model.json.JSONModel(this.getObjIGN()), this.IGNModel);

        let setvalueStateValues1 = this.validation_z.reSetValuesState(Object.keys(this.getObjIGN()), {})
        this.getView().setModel(new sap.ui.model.json.JSONModel(setvalueStateValues1), this.IGNErrModel);

        let setvalueStateValues2 = this.validation_z.reSetValuesState(Object.keys(this.getObjRevisionRequest()), {})
        this.getView().setModel(new sap.ui.model.json.JSONModel(setvalueStateValues2), this.RevisionRequestErrModel);

        this.dateTime?.setValue('')
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

      startValidationRevisionRequest: function (oPayload) {
        let fieldsName = Object.keys(this.getObjRevisionRequest());
        let requiredList = ['MainService', "Description", "Attachment"];

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

      // ----------------------------Uplaode Files Start-------------------------------
      onFileChange: function (oEvent) {
        this.uploadeFile.listObjFiles.push({ oEvent: oEvent, key: 'Attachment' });
        // Now you can use the fileId for further processing
        const oModel = this.getView().getModel(this.RevisionRequestModel);
        oModel.setProperty("/Attachment", '0000000000');

      },

      onFileChange2: function (oEvent) {
        this.uploadeFile.listObjFiles.push({ oEvent: oEvent, key: 'AdditionalAttachment' });
      },

      // ----------

    });
  }
);
