sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "internal/controller/Helper/CRUD_z",
    "internal/controller/Helper/UiTableFSG",
    "internal/controller/Helper/Validation_z",

  ],
  function (BaseController, JSONModel, CRUD_z, UiTableFSG, Validation_z, UserService) {
    "use strict";

    return BaseController.extend("internal.controller.Helper.BaseController", {
      onInit: async function () {
        UiTableFSG.prototype.onInit.apply(this, []);

        this.endsPoints = this.getOwnerComponent().getModel("endsPoints").getData()

        this.uiTableFSG = new UiTableFSG(this)

        this.crud_z = new CRUD_z(this)
        this.mainOModel = this.crud_z.oModel;

        this.validation_z = new Validation_z()

        //--------------------------------
        // Get the model globally
        this.userInfo = this.getOwnerComponent().getUserD_f();
        this.userId = this.userInfo.empId;
        // this.userInfoWithRequestTamp = this.getOwnerComponent().getUserInfoWithRequestTamp_f();

        // console.log("userD", this.userInfo)
        // console.log("userInfoWithRequestTamp", this.userInfoWithRequestTamp)
        //--------------------------------


        this.helperModel = 'helperModel'
        this.getView().setModel(new sap.ui.model.json.JSONModel({}), this.helperModel)
        this.helperModelInstance = this.getView().getModel(this.helperModel)
        this.setMode('Create')
        console.log("Finsh Init BaseController ")
      },

      setMode: function (mode) {
        this.helperModelInstance.setProperty('/Mode', mode)
      },
      
      getMode: function () {
        return this.helperModelInstance.getData().Mode
      },

      oPayload_modify_parent: function (oPayload) {
        const isEdit = this.getMode() == "Edit" ? true : false

        oPayload.Id = isEdit ? oPayload.Id : "0000000000"
        oPayload.CreatedDate = isEdit ? new Date(oPayload.CreatedDate) : new Date()
        oPayload.UpdatedDate = new Date()

        if ('__metadata' in oPayload) {
          delete oPayload['__metadata'];
        }

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
              }
            }
          }
        }
        return obj;
      },

      setBusy: function (id, status) {
        this.getView().byId(id).setBusy(status);
      },

      extractNameFromStatusDisplay: function (statusDisplay) {
        // Regular expression to extract the name
        // let nameMatch = statusDisplay.match(/Forwarded to\s(.*?)\s*\(/); // Approved Rejected Returned Closed
        let nameMatch = statusDisplay.match(/(?:Forwarded to|Approved by|Rejected by|Returned by|Closed by)\s*(.*?)\s*\(/);
        console.log({nameMatch})
        // Return the extracted name or null if not found
        return nameMatch ? nameMatch[1] : "Employee Name not found!";
      },


    });
  }
);
