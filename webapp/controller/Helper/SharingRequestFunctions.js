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

        },

        onInit: function () {
            console.log('Initializing SharingRequestFunctions...');

            console.log("Before merging: ", this);
            // console.log("Current controller: ", this._currentController);
        
            // Merge instance methods from `this._currentController` (MyTask instance)
            Object.assign(this, this._currentController);

            // Merge prototype methods from _currentController into SharingRequestFunctions' prototype
            Object.assign(Object.getPrototypeOf(this), Object.getPrototypeOf(this._currentController));
            Object.assign(Object.getPrototypeOf(this), Object.getPrototypeOf(Object.getPrototypeOf(this._currentController)));

            console.log("After merging: ", this);

            // ------------------------------------ Call Classs ------------------------------------
            this.uploadeFile = new UploadeFile(this)
            this.emailService = new EmailService(this)

            // ------------------------------------ Constents ------------------------------------
            this.mainEndPoint = this.endsPoints['NewRequest']
            this.mainFormId = 'mainFormId'
            this.mainFormModel = 'mainFormModel'
            this.mainFormErrModel = "mainFormErrModel"

            this.mainTableId = 'mainTableId'
            this.mainTableModel = 'mainTableModel'

            this.CommentModel = 'CommentModel'
            this.CommentErrModel = 'CommentErrModel'


            return this
        },



        // ================================== # Init Functiolns XX # ==================================
        setInVlus: async function () {
            // By Default
            this.getView().setModel(new sap.ui.model.json.JSONModel(this.getMainObj()), this.mainFormModel);

            this.getView().setModel(new sap.ui.model.json.JSONModel(await this.getMainTableData()), this.mainTableModel)// Set

            // XXXX
            this.historyData = await this.getHistoryData()
            await this.setSettingsAssigneesData()


            this.getView().setModel(new sap.ui.model.json.JSONModel({ CommentZ: '', PreviseComment: '' }), this.CommentModel);
        },

        reSetValues: function () {
            this.getView().setModel(new sap.ui.model.json.JSONModel(this.getMainObj()), this.mainFormModel);

            let setvalueStateValues = this.validation_z.reSetValuesState(Object.keys(this.getMainObj()), {})
            this.getView().setModel(new sap.ui.model.json.JSONModel(setvalueStateValues), this.mainFormErrModel);

            this.dateTime?.setValue('')
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
            let buttons = ['ButtonSumbit', 'ButtonReSumbit', 'ButtonWorkFlow', 'ButtonAssignees', "ButtonWorkInProgress", "ButtonCompleted", "ButtonClosed"]
            return selec == "c" ? comment : selec == "a" ? assigne : selec == "b" ? buttons : [...comment, ...assigne, ...buttons]
        },

        getMainTableData: async function () {
            // let filter = { "name": "Sendto", "value": this.userInfo.empId }
            // let data = await this.crud_z.get_record(this.endsPoints['NewRequest'], '', filter)

            let data = await this.crud_z.get_record(this.endsPoints['NewRequest'])
            return data?.results?.filter(function (record) {
                return record.Sendto.split(', ').includes(this.userInfo.empId);
            }.bind(this));
        },

        onMainSubmitSharing: function () {
            let data = this.getView().getModel(this.mainFormModel).getData();

            let formN = ["Internal Announcement", "Graphic Design", "Nadec Home Post"].includes(data.MainService) ? "f1" : ["Revision Request"].includes(data.MainService) ? "f2" : ""

            if (!formN) { console.log("no Form Number!"); return false }

            if (this.startValidation(data, formN)) { return false }

            console.log("onMainSubmitSharing: ", { data })

            return data
        },

        // ================================== # Work Flow Data Functiolns XX # ==================================
        getHistoryDataWorkFlow: async function (resData, CommentZ) {
            let processedByMeObj = {
                "RequestId": resData.Id,
                "SendtoName": this.extractNameFromStatusDisplay(resData.StatusDisplay),
                "Status": resData.Status,
                "CommentZ" : CommentZ
            }

            let historyObj = this.oPayload_modify_parent(this.getOwnerComponent().userService.getRequestHistoryObj(processedByMeObj))
            if (!historyObj) {return false}

            // if (historyObj?.CommentZ.length > 200) {
            //     historyObj?.CommentZ = historyObj.CommentZ.slice(0, 200);
            //   }

            return await this.crud_z.post_record(this.endsPoints['ProcessedByMe'], historyObj)
        },

        getRequesteData: async function (data, requesteData = {}) {
            const requestDataWORKFLOW = {
                RequesteData: {
                    status: requesteData?.status, // This will be one of: Pending, Approved, Rejected, Returned, Closed
                    sendToName: requesteData?.sendToName,
                    sendTo: requesteData?.sendTo,
                    step: requesteData?.step
                }
            };
            let userInfoWithRequestTamp = await this.getOwnerComponent().userService.getUserInfoWithRequestTamp(requestDataWORKFLOW)
            return this.oPayload_modify({ ...data, ...userInfoWithRequestTamp })
        },

        // ================================== # Payload_modify Functiolns XX # ==================================
        oPayload_modify_IGN: function (oPayload) {
            oPayload = this.oPayload_modify_parent(oPayload)
            return oPayload
        },

        oPayload_modify_RevisionRequest: function (oPayload) {
            oPayload = this.oPayload_modify_parent(oPayload)
            return oPayload
        },

        oPayload_modify: function (oPayload) {
            oPayload = this.oPayload_modify_parent(oPayload)
            return oPayload
        },

        oPayload_modify: function (oPayload) {
            oPayload = this.convertDateStringsToDateObjects(oPayload)
            oPayload.Steps = Number(oPayload.Steps)
            oPayload.LastActionBy = oPayload.LastActionBy
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
            });

            let viewOld = this.helperModelInstance.getProperty('/view')
            viewOld = this.deepMerge(viewOld, viewHelper)

            this.helperModelInstance.setProperty('/view', viewOld)
        },

        setVisbileForFormInit: function () {
            this.fieldsName = Object.keys(this.getMainObj())

            let fieldsName = [...this.fieldsName, ...this.getAdditionObj()]

            this.setVisbileForForm2(fieldsName, false, false, false)
        },

        setVisbileOnSelected: function (sSelectedKey) {
            this.setVisbileForForm2(this.getAdditionObj(), false, false, false);
            this.setVisbileForForm2(Object.keys(this.getMainObj()), false, false, false);

            var viewName = this.getView().getViewName();
            let editable = viewName == 'internal.view.NewRequest' ? true : viewName == 'internal.view.MyTasks' ? false : false

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
            let data = await this.crud_z.get_record(this.endsPoints['ProcessedByMe'], '', {})
            return data
        },

        getSelectedMainServiceNextLvl: async function (data, isBack=false) {
            let filterMainServiceName = { "name": 'MainServiceName', "value": data.MainService }
            let dataMainServiceName = await this.crud_z.get_record(this.endsPoints['SettingsApprovals'], '', filterMainServiceName)

            return dataMainServiceName.results.filter(function (item) {
                let stepToCompare = isBack ? (data.Steps - 1) : (data.Steps + 1);
                return item.ApprovalLevels === stepToCompare;
            });
        },

        setSettingsAssigneesData: async function () {
            let data = await this.crud_z.get_record(this.endsPoints['SettingsAssignees'])
            this.getView().setModel(new sap.ui.model.json.JSONModel(data?.results), 'SettingsAssigneesTableModel');
            this.getView().setModel(new sap.ui.model.json.JSONModel({ "SendTo": '' }), 'SettingsAssigneesFormModel');
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

            let { isErr, setvalueStateValues } = this.validation_z.startValidation(fieldsName, rulesArrName, oPayload)
            console.log(setvalueStateValues)
            this.getView().setModel(new sap.ui.model.json.JSONModel(setvalueStateValues), this.mainFormErrModel);
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

        // ================================== # Helper Functions # ==================================

        // ================================== # Helper Functions # ==================================
        // ================================== # Helper Functions # ==================================

    });
});