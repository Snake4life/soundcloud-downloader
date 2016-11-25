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

        var songBuffer = fs.readFileSync(__dirname + "/" + dest);
        var coverBuffer = fs.readFileSync(album_art);

        var writer = new ID3Writer(songBuffer);
        writer.setFrame('TIT2', title)
            .setFrame('TPE1', [artist])
            .setFrame('TALB', album)
            .setFrame('TCON', [genre])
            .setFrame('APIC', coverBuffer);
        writer.addTag();

        var taggedSongBuffer = new Buffer(writer.arrayBuffer);
        fs.writeFileSync(artist + " - " + title + '.mp3', taggedSongBuffer);
        
        var file = __dirname + artist + " - " + title + '.mp3';
        res.download(file);
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

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});