/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"internal_communication_ticketing/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
