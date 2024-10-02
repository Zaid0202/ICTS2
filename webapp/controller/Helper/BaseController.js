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
        
        console.log("View: ", this.getView());
        console.log("ownerComponent: ", ownerComponent);
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
        var userData = await this.getOwnerComponent().getUserData();
        if (!userData) {
          console.log("NO Uset Data!")
        }
        this.userInfo = userData.userInfo
        this.userId = userData.empId
        this.sUserRole = userData.role
        console.log("BaseController -> this.userInfo", this.userInfo)
        console.log("BaseController -> this.sUserRole", this.sUserRole)

        //--------------------------------


        this.helperModel = 'helperModel'
        this.getView()?.setModel(new sap.ui.model.json.JSONModel({}), this.helperModel)
        this.helperModelInstance = this.getView()?.getModel(this.helperModel)
        this.setMode('Create')
        console.log("Finsh THe Base Controller: ");

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
        // let nameMatch = statusDisplay.match(/Forwarded to\s(.*?)\s*\(/); // Approved Rejected Returned Closed
        let nameMatch = statusDisplay.match(/(?:Forwarded to|Approved by|Rejected by|Returned by|Closed by)\s*(.*?)\s*\(/);
        console.log({ nameMatch })
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
        return oDateFormat.format(oDate);
      },

      formatIdToCustomPattern: function (Id) {
        if (!Id) {
          return ""; // Return an empty string if no date is provided
        }
        return "#" + Number(Id)
      },

      /// 
      camelCaseToNormal: function (camelCaseStr) {
        return camelCaseStr.replace(/([a-z])([A-Z])/g, '$1 $2');
      },

      deepMerge: function (target, source) {
        // Ensure both target and source are objects
        if (typeof target !== 'object' || target === null) {
          target = {};
        }

        if (typeof source !== 'object' || source === null) {
          return target; // Nothing to merge if source is not an object
        }

        for (let key in source) {
          // Check if the source value is an object and if the key exists in both target and source
          if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
            // Recursively merge objects
            target[key] = this.deepMerge(target[key], source[key]);
          } else {
            // Otherwise, assign the source value to the target
            target[key] = source[key];
          }
        }

        return target; // Return the merged object
      }



    });
  }
);
