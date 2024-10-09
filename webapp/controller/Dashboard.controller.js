sap.ui.define([
  "internal/controller/Helper/BaseController",
], function (BaseController) {
  "use strict";
  return BaseController.extend("internal.controller.Dashboard", {
    onInit: async function () {
      await BaseController.prototype.onInit.apply(this, []);

      this.pageName = 'Dashboard'
      this.mainEndPoint = this.endsPoints['NewRequest']
      this.mainTableModel = "mainTableModel"
      this.mainTableModel2 = "mainTableModel2"
      this.mainTableModel3 = "mainTableModel3"
      this.yearsListModel = "yearsListModel"


      this.getView().setModel(new sap.ui.model.json.JSONModel(this.getYearsList(2020)), this.yearsListModel);
      this.getView().setModel(new sap.ui.model.json.JSONModel(await this.getMainTableData()), this.mainTableModel)// Set
      this.getView().setModel(new sap.ui.model.json.JSONModel(this.functiontoSetInitialfilter(await this.chartData())), this.mainTableModel2);
      this.getView().setModel(new sap.ui.model.json.JSONModel(await this.chartData()), this.mainTableModel3); // Set oData Before Filter to Use it Again.

      var oVizFrame = this.byId("idColumnChart");

      oVizFrame.setVizProperties({
        title: {
          text: "Service Requests by Month"
        },
        plotArea: {
          dataLabel: {
            visible: true, // Enable data labels
          }
        },
        legend: {
          visible: true // Show legend with column names
        },
        valueAxis: {
          title: {
            visible: true,
            text: "Number of Requests" // Label for the Y-axis
          }
        },
        categoryAxis: {
          title: {
            visible: false,
            text: "" // Label for the X-axis
          }
        }
      });

      var oVizFrame = this.byId("idStackedColumnChart");

      oVizFrame.setVizProperties({
        title: {
          text: "Service Requests by Month"
        },
        plotArea: {
          dataLabel: {
            visible: true, // Enable data labels
          }
        },
        legend: {
          visible: true // Show legend with column names
        },
        valueAxis: {
          title: {
            visible: true,
            text: "Number of Requests" // Label for the Y-axis
          }
        },
        categoryAxis: {
          title: {
            visible: false,
            text: "" // Label for the X-axis
          }
        }
      });

    },

    getMainTableData: async function () {
      // let filter = { "name": "Id", "value": this.userInfo.empId }
      // let data = await this.crud_z.get_record(this.mainEndPoint, '', filter)

      let data = await this.crud_z.get_record(this.mainEndPoint)

      // var filteredRecords = data.results.filter(function (record) {
      //   return record.RequesterId == this.userInfo.empId;
      // }.bind(this));

      console.log(data.results)

      return data.results
    },

    getRandomCount: function (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Helper function to extract the month name
    getMonthName: function (date) {
      return date.toLocaleString('default', { month: 'long' });
    },

    //------------------------- Chart Data
    chartData: async function () {
     let StatusData = [
        { Month: "January", Pending: 5, Closed: 3, Rejected: 2, Year: "2023" },
        { Month: "February", Pending: 8, Closed: 6, Rejected: 4, Year: "2023" },
        { Month: "March", Pending: 6, Closed: 4, Rejected: 5, Year: "2023" },
        { Month: "April", Pending: 7, Closed: 5, Rejected: 3, Year: "2023" },
        { Month: "May", Pending: 9, Closed: 7, Rejected: 1, Year: "2023" },

        { Month: "January", Pending: 4, Closed: 2, Rejected: 3, Year: "2024" },
        { Month: "February", Pending: 7, Closed: 5, Rejected: 4, Year: "2024" },
        { Month: "March", Pending: 5, Closed: 3, Rejected: 4, Year: "2024" },
        { Month: "April", Pending: 6, Closed: 4, Rejected: 3, Year: "2024" },
        { Month: "May", Pending: 8, Closed: 6, Rejected: 2, Year: "2024" },
      ]
      // Sample data for the chart
      var oDatax = {
        StatusData: [
          { Month: "January", Pending: 5, Closed: 3, Rejected: 2, Year: "2023" },
          { Month: "February", Pending: 8, Closed: 6, Rejected: 4, Year: "2023" },
          { Month: "March", Pending: 6, Closed: 4, Rejected: 5, Year: "2023" },
          { Month: "April", Pending: 7, Closed: 5, Rejected: 3, Year: "2023" },
          { Month: "May", Pending: 9, Closed: 7, Rejected: 1, Year: "2023" },

          { Month: "January", Pending: 4, Closed: 2, Rejected: 3, Year: "2024" },
          { Month: "February", Pending: 7, Closed: 5, Rejected: 4, Year: "2024" },
          { Month: "March", Pending: 5, Closed: 3, Rejected: 4, Year: "2024" },
          { Month: "April", Pending: 6, Closed: 4, Rejected: 3, Year: "2024" },
          { Month: "May", Pending: 8, Closed: 6, Rejected: 2, Year: "2024" },
        ],

        ServicesData: [
          { Month: "January", Year: "2023", InternalAnnouncement: this.getRandomCount(1, 10), GraphicDesign: this.getRandomCount(1, 10), NadecHomePost: this.getRandomCount(1, 10), RevisionRequest: this.getRandomCount(1, 10) },
          { Month: "February", Year: "2023", InternalAnnouncement: this.getRandomCount(1, 10), GraphicDesign: this.getRandomCount(1, 10), NadecHomePost: this.getRandomCount(1, 10), RevisionRequest: this.getRandomCount(1, 10) },
          { Month: "March", Year: "2023", InternalAnnouncement: this.getRandomCount(1, 10), GraphicDesign: this.getRandomCount(1, 10), NadecHomePost: this.getRandomCount(1, 10), RevisionRequest: this.getRandomCount(1, 10) },
          { Month: "April", Year: "2023", InternalAnnouncement: this.getRandomCount(1, 10), GraphicDesign: this.getRandomCount(1, 10), NadecHomePost: this.getRandomCount(1, 10), RevisionRequest: this.getRandomCount(1, 10) },
          { Month: "May", Year: "2023", InternalAnnouncement: this.getRandomCount(1, 10), GraphicDesign: this.getRandomCount(1, 10), NadecHomePost: this.getRandomCount(1, 10), RevisionRequest: this.getRandomCount(1, 10) },

          { Month: "January", Year: "2024", InternalAnnouncement: this.getRandomCount(1, 10), GraphicDesign: this.getRandomCount(1, 10), NadecHomePost: this.getRandomCount(1, 10), RevisionRequest: this.getRandomCount(1, 10) },
          { Month: "February", Year: "2024", InternalAnnouncement: this.getRandomCount(1, 10), GraphicDesign: this.getRandomCount(1, 10), NadecHomePost: this.getRandomCount(1, 10), RevisionRequest: this.getRandomCount(1, 10) },
          { Month: "March", Year: "2024", InternalAnnouncement: this.getRandomCount(1, 10), GraphicDesign: this.getRandomCount(1, 10), NadecHomePost: this.getRandomCount(1, 10), RevisionRequest: this.getRandomCount(1, 10) },
          { Month: "April", Year: "2024", InternalAnnouncement: this.getRandomCount(1, 10), GraphicDesign: this.getRandomCount(1, 10), NadecHomePost: this.getRandomCount(1, 10), RevisionRequest: this.getRandomCount(1, 10) },
          { Month: "May", Year: "2024", InternalAnnouncement: this.getRandomCount(1, 10), GraphicDesign: this.getRandomCount(1, 10), NadecHomePost: this.getRandomCount(1, 10), RevisionRequest: this.getRandomCount(1, 10) },
        ]
      };

      // Initialize oData
      let oData = {
        StatusData: [],
        ServicesData: []
      };

      // Group data by Month and Year
      let dataArryObj = this.getView().getModel(this.mainTableModel).getData()
      console.log({ dataArryObj })
      const groupedData = dataArryObj.reduce((acc, request) => {
        const month = this.getMonthName(request.RequestDate);
        const year = request.RequestDate.getFullYear().toString();
        const key = `${month}-${year}`;

        // Initialize the month-year group if it doesn't exist
        if (!acc[key]) {
          acc[key] = {
            Month: month,
            Year: year,
            Pending: 0,
            Closed: 0,
            Rejected: 0,
            InternalAnnouncement: 0,
            GraphicDesign: 0,
            NadecHomePost: 0,
            RevisionRequest: 0
          };
        }

        // Count statuses
        if (request.Status === "Pending") {
          acc[key].Pending += 1;
        } else if (request.Status === "Closed") {
          acc[key].Closed += 1;
        } else if (request.Status === "Rejected") {
          acc[key].Rejected += 1;
        }

        // Count services based on MainService
        if (request.MainService === "Internal Announcement") {
          acc[key].InternalAnnouncement += 1;
        } else if (request.MainService === "Graphic Design") {
          acc[key].GraphicDesign += 1;
        } else if (request.MainService === "Nadec Home Post") {
          acc[key].NadecHomePost += 1;
        } else if (request.MainService === "Revision Request") {
          acc[key].RevisionRequest += 1;
        }

        return acc;
      }, {});

      // Populate oData with grouped status and services data
      Object.values(groupedData).forEach(group => {
        oData.StatusData.push({
          Month: group.Month,
          Year: group.Year,
          Pending: group.Pending,
          Closed: group.Closed,
          Rejected: group.Rejected
        });

        oData.ServicesData.push({
          Month: group.Month,
          Year: group.Year,
          InternalAnnouncement: group.InternalAnnouncement,
          GraphicDesign: group.GraphicDesign,
          NadecHomePost: group.NadecHomePost,
          RevisionRequest: group.RevisionRequest
        });
      });

      return oData                                                                       
    },

    // Function to filter data by year
    onChangeDateStatusData: function (ev) {
      this.changeDateForSelectedYear(ev, "StatusData")
    },

    // Function to filter data by year
    onChangeDateServicesData: function (ev) {
      this.changeDateForSelectedYear(ev, "ServicesData")
    },

    // Function to Set Initial filter data by year
    functiontoSetInitialfilter: function (oDatax) {
      const currentYear = new Date().getFullYear();

      // Assume your yearsListModel is already initialized
      var oModel = this.getView().getModel(this.yearsListModel);
      // Set the current year in the model to bind it to the selectedKey
      oModel.setProperty("/currentYear", currentYear);

      oDatax.StatusData = this.filterByYear(oDatax.StatusData, String(currentYear))
      oDatax.ServicesData = this.filterByYear(oDatax.ServicesData, String(currentYear))

      return oDatax
    },

    // Function to filter data by year
    changeDateForSelectedYear: function (ev, property) {
      // Get the selected item
      var selectedItem = ev.getSource().getSelectedItem();

      // Extract the selected key (which is the year in this case)
      var sYear = selectedItem.getKey();


      let mainTableModel2 = this.getView().getModel(this.mainTableModel2)
      let mainTableModel3 = this.getView().getModel(this.mainTableModel3)
      let dataIn = mainTableModel3.getData()

      let dataFilterd = this.filterByYear(dataIn[property], sYear)

      mainTableModel2.setProperty('/' + property, dataFilterd)
      console.log({ dataFilterd })
    },

    filterByYear: function (oData, year) {
      return oData.filter(function (data) {
        return data.Year === year;
      });
    },


  });
});
