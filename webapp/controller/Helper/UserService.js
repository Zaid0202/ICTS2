sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("internal.controller.Helper.UserService", {
        constructor: function (currentController, userId) {
            this.userId = userId
            this._currentController = currentController;
        },

        onInit: async function () {
            this.userinfoFullObj = await this.getUserinfoFullObj()
            this.userInfo = this.getUserInfo()
            console.log("this.userinfoFullObj: ", this.userinfoFullObj)
            console.log("this.userInfo: ", this.userInfo)



        },

        getUserinfoFullObj: async function () {
            const mModel = this._currentController.getModel("SF");
            let userId = this.userId

            try {
                const userDetailurl = `${mModel.sServiceUrl}/User?$filter=userId eq '${userId}'&$expand=manager&$format=json`;
                // const userDetailurl = `${mModel.sServiceUrl}/User('10125')/empInfo&$format=json`;
                const response = await fetch(userDetailurl);
                const jobData = await response.json();

                return jobData.d.results[0]
                return jobData
            } catch (error) {
                console.error("Failed to fetch roles Details", error);
            }

        },

        getUserInfo: function () {
            let userInfoFullObj = this.userinfoFullObj
            return {
                empId: userInfoFullObj?.userId,
                userEmail: userInfoFullObj?.username,
                userLocation: userInfoFullObj?.city,
                displayName: `${userInfoFullObj?.displayName}`,
                // displayName: `${userInfoFullObj?.displayName}(${userInfoFullObj?.userId})`,
                position: userInfoFullObj?.title,
                grade: userInfoFullObj?.payGrade,
                division: userInfoFullObj?.division,
                department: userInfoFullObj?.department,
                city: userInfoFullObj?.city,
                managerName: userInfoFullObj?.manager?.displayName,
                managerId: userInfoFullObj?.manager?.userId,
                managerEmail: userInfoFullObj?.manager?.username,
            }
        },

        getRequesterData: function () {
            let userInfo = this.userInfo
            return {
                RequesterId: userInfo?.empId, // Renamed from requester_id
                RequesterName: userInfo?.displayName, // Renamed from requester_name
                RequesterPosition: userInfo?.jobCode, // Renamed from requester_position
                RequesterSection: userInfo?.department, // Renamed from requester_section
                RequesterDept: userInfo?.division, // Renamed from requester_dept
                RequesterLocation: userInfo?.city, // Renamed from requester_location
            }
        },

        getTaskDetails: function (status, userInfo, step, sendTo , sendToName ) {
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

        getRequesteData: function (obj) {
            let status = obj?.status;
            let sendTo = obj?.sendTo;
            let sendToName = obj?.sendToName;
            let step = obj?.step;

            const userInfo = this.userInfo || {};

            // Assuming getTaskDetails returns an object with "StatusDisplay", "Sendto", and "Steps"
            const workFlow = this.getTaskDetails(status, userInfo, step, sendTo, sendToName);

            return {
                Status: status, // This will be one of: Pending, Approved, Rejected, Returned, Closed
                StatusDisplay: workFlow?.statusDisplay || "",
                Sendto: workFlow?.sendto,
                Steps: workFlow?.steps,
                LastActionBy: `${userInfo.displayName || "Unknown"}(${userInfo.empId || "Unknown"})`,
                LastActionDate: new Date(),
                AssignedDate: new Date(), // Renamed from assigned_date
            };
        },

        getUserInfoWithRequestTamp: function (obj) {
            let requesteData = this.getRequesteData(obj?.RequesteData)
            let requesterData = this.getRequesterData()

            // console.log({ requesteData })
            // console.log({ requesterData })

            return {
                ...requesteData, ...requesterData
            };
        },

        getRequestHistoryObj: function (Obj) {
            const userInfo = this.userInfo || {};

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







