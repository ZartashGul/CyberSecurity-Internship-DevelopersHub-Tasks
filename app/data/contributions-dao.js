const { ObjectId } = require('mongodb');

const ContributionsDAO = function(db) {
    "use strict";

    if (!db) {
        console.log("Error: The database is not connected.");
    }

    this.update = function(userId, pretax, roth, callback) {
        "use strict";
        
        // Validate ObjectId format
        if (!ObjectId.isValid(userId)) {
            return callback(new Error('Invalid user ID format'), null);
        }
        
        // Validate numeric inputs
        if (isNaN(pretax) || isNaN(roth) || pretax < 0 || roth < 0) {
            return callback
