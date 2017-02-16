const curl = require('curlrequest');
var express = require('express');
var path = require('path');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var cors  = require('cors');

var app = express();
var agent = require('./server/agent');
var database = require('./server/database')('restapi' , app);

var bucketExplorer;
var ipSource;
var visitor;
var ipDump;


//init database get the urls specific to this session then run ipSource
database.initColls(function(){
	ipDump = require('./server/dump')(database);
    ipSource = require('./server/ipSource')(ipDump);
    
    ipSource.on('ip' , function(ip){
        console.log(ip);
    });
	
	// Bootstrap express app
	app.use(cors({credentials: true, origin: true}));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended:true}));

	app.use('/api' , require('./server/api')(database , visitor));
	app.use(express.static(path.join(__dirname , 'public')));

	//Start the main Express server
	app.listen((process.env.PORT || 5004), function() {
	    console.log("Listening on " + (process.env.PORT || 5004));
	});
});
