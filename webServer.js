"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
var async = require('async');


// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');
var Comment = ('./schema/comment.js');

var express = require('express');
var app = express();


var session = require('express-session');
var bodyParser = require('body-parser');
var fs = require("fs");
var multer = require('multer');
var cs142password = require('./cs142password.js');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');


mongoose.connect('mongodb://localhost/cs142project6');


app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());
app.use(express.static(__dirname));

session.user_id = "";


app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.send(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send("You don't have the authority.");
        return;
    }
    User.find({},function (err,userList) {
        if (err){
            response.status(400).send(JSON.stringify(err));
            return ;
        }
        var photoNum = [];

        // !!!important
        var userList2 = JSON.parse(JSON.stringify(userList));
        async.each(userList2,function (user,callback){
            Photo.find({user_id:user._id},function (err,photos) {
                if (err){
                    console.log("User" + user + "has no photos.");
                }
                // This part is built by myself to record how many times a photo has been viewed
                // I have to comment it temporarily for submitting the homework

                user.photoLength = photos.length;
                photoNum.push(photos.length);
                callback();
            });
            // Comment.find({user_id:user._id},function (err,comments) {
            //     if (err){
            //         console.log("User" + user + "has no photos.");
            //     }
            //     user.commentLength = comments.length;
            //     alert(comments.length);
            //     photoNum.push(comments.length);
            //     callback();
            // });
        },function (err) {
            response.status(200).send(userList2);
        });
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send('unauthorized');
        return;
    }
    var id = request.params.id;
    var send_body = {};
    User.findOne({'_id':id},function (err,userDetail) {
        if (err){
            response.status(400).send(JSON.stringify(err));
            return;
        } else if (userDetail === null){
            console.log('User with _id:' + id + ' not found.');
            response.status(400).send('Not found');
            return;
        }
        //request.session.user_id = userDetail._id;
        send_body.userDetail = userDetail;

    }).then(function () {
        Photo.find({'user_id': id}, function(err, photoList) {
            if (err) {
                response.status(400).send(JSON.stringify(err));
                return;
            }
            var mostRecentlyPhoto = {};
            var mostCommentsPhoto = {};
            var commentNum = 0;
            if (photoList.length > 0){
                mostRecentlyPhoto = photoList.slice(-1);
                send_body.mostRecentlyPhoto = mostRecentlyPhoto;
                var photos = JSON.parse(JSON.stringify(photoList));
                async.each(photos,function (photo,photo_callback) {
                    if (photo.comments.length > commentNum){
                        commentNum = photo.comments.length;
                        mostCommentsPhoto = photo;
                        send_body.mostCommentsPhoto = mostCommentsPhoto;
                    }
                    photo_callback();
                },function (err) {
                    if (err){
                        response.status(400).send(JSON.stringify(err));
                    }
                });
            }
        });
    }).then(function () {
        console.log(send_body);
        response.status(200).send(send_body);
    });
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
    if (!request.session.user_id) {
        response.status(401).send('unauthorized');
        return;
    }
    var user_id = request.params.id;
    Photo.find({'user_id': user_id}, function(err, photoList) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (!photoList) {
            console.log('Photos for user with _id:' + user_id + ' not found.');
            response.status(400).send('Not found');
            return;
        }
        var photos = JSON.parse(JSON.stringify(photoList));
        async.each(photos,function (photo,photo_callback) {
            var comments = photo.comments;
            photo.date_time = changeDateFormat(photo.date_time);
            async.each(comments,function (comment,comment_callback) {
                User.findOne({'_id':comment.user_id},function (err,commentator) {
                    if (err) {
                        console.log('Database find() returned error:');
                        console.log(JSON.stringify(err));
                    } else if (commentator === null) {
                        console.log('User with _id:' + comments.user_id + ' not found.');
                    } else {
                        comment.date_time = changeDateFormat(comment.date_time);
                        comment.user = commentator;
                        comment_callback();
                    }
                });
            },function (err) {
                if (err) {
                    console.log("Failed to import the comments.");
                } else {
                    photo_callback();
                }
            });
        },function (err) {
            if (err){
                response.status(400).send(JSON.stringify(err));
            } else {
                response.status(200).send(photos);
            }
        });
    });
});

