sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "internal/controller/Helper/CRUD_z",
    "internal/controller/Helper/Validation_z",
    "internal/controller/Helper/UiTableFSG2",

  ],
  function (BaseController, JSONModel, CRUD_z, Validation_z, UiTableFSG2) {
    "use strict";

    return BaseController.extend("internal.controller.Helper.BaseController", {
      onInit: async function () {

        // endsPoints  CRUD_z     User Info Here The Isusues..

        // Check if endsPoints model is available

        let ownerComponent = this.getOwnerComponent();

        if (!ownerComponent) {
          throw new Error("Owner Component not initialized");
        }

        this.endsPoints = this.getOwnerComponent()?.getModel("endsPoints").getData()
        if (!this.endsPoints) {
          throw new Error("endsPoints model not initialized");
        }

        this.validation_z = new Validation_z()
        this.UiTableFSG2 = new UiTableFSG2(this)
        this.crud_z = new CRUD_z(this)
        this.mainOModel = this.crud_z.oModel;

        //-----------User Part---------
        var userData = this.getOwnerComponent.getModel("userDataModel").getData();
        if (!userData) {
          console.log("NO Uset Data!")
        }
        this.userInfo = userData.userInfo
        this.userId = this.userInfo.empId
        this.sUserRole = userData.role
        console.log("BaseController -> this.userInfo", this.userInfo)
        console.log("BaseController -> this.sUserRole", this.sUserRole)

        //--------------------------------
        this.helperModel = 'helperModel'
        this.getView()?.setModel(new sap.ui.model.json.JSONModel({}), this.helperModel)
        this.helperModelInstance = this.getView()?.getModel(this.helperModel)
        this.setMode('Create')
        console.log("Finsh THe Base Controller: ");
        this.getOwnerComponent().setModel(new sap.ui.model.json.JSONModel({ isShowAllRequest: false }), "isShowAllRequest");

      },

      onBeforeRendering: function () {
        // console.log("onBeforeRendering-----------------------")
        // Manipulate the view elements before rendering
      },

      onAfterRendering: function () {
        // console.log("onAfterRendering----------------------")
        // Access the DOM and manipulate UI elements after rendering
      },

      onExit: function () {
        console.log("onExit-------------------")
        // Cleanup code, like detaching events or clearing resources
      },

      setMode: function (mode) {
        this.helperModelInstance?.setProperty('/Mode', mode)
      },

      getMode: function () {
        return this.helperModelInstance?.getData().Mode
      },

      oPayload_modify_parent: function (oPayload) {
        if (!oPayload) { return false }

        const isEdit = this.getMode() == "Edit" ? true : false

        oPayload.Id = isEdit ? oPayload.Id : "0000000000"
        oPayload.CreatedDate = isEdit ? new Date(oPayload.CreatedDate) : new Date()
        oPayload.UpdatedDate = new Date()

        if ('__metadata' in oPayload) {
          delete oPayload['__metadata'];
        }

        oPayload = this.convertDateStringsToDateObjects(oPayload)

        return oPayload
      },

      convertDateStringsToDateObjects: function (obj) {
        // Iterate over each key in the object
        for (let key in obj) {
          if (obj.hasOwnProperty(key)) {
            // Check if the key contains 'Date' or 'date'
            if (/date/i.test(key)) {
              // Check if the value is a valid date string
              const dateValue = new Date(obj[key]);
              if (!isNaN(dateValue.getTime())) {
                // Convert the string to a Date object
                obj[key] = dateValue;
              } else {
                // If the value is not a valid date, set to default date '1900/1/1'
                obj[key] = new Date('1900-01-01');
              }
            }
          }
        }
        return obj;
      },

      // convertDateStringsToDateObjects: function (obj) {
      //   // Iterate over each key in the object
      //   for (let key in obj) {
      //     if (obj.hasOwnProperty(key)) {
      //       // Check if the key contains 'Date' or 'date'
      //       if (/date/i.test(key)) {
      //         // Check if the value is a valid date string
      //         const dateValue = new Date(obj[key]);
      //         if (!isNaN(dateValue.getTime())) {
      //           // Convert the string to a Date object
      //           obj[key] = dateValue;
      //         }
      //       }
      //     }
      //   }
      //   return obj;
      // },

      setBusy: function (id, status) {
        this.getView()?.byId(id)?.setBusy(status);
      },

      extractNameFromStatusDisplay: function (statusDisplay) {
        // Regular expression to extract the name
        // let nameMatch = statusDisplay.match(/(?:Forwarded to|Approved by|Rejected by|Returned by|Closed by)\s*(.*?)\s*\(/);

        let nameMatch = statusDisplay.match(/(?:Forwarded to|Approved by|Rejected by|Returned by|Closed by):?\s*([a-zA-Z\s]+\(\d+\))/);

        // console.log({ nameMatch })
        // Return the extracted name or null if not found
        return nameMatch ? nameMatch[1] : "Employee Name not found!";
      },

      getYearsList: function (startYear) {
        const currentYear = new Date().getFullYear();
        let years = [];

        for (let year = startYear; year <= currentYear; year++) {
          years.push(year);
        }

        return years;
      },


      // Get user Info
      getManagerId: async function (userId) {
        userId = Number(userId)
        const mModel = this.getOwnerComponent()?.getModel("SF");
        try {
          const userDetailurl = `${mModel.sServiceUrl}/User?$filter=userId eq '${userId}'&$format=json`;
          const response = await fetch(userDetailurl);
          const jobData = await response.json();
          return jobData.d.results[0];
        } catch (error) {
          console.error("Failed to fetch roles Details", error);
        }
      },

      getUserByIdOnInputUser: async function (ev, isSumbit = false) {
        const input = ev.getSource();
        const userId = input.getValue();


        if (userId.length == 5 || isSumbit) {
          this.getView()?.byId('inputEmployeeNameId').setBusy(true);
          let userDetail = await this.getManagerId(userId);
          this.getView()?.getModel(this.mainFormErrModel).setProperty('/EmployeeId', { 'valueStateText': '', 'valueState': "None" });

          if (!userDetail) {
            this.getView()?.getModel(this.mainFormErrModel).setProperty('/EmployeeId', { 'valueStateText': 'Not Found User Id!', 'valueState': "Error" });
            this.getView()?.getModel(this.mainFromModel).setProperty('/EmployeeName', '');
            console.log(this.getView()?.getModel(this.mainFormErrModel).getData())
            this.getView()?.byId('inputEmployeeNameId').setBusy(false);
            return 0;
          }

          // Set the user detail in the model
          // const division = userDetail?.division.split('(')[0].trim();
          // this.getView()?.getModel(this.mainFromModel).setProperty('/EmployeeId', `${userDetail?.displayName}(${division})`);

          this.getView()?.getModel(this.mainFromModel).setProperty('/EmployeeName', `${userDetail?.displayName}`);
          this.getView()?.byId('inputEmployeeNameId').setBusy(false);
        } else {
          this.getView()?.getModel(this.mainFormErrModel).setProperty('/EmployeeId', { 'valueStateText': '', 'valueState': "None" });
          this.getView()?.getModel(this.mainFromModel).setProperty('/EmployeeName', '');
        }

        // this.getView()?.byId('inputEmployeeNameId').setBusy(false);
      },

      // ================================== # Formaters Files Functions # ==================================
      formatVisibilityReturnRejectAbrov: function (isEditModeWorkFlow, isAssigneesWorkFlow, isClosedWorkFlow) {
        return !(isEditModeWorkFlow || isAssigneesWorkFlow || isClosedWorkFlow)
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
      //   const formattedDate = date.toLocaleDateString('en-US', options);f

      //   // Convert the formatted date to the desired format (MMM/DD/YYYY)
      //   const [month, day, year] = formattedDate.split(' ');
      //   return `${month}/${day.replace(',', '')}/${year}`; // Remove comma from day if exists
      // },

      // formatRequestDate: function (oDate) {
      //   if (!oDate) return '';

      //   // Create a date object from the input
      //   const date = new Date(oDate);

      //   // Get month, day, and year
      //   const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-based, pad with zero
      //   const day = String(date.getDate()).padStart(2, '0'); // Pad day with zero
      //   const year = date.getFullYear();

      //   // Return formatted date
      //   return `${month}/${day}/${year}`;
      // },
      formatRequestDate: function (oDate) {
        // console.log("BaseController -> oDate ", oDate)

        if (!oDate) return '';

        // Create a date object from the input timestamp
        const date = new Date(oDate);

        // Define options to format the date into the desired pattern
        const options = {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        };
        // Use JavaScript's built-in Intl.DateTimeFormat for localization and formatting
        return new Intl.DateTimeFormat('en-US', options).format(date);
      },

      // FormatS 
      formatDateToCustomPattern: function (oDate, pattern = "M-d-yyyy") {
        if (!oDate) {
          return ""; // Return an empty string if no date is provided
        }

        // Create a DateFormat instance with the desired pattern
        var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
          pattern: "M-d-yyyy" // Custom pattern: month-day-year
        });

        // Format the passed date object to the specified pattern
        return this.formatRequestDate(oDate);
        return oDateFormat.format(oDate);
      },

      formatAttachmentText1: async function (sAttachment) {
        // console.log("BaseController -> sAttachment", sAttachment)

        let isAllDigits = /^[0-9]{10}$/.test(sAttachment); // Checks if it's exactly 10 digits

        if (sAttachment && isAllDigits) {
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
        return sAttachment || "No Attachment";
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

      statusState: function (sStatus) {
        // Set the state of the ObjectStatus based on the status value
        switch (sStatus) {
          case "Pending":
            return 'Information';
          case "Approved":
            return 'Success';
          case "Rejected":
            return 'Error';
          case "Returned":
            return 'Warning';
          case "Assigned":
            return 'Information';
          case "WorkInProgress":
            return 'Warning';
          case "Completed":
            return 'Success';
          case "Closed":
            return 'Success';
          default:
            return 'None';  // Default state if the status doesn't match any case
        }
      },



      formatIdToCustomPattern: function (Id) {
        if (!Id) {
          return ""; // Return an empty string if no date is provided
        }
        return Number(Id)
      },

      /// 
      camelCaseToNormal: function (camelCaseStr) {
        return camelCaseStr.replace(/([a-z])([A-Z])/g, '$1 $2');
      },

      formatRequester: function (sName, sId) {
        // console.log("basecontllre -> formatRequester -> sName, sId", sName, sId)
        return sName && sId ? `${sName} (${sId})` : "";
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
      // ================================== # Formaters Files Functions # ==================================
      // deepMerge: function (target, source) {
      //   // Ensure both target and source are objects
      //   if (typeof target !== 'object' || target === null) {
      //     target = {};
      //   }

      //   if (typeof source !== 'object' || source === null) {
      //     return target; // Nothing to merge if source is not an object
      //   }

      //   for (let key in source) {
      //     // Check if the source value is an object and if the key exists in both target and source
      //     if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      //       // Recursively merge objects
      //       target[key] = this.deepMerge(target[key], source[key]);
      //     } else {
      //       // Otherwise, assign the source value to the target
      //       target[key] = source[key];
      //     }
      //   }

      //   return target; // Return the merged object
      // },

      deepMerge: function (target, source) {
        if (typeof target !== 'object' || target === null) {
          target = {};
        }

        if (typeof source !== 'object' || source === null) {
          return target;
        }

        // console.log("BaseController -> source ", source)

        for (let key in source) {
          // console.log("BaseController -> key ", key)
          if (typeof source[key] === 'object' && source[key] !== null && !(source[key] instanceof Array)) {
            // Recursively merge only if the value is an object (not array or primitive)
            if (!target[key]) {
              target[key] = {};  // Ensure the key exists in the target
            }
            // console.log("BaseController -> key ", key)
            // console.log("BaseController -> target[key] ", target[key])
            // console.log("BaseController -> source[key] ", source[key])
            target[key] = this.deepMerge(target[key], source[key]);
          } else {
            // Directly assign the value (scalar or array) from source to target
            target[key] = source[key];
            // console.log("BaseController -> [key] ", key, target[key])
          }
        }
        // console.log("BaseController -> deepMerge Finsh\n\ntarget", target)
        return target;
      }

      ,

      getaFieldNames: function (formId) {

        // Get the form by its ID
        let oForm = this.getView().byId(formId);

        // Get all form containers
        let aFormContainers = oForm.getFormContainers();

        // Array to store field names
        let aFieldNames = [];

        // Iterate over each form container
        aFormContainers.forEach(function (oFormContainer) {

          // Get the form elements within the container
          let aFormElements = oFormContainer.getFormElements();

          // Iterate over the form elements
          aFormElements.forEach(function (oFormElement) {

            // Check if the "visible" property has a binding path
            let oVisibleBindingInfo = oFormElement.getBindingInfo("visible");

            if (oVisibleBindingInfo && oVisibleBindingInfo.binding) {
              let sPath = oVisibleBindingInfo.binding.getPath(); // e.g., "/view/MainService/visible"

              // Extract the field name from the path (assuming the path follows this structure)
              let sFieldName = sPath.split("/")[2]; // Get "MainService" from "/view/MainService/visible"

              // Add the field name to the array if it's not already present
              if (sFieldName && !aFieldNames.includes(sFieldName)) {
                aFieldNames.push(sFieldName);
              }
            }
          });
        });
        return aFieldNames.map(el => el != "MainService")
        // Get the form by its ID
        // let oForm = this.getView().byId("mainFormId");

        // // Get all form containers
        // let aFormContainers = oForm.getFormContainers();

        // // Iterate over each form container
        // aFormContainers.forEach(function (oFormContainer) {

        //   // Get the form elements within the container
        //   let aFormElements = oFormContainer.getFormElements();

        //   // Iterate over the form elements
        //   aFormElements.forEach(function (oFormElement) {

        //     // Get the fields (controls) within the form element
        //     let aFields = oFormElement.getFields();
        //     console.log({aFields})

        //     // Loop through the fields and set properties dynamically
        //     // aFields.forEach(function (oField) {
        //     //   // For example, you can make the field invisible or non-editable
        //     //   oField.setVisible(false);  // Set visible to false
        //     //   oField.setEditable(false); // Set editable to false
        //     // });
        //   });
        // });

      },


    });
  }
);
