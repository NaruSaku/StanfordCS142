"use strict";
/*
 *  Defined the Mongoose Schema and return a Model for a User
 */
/* jshint node: true */

var mongoose = require('mongoose');

// create a schema
var userSchema = new mongoose.Schema({
    first_name: {type:String,text:true}, // First name of the user.
    last_name: String,  // Last name of the user.
    location: String,    // Location  of the user.
    description: String,  // A brief user description
    occupation: String,    // Occupation of the user.
    login_name: String,
    password_digest: String,
    salt: String,
    recentActivity: {type:String,default:"registered as a user"},
    recently_upload_photo: {type:Boolean,default:false},
    recent_uploaded_photo:String,
    photo_liked_list:{type:[String],default:[]},
    photo_disliked_list:{type:[String],default:[]},
    favorite_photos:{type:[String],default:[]}
});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;
