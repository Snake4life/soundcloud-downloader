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

app.get('/getSound', function (req, res) {
    var query = require('url').parse(req.url, true).query;
    var link = query.link;
    var artist = query.artist;
    var title = query.title;
    var genre = query.genre;
    var album = query.album;
    var album_art = query.album_art;

    var exePath = path.resolve(__dirname, './youtube-dl');
    console.log("path: " + exePath);
    fs.chmodSync('youtube-dl', 0777);

    exec(exePath + " " + link, function (error, stdout, stderr) {
        if (error) {
            console.log(error);
            throw error;
        }
        console.log(stdout);

        var dest = stdout.split("Destination: ")[1];
        dest = dest.replace(dest.split(".mp3")[1], "");

        options = {
            url: album_art,
            dest: __dirname + "/album_art.jpg",
            done: function (err, filename, image) {
                if (err) {
                    throw err;
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

                var file = __dirname + "/" + artist + " - " + title + '.mp3';
                res.download(file);
            },
        };
        image_downloader(options);
    });
});

/*
array of strings:

TPE1 (song artists)
TCOM (song composers)
TCON (song genres)

string

TIT2 (song title)
TALB (album title)
TPE2 (album artist)
TRCK (song number in album): '5' or '5/10'
TPOS (album disc number): '1' or '1/3'
USLT (unsychronised lyrics)
TPUB (label name)

integer

TLEN (song duration in milliseconds)
TYER (album release year)

arrayBuffer

APIC (song cover): works with jpeg, png, gif, webp, tiff, bmp and ico
*/

app.use(function(req, res, next) {
  var allowedOrigins = ['https://revengex-benjoha123.c9users.io', 'http://revengexstorm.com', 'http://www.revengexstorm.com'];
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
       res.setHeader('Access-Control-Allow-Origin', origin);
  }
  //res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:8020');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  return next();
});

app.get('/password', function (req, res) {
    var query = require('url').parse(req.url, true).query;
    var pass = query.password;
    console.log(pass);

    var result = pass == "divineinformation";
    console.log(result);

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
        result: result
    }, null, 3));
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});