var app = require('express')();
var server = require('http').createServer(app);
// var record = [];
var counter = 0;
var URL_REGEX = /^https?:\/\/w{3}\.\w+\..*/;
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = process.env.MONGO_URI;
var collection;

app.get('/new/*', function(req, res) {
    var url = req.url.substring(5);
    if (!URL_REGEX.test(url)) {
        res.send({
            error: 'Invalid URL'
        });
        return;
    }
    var host = req.headers.host;
    var protocol = req.secure ? 'https://' : 'http://';
    var newUrl = protocol + host + '/' + counter;
    // does not know if there is an err or not
    pushToDataBase(counter, url);
    counter++;
    res.send({
        'original_url':url,
        'short_url': newUrl
    });
});

app.get('/:id', function(req, res) {
    var id = parseInt(req.params.id);
    findElement(id).then(function(arr) {
        if (arr.length) {
            res.redirect(302, arr[0].url);
        } else {
            res.send({
                error: 'Url Not Found'
            });
        }
    });
});

MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
    return;
  } else {
    console.log('Connection established to', url);
    collection = db.collection('url');
    getCounter().then(function(arr) {
        if (arr.length) {
            counter = arr[0]._id;
        } else {
            counter = 0;
        }
    })
    initServer();
  }
});

function getCounter() {
    return collection.find().sort({_id:-1}).limit(1).toArray();
}

function pushToDataBase(id, val) {
    return collection.insert({
        _id: id,
        url: val
    });;
}

function findElement(id) {
    return collection.find({
        _id: id
    }).toArray();
}

function initServer() {
    server.listen(process.env.PORT || 3000, process.env.IP || '0.0.0.0', function(){
      var addr = server.address();
      console.log('server listening at', addr.address + ':' + addr.port);
    });
}