app.post('/admin/login', function(request, response) {
    // test
    if (!request.body.login_name){
        return;
    }
    if(request.session.user_id){
        User.findOne({_id:request.session.user_id},function (err,user) {
            if (err){
                request.status(400).send();
            }
            response.status(200).send(user);
        });
        return;
    }
    if (request.body.login_name === "session"){
        return;
    }
    //
    User.findOne({login_name: request.body.login_name}, function(err, user) {
        if (user !== null) {
            if(cs142password.doesPasswordMatch(user.password_digest, user.salt, request.body.password)){
                request.session.user_id = user._id;
                session.user_id = user._id;
                response.status(200).send(user);
            } else {
                response.status(400).send("Password is not correct!");
            }
        } else {
            response.status(400).send(request.body.login_name + " is not a valid account");
        }
    });
});

app.post('/admin/logout', function(request, response) {
    if (request.session.user_id) {
        request.session.destroy(function(err) {} );
        session.user_id = "";
        response.status(200).send();
    } else {
        response.status(400).send("No user currently logged in");
    }
});

app.post('/user', function(request, response) {
    var userName = request.body.userName;
    if (userName === undefined){
        response.status(400).send("userName cannot be undefined.");
        return;
    }
    User.findOne({login_name: userName}, function(err, user) {
        if (user !== null) {
            console.log(userName + " already exists.");
            response.status(400).send(userName + " already exists.");
            return;
        }
        var password = cs142password.makePasswordEntry(request.body.password);
        var newUser = {
            login_name: request.body.userName,
            first_name: request.body.firstName,
            last_name: request.body.lastName,
            description: request.body.description,
            location: request.body.location,
            occupation: request.body.occupation,
            password_digest: password.hash,
            salt: password.salt
        };

        User.create(newUser, function(err, createdUser) {
            if (err) {
                response.status(400).send(JSON.stringify(err));
                return;
            }
            request.session.user_id = createdUser._id;
            session.user_id = createdUser._id;

            console.log(createdUser._id);

            response.status(200).send(createdUser);
            /* This is used to list all the information of the users */
            // User.find({}, function(err,users) {
            //     console.log(users);
            // });
        });
    });
});

var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');
app.post('/photos/new', function(request, response) {
    processFormBody(request, response, function (err) {
        if (err || !request.file) {
            response.status(400).send("no file");
            return;
        }

        if(request.file.fieldname !== "uploadedphoto") {
            response.status(400).send("no file");
            return;
        }
        // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        var timestamp = new Date().valueOf();
        var filename = 'U' +  String(timestamp) + request.file.originalname;

        fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
            // XXX - Once you have the file written into your images directory under the name
            // filename you can create the Photo object in the database
            if (err) {
                console.log(err);
                response.status(400).send("Error uploading photo");
            }
            var newPhoto = {
                file_name: filename,
                user_id: request.session.user_id,
                comments: []
            };
            Photo.create(newPhoto, function(err, createdPhoto) {
                if (err) {
                    console.log(err);
                    response.status(400).send("Error uploading photo");
                }
                response.status(200).send(createdPhoto);
            });
        });
    });
});

app.post('/commentsOfPhoto/:photo_id', function(request, response) {
    if (!request.session.user_id) {
        response.status(401).send('unauthorized');
        return;
    }

    var user_id = request.session.user_id;
    var photo_id = request.params.photo_id;
    var comment = request.body.comment;

    // Your implementation should reject any empty comments with a status of 400 (Bad request)
    if (!comment) {
        console.log("The comment is empty!");
        response.status(400).send("The comment is empty!");
    } else {
        Photo.findOne({_id: photo_id}, function(err, photo) {
            if (!err) {
                photo.comments.push({comment: comment, user_id: user_id});
                photo.save();
                console.log(photo);
                response.status(200).send();
            } else {
                console.log("Photo does not exist");
                response.status(400).send("Photo does not exist");
            }
        });
    }
});

