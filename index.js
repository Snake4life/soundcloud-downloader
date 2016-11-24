var express = require('express');
var request = require('request');
var path = require('path');
var http = require('http');
var fs = require('fs');
var ID3Writer = require('browser-id3-writer');
var soundrain = require('soundrain');
var exec = require('child_process').exec;
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
    var exePath = path.resolve(__dirname, './youtube-dl');
    console.log("path: " + exePath);
    fs.chmodSync('youtube-dl', 0777);
    exec(exePath + " https://soundcloud.com/sanholobeats/light", function (error, stdout, stderr) {
        if (error) {
            console.log(error);
            throw error;
        }
        console.log(stdout);
        var dest = stdout.split("Destination: ")[1];
        console.log("dest: " + dest + "<<");
        var other = dest.replace(dest.split(".mp3")[1], "");
        console.log("other: " + other + "<<");

        var songBuffer = fs.readFileSync(__dirname + "/" + other);
        var coverBuffer = fs.readFileSync(__dirname + "/light.jpg");

        var writer = new ID3Writer(songBuffer);
        writer.setFrame('TIT2', 'Light')
            .setFrame('TPE1', ['San Holo'])
            .setFrame('TALB', 'Light')
            .setFrame('TCON', ['Future Bass'])
            .setFrame('APIC', coverBuffer);
        writer.addTag();

        var taggedSongBuffer = new Buffer(writer.arrayBuffer);
        fs.writeFileSync('San Holo - Light.mp3', taggedSongBuffer);
        
        var file = __dirname + '/San Holo - Light.mp3';
        res.download(file);
    });
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});