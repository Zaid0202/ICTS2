sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "internal/controller/Helper/UploadeFile",
    "internal/controller/Helper/EmailService",
    "sap/m/MessageToast",

], function (
    Controller,
    UploadeFile,
    EmailService,
    MessageToast
) {
    "use strict";

    return Controller.extend("internal.controller.Helper.SharingRequestFunctions", {
        constructor: function (currentController) {
            this._currentController = currentController
            this.viewName = this._currentController.getView().getViewName();
            this.getViewIsName()
        },

        onInit: function () {
            console.log('Initializing SharingRequestFunctions...');

            // console.log("Before merging: ", this);
            // console.log("Current controller: ", this._currentController);

            // Merge instance methods from `this._currentController` (MyTask instance)
            // Object.assign(this, this._currentController);

            // Merge prototype methods from _currentController into SharingRequestFunctions' prototype
            // Object.assign(Object.getPrototypeOf(this), Object.getPrototypeOf(this._currentController));
            // Object.assign(Object.getPrototypeOf(this), Object.getPrototypeOf(Object.getPrototypeOf(this._currentController)));

            // console.log("After merging: ", this);

            // ------------------------------------ Call Classs ------------------------------------
            this.uploadeFile = new UploadeFile(this._currentController)
            this.emailService = new EmailService(this._currentController)

            // ------------------------------------ Constents ------------------------------------
            this.mainEndPoint = this._currentController.endsPoints['NewRequest']
            this.mainFormId = 'mainFormId'
            this.mainFormModel = 'mainFormModel'
            this.mainFormErrModel = "mainFormErrModel"

            this.mainTableId = 'mainTableId'
            this.mainTableModel = 'mainTableModel'

            this.CommentModel = 'CommentModel'
            this.previseCommentCommentModel = 'previseCommentCommentModel'
            this.CommentErrModel = 'CommentErrModel'
            this._currentController.getView()
            return this
        },




        // ================================== # Init Functiolns XX # ==================================
        setInVlus: async function () {
            // By Default
            this._currentController.getView().setModel(new sap.ui.model.json.JSONModel(this.getMainObj()), this.mainFormModel);

            let mainTableData = await this.getMainTableData()
            this._currentController.getView().setModel(new sap.ui.model.json.JSONModel(mainTableData), this.mainTableModel)// Set

            // XXXX
            this.historyData = await this.getHistoryData()
            await this.setSettingsAssigneesData()
            this._currentController.getView().setModel(new sap.ui.model.json.JSONModel({ CommentZ: '', PreviseComment: '' }), this.CommentModel);
        },

        getViewIsName: function () {
            this.isMyTasks = this.viewName == "internal.view.MyTasks"
            this.isNewRequest = this.viewName == "internal.view.NewRequest"
            this.isRequestStatusForm = this.viewName == "internal.view.RequestStatusForm"
            this._currentController.getView().setModel(new sap.ui.model.json.JSONModel({ isMyTasks: this.isMyTasks, isNewRequest: this.isNewRequest, isRequestStatusForm: this.isRequestStatusForm }), 'isPageNameModel');
        },


        reSetValues: function () {
            this._currentController.getView().setModel(new sap.ui.model.json.JSONModel(this.getMainObj()), this.mainFormModel);

            let setvalueStateValues = this._currentController.validation_z.reSetValuesState(Object.keys(this.getMainObj()), {})
            this._currentController.getView().setModel(new sap.ui.model.json.JSONModel(setvalueStateValues), this.mainFormErrModel);

            this._currentController.dateTime?.setValue('')
        },

        getMainObj: function (selec = "") {
            let form1 = {
                "MainService": "",
                "Urgency": "",
                "CommunicationType": "",
                "PublishingDate": "",
                "Brief": "",
                "DesignBriefAndDescription": "",
                "ReportingDepartment": "",
                "Subject": "",
                "Attachment": "",
            }

            let form2 = {
                "MainService": "",
                "Description": "",
                "Attachment": "",
                "AdditionalLink": "",
                "AdditionalAttachment": "",
            }

            return selec == "f1" ? form1 : selec == "f2" ? form2 : { ...form1, ...form2 };
        },

        getAdditionObj: function (selec = "") {
            let comment = ['PreviseComment', 'CommentZ']
            let assigne = ['Assignees']
            let buttons = ['ButtonSumbit', 'ButtonReSumbit', 'ButtonWorkFlow', 'ButtonAssignees', "ButtonWorkInProgress", "ButtonCompleted", "ButtonClosed", 'AttachmentButton', "AdditionalAttachmentButton"]
            return selec == "c" ? comment : selec == "a" ? assigne : selec == "b" ? buttons : [...comment, ...assigne, ...buttons]
        },

        getMainTableData: async function () {
            // let filter = { "name": "Sendto", "value": this.userInfo.empId }
            // let data = await this._currentController.crud_z.get_record(this._currentController.endsPoints['NewRequest'], '', filter)

            let data = await this._currentController.crud_z.get_record(this._currentController.endsPoints['NewRequest'])
            console.log("SharingRequestFunctions -> getMainTableData -> data ", data)
            console.log("SharingRequestFunctions -> getMainTableData -> this._currentController.userInfo?.empId ", this._currentController.userInfo?.empId)
            return data?.results?.filter(function (record) {
                // console.log("SharingRequestFunctions -> getMainTableData -> record.Sendto.split(', ').map(Number)", record.Sendto.split(', ').map(Number))
                return record.Sendto.split(', ').map(Number).includes(Number(this._currentController.userInfo?.empId));

            }.bind(this));
        },

        onMainSubmitSharing: function () {
            let data = this._currentController.getView().getModel(this.mainFormModel).getData();

            let formN = ["Internal Announcement", "Graphic Design", "Nadec Home Post"].includes(data.MainService) ? "f1" : ["Revision Request"].includes(data.MainService) ? "f2" : ""

            if (!formN) { console.log("no Form Number!"); return false }

            if (this.startValidation(data, formN)) { console.log("onMainSubmitSharing: ", { data }); return false }


            data.RequestDate = new Date()
            return data
        },

        // ================================== # Work Flow Data Functiolns XX # ==================================
        getHistoryDataWorkFlow: async function (resData, CommentZ) {
            let processedByMeObj = {
                "RequestId": resData.Id,
                "SendtoName": resData.Status == "Pending" ? this.extractNameFromStatusDisplay(resData.StatusDisplay) : `User Name(${resData.Sendto})`,
                "Status": resData.Status,
                "CommentZ": CommentZ
            }

            let historyObj = await this._currentController.oPayload_modify_parent(await this.getOwnerComponent().userService.getRequestHistoryObj(processedByMeObj))
            if (!historyObj) { return false }
            historyObj.ProcessedId = String(historyObj.ProcessedId)

            console.log("SharingRequestFunctions -> historyObj", historyObj)
            // if (historyObj?.CommentZ.length > 200) {
            //     historyObj?.CommentZ = historyObj.CommentZ.slice(0, 200);
            //   }

            return await this._currentController.crud_z.post_record(this._currentController.endsPoints['ProcessedByMe'], historyObj)
        },

        getRequesteData: async function (data, requesteData = {}) {
            const requestDataWORKFLOW = {
                RequesteData: {
                    status: requesteData?.status, // This will be one of: Pending, Approved, Rejected, Returned, Closed
                    sendToName: requesteData?.sendToName,
                    sendTo: requesteData?.sendTo,
                    step: requesteData?.step,
                    escalationId: requesteData?.escalationId,
                    lastActionBy: requesteData?.lastActionBy,
                },
                RequesterData: {
                    RequesterId: data?.RequesterId, // Renamed from requester_id
                    RequesterName: data?.RequesterName, // Renamed from requester_name
                    RequesterPosition: data?.RequesterPosition, // Renamed from requester_position
                    RequesterSection: data?.RequesterSection, // Renamed from requester_section
                    RequesterDept: data?.RequesterDept, // Renamed from requester_dept
                    RequesterLocation: data?.RequesterLocation, // Renamed from requester_location
                }
            };
            let userInfoWithRequestTamp = await this._currentController.getOwnerComponent().userService.getUserInfoWithRequestTamp(requestDataWORKFLOW)
            return this._currentController.oPayload_modify({ ...data, ...userInfoWithRequestTamp })
        },

        // ================================== # Payload_modify Functiolns XX # ==================================
        oPayload_modify: function (oPayload) {
            oPayload = this._currentController.oPayload_modify_parent(oPayload)
            oPayload.Steps = Number(oPayload.Steps)
            oPayload.RequesterId = String(oPayload.RequesterId)
            return oPayload
        },

        // ================================== # Visibile Functions # ==================================
        setVisbileForForm2: function (fieldsName, visible, editable, required) {
            let viewHelper = {}
            // Convert fieldsName to an array if it is not already one
            if (!Array.isArray(fieldsName)) {
                fieldsName = [fieldsName]; // Wrap it in an array
            }
            fieldsName.forEach(element => {

                viewHelper[element] = { visible: visible, editable: editable, required: required }
            })

            let viewOld = this._currentController.helperModelInstance.getProperty('/view')
            let newViewOld = this._currentController.deepMerge(viewOld, viewHelper)

            this._currentController.helperModelInstance.setProperty('/view', newViewOld)
        },

        setVisbileForFormInit: function () {
            this.fieldsName = Object.keys(this.getMainObj())

            let fieldsName = [...this.fieldsName, ...this.getAdditionObj()]

            this.setVisbileForForm2(fieldsName, false, false, false)
        },

        setVisbileOnSelected: function (sSelectedKey, status = '') {
            this.setVisbileForForm2(this.getAdditionObj(), false, false, false);
            this.setVisbileForForm2(Object.keys(this.getMainObj()), false, false, false);

            let editable = this.isNewRequest ? true : this.isMyTasks ? status == "Returned" ? true : false : false

            if (["Internal Announcement", "Graphic Design", "Nadec Home Post"].includes(sSelectedKey)) {
                this.setVisbileForForm2(Object.keys(this.getMainObj("f1")), true, editable, true);
            } else if (["Revision Request"].includes(sSelectedKey)) {
                this.setVisbileForForm2(Object.keys(this.getMainObj("f2")), true, editable, true);
                this.setVisbileForForm2('AdditionalLink', true, editable, false);
            }

        },

        // ================================== # Get Functions # ==================================
        getHistoryData: async function (requestId) {
            let filter = { "name": "ProcessedId", "value": requestId }
            let data = await this._currentController.crud_z.get_record(this._currentController.endsPoints['ProcessedByMe'], '', {})
            return data
        },

        getSelectedMainServiceNextLvl: async function (data, isBack = false) {
            let filterMainServiceName = { "name": 'MainServiceName', "value": data.MainService }
            let dataMainServiceName = await this._currentController.crud_z.get_record(this._currentController.endsPoints['SettingsApprovals'], '', filterMainServiceName)

            return dataMainServiceName.results.filter(function (item) {
                let stepToCompare = isBack ? (data.Steps - 1) : (data.Steps + 1);
                return item.ApprovalLevels === stepToCompare;
            });
        },

        getSelectedMainServiceNextLvl2: async function (data) {
            let filterMainServiceName = { "name": 'MainServiceName', "value": data.MainService }
            let dataMainServiceName = await this._currentController.crud_z.get_record(this._currentController.endsPoints['SettingsEscalation'], '', filterMainServiceName)

            return dataMainServiceName.results.filter(function (item) {
                return item.EscalationLevels === 1;
            });
        },

        setSettingsAssigneesData: async function () {
            let data = await this._currentController.crud_z.get_record(this._currentController.endsPoints['SettingsAssignees'])
            this._currentController.getView().setModel(new sap.ui.model.json.JSONModel(data?.results), 'SettingsAssigneesTableModel');
            this._currentController.getView().setModel(new sap.ui.model.json.JSONModel({ "SendTo": '' }), 'SettingsAssigneesFormModel');
        },

        setComments: function (selectedTaskz) {
            console.log("SharingRequestFunctions -> selectedTaskz: ", selectedTaskz)
            // historyDataSelected
            let h_d_s = this.historyData?.results.filter(function (item) {
                return item.RequestId === selectedTaskz.Id;
            });

            console.log("SharingRequestFunctions -> h_d_s", h_d_s)

            let showMessageComment = "" // Foor loop to all Request history and set all Comments.
            let xx = []
            for (let i = h_d_s.length - 1; i >= 0; i--) {


                const element = h_d_s[i];
                const separator = "\n---------\n";
                showMessageComment = showMessageComment + `${element.ProcessedBy}(${element.ProcessedId}): ${element.CommentZ}\nRequest: ${this._currentController.formatDateToCustomPattern(element.CreatedDate)}${separator}`;

                xx.push({
                    sender: `${element.ProcessedBy}(${element.ProcessedId})`,
                    info: element.Status,
                    timestamp: this._currentController.formatRequestDate(element.CreatedDate),
                    // timestamp: new Date(element.CreatedDate),
                    text: element.CommentZ,

                })

            }

            console.log("SharingRequestFunctions -> xx", xx)

            this._currentController.getView().getModel(this.CommentModel)?.setProperty('/PreviseComment', `${showMessageComment}`)

            this._currentController.getView().setModel(new sap.ui.model.json.JSONModel(xx), this.previseCommentCommentModel);
        },
        // ================================== # Validations # ==================================
        startValidation: function (oPayload, formN) {
            let fieldsName = Object.keys(this.getMainObj(formN));

            let requiredList = fieldsName.filter(field => field);

            if (formN == "f1") { requiredList = requiredList.filter(el => el !== "Attachment"); }

            if (formN == "f2") { requiredList = ['MainService', "Description", "Attachment"]; }

            const rulesArrName = [
                { arr: requiredList, name: 'required' },
            ];

            let { isErr, setvalueStateValues } = this._currentController.validation_z.startValidation(fieldsName, rulesArrName, oPayload)
            console.log(setvalueStateValues)
            this._currentController.getView().setModel(new sap.ui.model.json.JSONModel(setvalueStateValues), this.mainFormErrModel);
            return isErr
        },

        startValidationComment: function (oPayload) {
            let fieldsName = Object.keys({ CommentZ: '' });
            let requiredList = fieldsName.filter(field => field);

            const rulesArrName = [
                { arr: requiredList, name: 'required' },
            ];

            let { isErr, setvalueStateValues } = this._currentController.validation_z.startValidation(fieldsName, rulesArrName, oPayload)
            console.log(setvalueStateValues)
            this._currentController.getView().setModel(new sap.ui.model.json.JSONModel(setvalueStateValues), this.CommentErrModel);
            return isErr
        },

        startValidationAssingees: function (oPayload) {
            let fieldsName = Object.keys({ SendTo: '' });
            let requiredList = fieldsName.filter(field => field);

            const rulesArrName = [
                { arr: requiredList, name: 'required' },
            ];

            let { isErr, setvalueStateValues } = this._currentController.validation_z.startValidation(fieldsName, rulesArrName, oPayload)
            console.log(setvalueStateValues)
            this._currentController.getView().setModel(new sap.ui.model.json.JSONModel(setvalueStateValues), "SettingsAssigneesFormErrModel");
            return isErr
        },

        // ================================== # Helper Functions # ==================================

        // ================================== # Helper Functions # ==================================
        // ================================== # Helper Functions # ==================================

    });
});