sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("internal.controller.Helper.UserService", {
        constructor: function (currentController, userId) {
            this.userId = userId
            this._currentController = currentController;
            this.userinfoFullObj = null
        },

        getUserinfoFullObj: async function () {
            const mModel = this._currentController.getModel("SF");

            try {
                const userDetailurl = `${mModel.sServiceUrl}/User?$filter=userId eq '${this.userId}'&$expand=manager&$format=json`;
                // const userDetailurl = `${mModel.sServiceUrl}/User('10125')/empInfo&$format=json`;
                const response = await fetch(userDetailurl);
                const jobData = await response.json();

                return jobData.d.results[0]
                return jobData
            } catch (error) {
                console.error("Failed to fetch roles Details", error);
            }

        },

        getUserInfo: async function () {
            // this.userInfo = this.getUserInfo(this.userinfoFullObj)

            if (!this.userinfoFullObj) {
                this.userinfoFullObj = await this.getUserinfoFullObj()
            }
            // console.log("UserService -> this.userinfoFullObj: ", this.userinfoFullObj)

            this.userInfo = {
                empId: this.userinfoFullObj?.userId || Number(this.userId),
                userEmail: this.userinfoFullObj?.username || "Damy Data",
                userLocation: this.userinfoFullObj?.city || "Damy Data",
                displayName: `${this.userinfoFullObj?.displayName}` || "Damy Data",
                // displayName: `${this.userinfoFullObj?.displayName}(${this.userinfoFullObj?.userId})` || "Damy Data",
                position: this.userinfoFullObj?.title || "Damy Data",
                grade: this.userinfoFullObj?.payGrade || "Damy Data",
                division: this.userinfoFullObj?.division || "Damy Data",
                department: this.userinfoFullObj?.department || "Damy Data",
                city: this.userinfoFullObj?.city || "Damy Data",
                managerName: this.userinfoFullObj?.manager?.displayName || "Damy Data",
                managerId: this.userinfoFullObj?.manager?.userId || "Damy Data",
                managerEmail: this.userinfoFullObj?.manager?.username || "Damy Data",
            }

            // console.log("UserService -> this.userInfo: ", this.userInfo)
            return this.userInfo
        },

        getRequesterData: async function () {
            let userInfo = await this.getUserInfo()
            return {
                RequesterId: userInfo?.empId, // Renamed from requester_id
                RequesterName: userInfo?.displayName, // Renamed from requester_name
                RequesterPosition: userInfo?.jobCode, // Renamed from requester_position
                RequesterSection: userInfo?.department, // Renamed from requester_section
                RequesterDept: userInfo?.division, // Renamed from requester_dept
                RequesterLocation: userInfo?.city, // Renamed from requester_location
            }
        },

        getTaskDetails: function (userInfo, status, step, sendTo, sendToName) {
            let isMangeerExist = userInfo?.managerName && userInfo?.managerId ? true : false
            status = (!isMangeerExist && status === "Pending") ? "Approved" : status  // To Go next Lvl if no Line manager is Exist. 

            const detailsMap = {
                "Pending": {
                    statusDisplay: isMangeerExist
                        ? `Forwarded to: ${userInfo.managerName}(${userInfo.managerId})`
                        : `Forwarded to: ${sendToName}(${sendTo})`,
                    sendto: isMangeerExist ? userInfo.managerId : sendTo,
                    steps: 1
                },
                "Approved": {
                    statusDisplay: `Approved by: ${userInfo?.displayName}(${userInfo?.empId})`,
                    sendto: sendTo,
                    steps: step + 1
                },
                "Rejected": {
                    statusDisplay: `Rejected by: ${userInfo?.displayName}(${userInfo?.empId})`,
                    sendto: '',
                    steps: 100
                },
                "Returned": {
                    statusDisplay: `Returned by: ${userInfo?.displayName}(${userInfo?.empId})`,
                    sendto: sendTo,
                    steps: 0
                },
                "Assigned": {
                    statusDisplay: `Assigned by: ${userInfo?.displayName}(${userInfo?.empId})`,
                    sendto: sendTo,
                    steps: step + 1
                },
                "WorkInProgress": {
                    statusDisplay: `Work In Progress by: ${userInfo?.displayName}(${userInfo?.empId})`,
                    sendto: sendTo,
                    steps: step
                },
                "Completed": {
                    statusDisplay: `Completed by: ${userInfo?.displayName}(${userInfo?.empId})`,
                    sendto: sendTo,
                    steps: 99
                },
                "Closed": {
                    statusDisplay: `Closed by: ${userInfo?.displayName}(${userInfo?.empId})`,
                    sendto: '',
                    steps: 100
                }
            };

            return detailsMap[status];
        },

        getRequesteData: async function (obj) {
            let status = obj?.status;
            let sendTo = obj?.sendTo;
            let sendToName = obj?.sendToName;
            let step = obj?.step;
            let lastActionBy = obj?.lastActionBy
            let userInfo = await this.getUserInfo() || {};

            // Assuming getTaskDetails returns an object with "StatusDisplay", "Sendto", and "Steps"
            const workFlow = this.getTaskDetails(userInfo, status, step, sendTo, sendToName);
            return {
                Status: status, // This will be one of: Pending, Approved, Rejected, Returned, Closed
                StatusDisplay: workFlow?.statusDisplay || "",
                Sendto: workFlow?.sendto,
                Steps: workFlow?.steps,
                LastActionBy: status ==  'WorkInProgress' ? lastActionBy : `${userInfo.displayName || "Unknown"}(${userInfo.empId || "Unknown"})`,
                LastActionDate: new Date(),
                AssignedDate: new Date(), // Renamed from assigned_date
                EscalationId: ''
            };
        },

        getUserInfoWithRequestTamp: async function (obj) {
            let requesteData = await this.getRequesteData(obj?.RequesteData)
            let requesterData = obj.RequesteData.status == "Pending" ? await this.getRequesterData() : obj?.RequesterData

            console.log("UserService -> requesteData: ", requesteData)
            console.log("UserService -> requesterData: ", requesterData)

            return {
                ...requesteData, ...requesterData
            };


            return requesteData
        },

        getRequestHistoryObj: async function (Obj) {
            let userInfo = await this.getUserInfo() || {};

            if (!userInfo) { return false }

            const ProcessedId = userInfo.empId || 'Unknown';
            const ProcessedBy = userInfo.displayName || 'Unknown User';

            let RequestId = Obj?.RequestId || '0000000000';
            let SendtoName = Obj?.SendtoName;
            let CommentZ = Obj?.CommentZ || `New Request.`;
            let Status = Obj?.Status;


            // Adjusting status for the 'action' field
            const AdjustedStatus = Status === 'Pending' ? 'Submitted' : Status;

            // Adjusting sendtoName if the status is 'Pending'
            return {
                SeqId: 0, // Assuming this is auto-generated or set elsewhere
                RequestId: RequestId,
                CommentZ: CommentZ,
                Status: Status,
                ProcessedId: ProcessedId,
                ProcessedBy: ProcessedBy,
                ActionDateTime: new Date(),
                Action: `${AdjustedStatus} by: ${ProcessedBy}(${ProcessedId})`,
                SendtoName: SendtoName,
            };
        },

    });
});







