const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

// Fix: Use parameterized queries instead of string concatenation
const UserDAO = function(db) {
    "use strict";

    if (!db) {
        console.log("Error: The database is not connected.");
    }

    this.getUsers = function(callback) {
        "use strict";
        
        const query = {};
        db.collection("users").find(query).toArray(function(err, items) {
            if (err) return callback(err, null);
            callback(null, items);
        });
    };

    this.addUser = function(userName, firstName, lastName, email, password, callback) {
        "use strict";
        
        // Hash password before storing
        bcrypt.hash(password, 12, function(err, hashedPassword) {
            if (err) return callback(err, null);
            
            const user = {
                userName: userName,
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: hashedPassword,
                benefitStartDate: new Date(),
                createdDate: new Date()
            };

            db.collection("users").insertOne(user, function(err, result) {
                if (err) return callback(err, null);
                callback(null, result);
            });
        });
    };

    this.validateLogin = function(userName, password, callback) {
        "use strict";
        
        // Use exact match query - no regex to prevent injection
        const query = { userName: userName };
        
        db.collection("users").findOne(query, function(err, user) {
            if (err) return callback(err, null);
            if (!user) return callback(null, null);
            
            // Compare hashed password
            bcrypt.compare(password, user.password, function(err, isMatch) {
                if (err) return callback(err, null);
                if (isMatch) {
                    callback(null, user);
                } else {
                    callback(null, null);
                }
            });
        });
    };

    this.getUserById = function(userId, callback) {
        "use strict";
        
        // Validate ObjectId format
        if (!ObjectId.isValid(userId)) {
            return callback(new Error('Invalid user ID format'), null);
        }
        
        const query = { _id: new ObjectId(userId) };
        
        db.collection("users").findOne(query, function(err, user) {
            if (err) return callback(err, null);
            callback(null, user);
        });
    };

    this.getUserByUserName = function(userName, callback) {
        "use strict";
        
        const query = { userName: userName };
        
        db.collection("users").findOne(query, function(err, user) {
            if (err) return callback(err, null);
            callback(null, user);
        });
    };

    this.updateUser = function(userId, firstName, lastName, callback) {
        "use strict";
        
        // Validate ObjectId format
        if (!ObjectId.isValid(userId)) {
            return callback(new Error('Invalid user ID format'), null);
        }
        
        const query = { _id: new ObjectId(userId) };
        const update = {
            $set: {
                firstName: firstName,
                lastName: lastName,
                lastModified: new Date()
            }
        };
        
        db.collection("users").updateOne(query, update, function(err, result) {
            if (err) return callback(err, null);
            callback(null, result);
        });
    };
};

module.exports.UserDAO = UserDAO;
