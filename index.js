var express = require('express');
var request = require('request');
var path = require('path');
var http = require('http');
var fs = require('fs');
var ID3Writer = require('browser-id3-writer');
var image_downloader = require('image-downloader');
var exec = require('child_process').exec;
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

function returnError(message) {
    var error = {
        error: "true",
        message: message
    }
    return JSON.stringify(error);
}

app.get('/getSound', function (req, res) {
    var query = require('url').parse(req.url, true).query;
    var link = query.link;
    var artist = query.artist;
    var title = query.title;
    var genre = query.genre;
    var album = query.album;
    var album_art = query.album_art;

    if (isNaN(album_art)) {
        res.end(returnError("Please give an album art"));
        console.log("/getSound :: No album art: " + album_art);
        return;
    }

    if (isNaN(link)) {
        res.end(returnError("No song link given"));
        console.log("/getSound :: No link to the song: " + link);
        return;
    }

    if (isNaN(artist)) artist = "";
    if (isNaN(title)) title = "";
    if (isNaN(genre)) genre = "";
    if (isNaN(album)) album = "";

    var exePath = path.resolve(__dirname, './youtube-dl');
    console.log("path: " + exePath);
    fs.chmodSync('youtube-dl', 0777);

    exec(exePath + " " + link, function (error, stdout, stderr) {
        if (error) {
            res.end(returnError(error.message));
            console.log("/getSound :: Error running command: " + error.message);
            return;
        }
        console.log(stdout);

        var dest = stdout.split("Destination: ")[1];
        dest = dest.replace(dest.split(".mp3")[1], "");

        var options = {
            dest: __dirname + "/album_art.jpg",
            url: album_art,
            done: function (err, filename, image) {
                if (err) {
                    res.end(returnError(error.message));
                    console.log("/getSound :: Error getting album art: " + error.message);
                    return;
                }
                console.log('Album cover saved to', filename);
                var songBuffer = fs.readFileSync(__dirname + "/" + dest);
                var coverBuffer = fs.readFileSync(__dirname + "/album_art.jpg");

                var writer = new ID3Writer(songBuffer);
                writer.setFrame('TIT2', title)
                    .setFrame('TPE1', [artist])
                    .setFrame('TALB', album)
                    .setFrame('TCON', [genre])
                    .setFrame('APIC', coverBuffer);
                writer.addTag();

                var taggedSongBuffer = new Buffer(writer.arrayBuffer);
                fs.writeFileSync(artist + " - " + title + '.mp3', taggedSongBuffer);

                var file = (__dirname + "/" + artist + " - " + title + '.mp3');
                res.download(file, function (err) {
                    fs.unlink(file);
                    res.end();
                });
            }
        };

        image_downloader(options);
    });
});

app.get('/files', function (req, res) {
    fs.readdir('/app/', (err, files) => {
        files.forEach(file => {
            console.log(file);
        });
    });
});

app.use(function (req, res, next) {
    var allowedOrigins = ['https://revengex-benjoha123.c9users.io', 'http://revengexstorm.com', 'http://www.revengexstorm.com', 'chrome-extension://hadkalgleneamjcagnipddfcekkocbkg'];
    var origin = req.headers.origin;
    if (allowedOrigins.indexOf(origin) > -1) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    //res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:8020');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', true);
    return next();
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});