app.post('/deletePhoto', function(request, response) {
    var photo_id = request.body.photo_id;
    var user_id = request.session.user_id;

    Photo.findOne({_id: photo_id}, function(err, photo) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (photo === null) {
            response.status(400).send("No such photo!");
            return;
        }
        if (!photo.user_id.equals(user_id)){
            // === is not useful here and I don't know why
            console.log(photo.user_id + " " + user_id);
            response.status(400).send("Have no authorities!");
            return;
        }
        Photo.remove({_id: photo_id}, function(err) {
            // this part is necessary!
        });
        response.status(200).end();
    });
});

app.post('/deleteComment', function(request, response) {
    var comment_id = request.body.comment_id;
    var photo_id = request.body.photo_id;
    var user_id = request.session.user_id;

    Photo.findOne({_id: photo_id}, function(err, photo) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (photo === null) {
            response.status(400).send("No such photo!");
            return;
        }

        for (var index = 0; index < photo.comments.length; index++){
            if (photo.comments[index]._id.equals(comment_id)){
                break;
            }
        }
        if (index !== photo.comments.length){
            photo.comments.splice(index,1);
            photo.save();
            response.status(200).end();
        } else {
            response.status(400).send("No such comment!");
        }
    });
});


// This part is built by myself to record how many times a photo has been viewed
// I hope it will not be counted as an extra property
// Oh, I think I have to comment this paragraph temporarily

app.post('/photoView', function(request, response) {
    var photo_id = request.body.photo_id;
    Photo.findOne({_id: photo_id}, function(err, photo) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (photo === null) {
            response.status(400).send("No such photo!");
            return;
        }
        photo.view_times++;
        photo.save();
        response.status(200).end();
    });
});

app.post('/likePhoto', function(request, response) {
    var photo_id = request.body.photo_id;
    var user_id = request.session.user_id;

    Photo.findOne({_id: photo_id}, function(err, photo) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (photo.dislike_user_ids.indexOf(user_id) >= 0){
            response.status(400).send("You have already disliked this photo.");
            return;
        }
        if (photo.like_user_ids.indexOf(user_id) >= 0) {
            photo.like_num -= 1;
            photo.like_user_ids.remove(user_id);
        } else {
            photo.like_num += 1;
            photo.like_user_ids.push(user_id);
        }
        photo.save();
        response.status(200).send();
    });
});

app.post('/dislikePhoto', function(request, response) {
    var photo_id = request.body.photo_id;
    var user_id = request.session.user_id;

    Photo.findOne({_id: photo_id}, function(err, photo) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (photo.like_user_ids.indexOf(user_id) >= 0){
            response.status(400).send("You have already liked this photo.");
            return;
        }
        if (photo.dislike_user_ids.indexOf(user_id) >= 0) {
            photo.dislike_num -= 1;
            photo.dislike_user_ids.remove(user_id);
        } else {
            photo.dislike_num += 1;
            photo.dislike_user_ids.push(user_id);
        }
        photo.save();
        response.status(200).send();
    });
});

//2013-12-04T21:12:00.000Z
function changeDateFormat(dateTime) {
    if (dateTime.length > 25){
        var first = dateTime.slice(4,10);
        var second = dateTime.slice(11,24);
        return first + " " + second;
    }
    return dateTime;
}


var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});


// This part is for password salt

// var crypto = require('crypto');
// function makePasswordEntry(clearTextPassword) {
//     var hash = crypto.createHash('sha1');
//     var salt = crypto.randomBytes(8).toString('hex');
//     hash.update(clearTextPassword + salt);
//     return {
//         salt: salt,
//         hash: hash.digest('hex')
//     };
// }
//
// /*
//  * Return true if the specified clear text password
//  * and salt generates the specified hash.
//  * @param {string} hash
//  * @param {string} salt
//  * @param {string} clearTextPassword
//  * @return {boolean}
//  */
// function doesPasswordMatch(hash, salt, clearTextPassword) {
//     var hash2 = crypto.createHash('sha1');
//     hash2.update(clearTextPassword + salt);
//     var password = hash2.digest('hex');
//     return password === hash;
// }

