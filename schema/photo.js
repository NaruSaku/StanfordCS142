"use strict";

/*
 * Defined the Mongoose Schema and return a Model for a Photo
 */

/* jshint node: true */

var mongoose = require('mongoose');

/*
 * Photo can have comments and we stored them in the Photo object itself using
 * this Schema:
 */
var commentSchema = new mongoose.Schema({
    comment: String,     // The text of the comment.
    date_time: {type: String, default: new Date().toLocaleString()}, // The date and time when the comment was created.
    user_id: mongoose.Schema.Types.ObjectId,    // 	The ID of the user who created the comment.
});

// create a schema for Photo
var photoSchema = new mongoose.Schema({
    file_name: String, // 	Name of a file containing the actual photo (in the directory project6/images).
    view_times:{type: Number, default:1},   // This part is added by myself
    date_time: {type: String, default: new Date().toLocaleString()}, // 	The date and time when the photo was added to the database
    user_id: mongoose.Schema.Types.ObjectId, // The ID of the user who created the photo.
    comments: [commentSchema], // Array of comment objects representing the comments made on this photo.
    like_num: {type: Number, default: 0},
    dislike_num: {type: Number, default: 0},
    like_user_ids: {type:[mongoose.Schema.Types.ObjectId], default: []},
    dislike_user_ids: {type:[mongoose.Schema.Types.ObjectId], default: []}
});

// the schema is useless so far
// we need to create a model using it
var Photo = mongoose.model('Photo', photoSchema);

// make this available to our photos in our Node applications
module.exports = Photo;
