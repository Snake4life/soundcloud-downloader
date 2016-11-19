var express = require('express');
var request = require('request');
var http = require('http');
var fs = require('fs');
var soundrain = require('soundrain');
var metaEdit = require('ffmetadata');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function (request, response) {
    console.log("Welcome to homepage");
    response.render('pages/index');
});

app.get('/getSound', function (req, res) {
    var Song = new soundrain("https://soundcloud.com/nocopyrightsounds/geoxor-you-i-ncs-release", './mp3');
    Song.on('error', function (err) {
        console.log("ERRORROR");
        if (err) throw err;
    }).on('done', function (file) {
        console.log(file);
    });

    const testFolder = './mp3';
    const fs = require('fs');
    fs.readdir(testFolder, (err, files) => {
        files.forEach(file => {
            console.log(file);
        });
    })

    /*
    ffmetadata.read("song.mp3", function (err, data) {
        if (err) console.error("Error reading metadata", err);
        else console.log(data);
    });

    // Set the artist for song.mp3 
    var data = {
        artist: "Me",
    };
    ffmetadata.write("song.mp3", data, function (err) {
        if (err) console.error("Error writing metadata", err);
        else console.log("Data written");
    });
    */

});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});