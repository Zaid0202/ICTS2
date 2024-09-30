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
            await this.fetchUserInfo.call(this);
            this.userInfo = this.getUserInfo()
        },

        fetchUserInfo: async function () {
            let attempts = 0;
            const maxAttempts = 1; // Set a maximum number of attempts to avoid infinite loops

            while (attempts < maxAttempts) {
                this.userinfoFullObj = await this.getUserinfoFullObj();

                if (this.userinfoFullObj) {
                    // console.log("this.userinfoFullObj: ", this.userinfoFullObj)
                    // If the userinfoFullObj is found, return it
                    return true;
                }

                attempts++;
                console.log(`Attempt ${attempts}: User info not found, retrying...`);

                // Optionally, you can wait for some time before retrying
                await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for 1.5 second
            }

            // If the loop ends without finding the user info, handle accordingly
            return 'User info does not exist after maximum attempts';
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
            return {
                empId: this.userinfoFullObj?.userId || '',
                userEmail: this.userinfoFullObj?.username || '',
                userLocation: this.userinfoFullObj?.city || '',
                displayName: `${this.userinfoFullObj?.displayName}` || '',
                // displayName: `${this.userinfoFullObj?.displayName}(${this.userinfoFullObj?.userId})` || '',
                position: this.userinfoFullObj?.title || '',
                grade: this.userinfoFullObj?.payGrade || '',
                division: this.userinfoFullObj?.division || '',
                department: this.userinfoFullObj?.department || '',
                city: this.userinfoFullObj?.city || '',
                managerName: this.userinfoFullObj?.manager?.displayName || '',
                managerId: this.userinfoFullObj?.manager?.userId || '',
                managerEmail: this.userinfoFullObj?.manager?.username || '',
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

        getRequesteData: function (obj) {
            let status = obj?.status;
            let sendTo = obj?.sendTo;
            let sendToName = obj?.sendToName;
            let step = obj?.step;

            const userInfo = this.userInfo || {};

            // Assuming getTaskDetails returns an object with "StatusDisplay", "Sendto", and "Steps"
            const workFlow = this.getTaskDetails(userInfo, status, step, sendTo, sendToName);
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







