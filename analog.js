
/*

MRAA - Low Level Skeleton Library for Communication on GNU/Linux platforms
Library in C/C++ to interface with Galileo & other Intel platforms, in a structured and sane API with port nanmes/numbering that match boards & with bindings to javascript & python.

Steps for installing MRAA & UPM Library on Intel IoT Platform with IoTDevKit Linux* image
Using a ssh client: 
1. echo "src maa-upm http://iotdk.intel.com/repos/1.1/intelgalactic" > /etc/opkg/intel-iotdk.conf
2. opkg update
3. opkg upgrade

Article: https://software.intel.com/en-us/html5/articles/intel-xdk-iot-edition-nodejs-templates
*/



var alertPhoneNumber=[phoneNumberGoesHere];

function twilioCall () {
  // Twilio Credentials 

  if (process.env.accountSid) {
    var accountSid = process.env.accountSid;
    var authToken = process.env.authToken;
     
    //require the Twilio module and create a REST client 
    var client = require('twilio')(accountSid, authToken); 
    
    for (var i = alertPhoneNumber.length - 1; i >= 0; i--) {
      console.log("Calling number " + alertPhoneNumber[i]);
      
      client.calls.create({ 
          to: alertPhoneNumber[i], 
          from: process.env.twilioFrom,  
          applicationSid: process.env.applicationSid,
          method: "GET",  
          fallbackMethod: "GET",  
          statusCallbackMethod: "GET",    
          record: "false" 
        }, function(err, call) { 
          console.log(call.sid); 
        });
    }; 
  } else {
    console.log("Twilio details are missing");
  }
}

function lifxBlink () {

  // LIFX.js
  var lifx = require('lifx');
  var lx   = lifx.init();

  var livingRoomBulb;
  var intervalID;
  var i=0;

  var delay=2000;


  function colourRed(bulb) {
    lx.lightsOn(bulb);
    lx.lightsColour(65535, 65535,     65535,    0x0dac,      0x0513, bulb);
    console.log("Color Red");
    return;
  }

  function colourBlue(bulb) {
    lx.lightsColour(32949, 39976,     39976,    0x0dac,      0x0513,bulb);
    console.log("Color Blue");
    return;

  }

  function switchOff(bulb) {
    setTimeout(function() {}, delay/2);
    lx.lightsOff(bulb);
    console.log("lightsOff");
    return;
  }
  function repeatMe() {
    
    

    if (lx.bulbs.length > 0) {
      for (var i = 0; i < lx.bulbs.length; i++) {
          var myBulb = lx.bulbs[i];
        console.log(myBulb["name"]);

        if (myBulb["name"] == "Living Room") {
          livingRoomBulb = myBulb;
          intervalID= setInterval(function() {blink();},delay);

        }
        
      }
      return;
    }

    if (lx.bulbs.length==0) {
      setTimeout(repeatMe , 1000);
    }
    return;
  }


  repeatMe();

  function blink() {
    i++
    lx.lightsOn(livingRoomBulb);
    colourRed(livingRoomBulb);
    setTimeout(function() {switchOff(livingRoomBulb);}, delay/2);
    // setTimeout(function() {blink();},3000);

    if (i>9) {
      clearInterval(intervalID);
    }
  }

}



var ngrok = require('ngrok');
var restify = require('restify');


ngrok.connect(8080, function (err, url) {
	console.log(url);
});

var mraa = require('mraa'); //require mraa

console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the console

var analogPin0 = new mraa.Aio(0); //setup access analog input Analog pin #0 (A0)

var  analogValue = analogPin0.read(); //read the value of the analog pin
runLoop();

function respond(req, res, next) {
  analogValue = analogPin0.read(); //read the value of the analog pin

  console.log(analogValue);
  res.json(201, {level: analogValue});
  next();
}

function status(req, res, next) {
  analogValue = analogPin0.read(); //read the value of the analog pin

  console.log(analogValue);
  var status = "";
  if (analogValue >= 650) {
	status = "I Need Water...";
  lifxBlink();
  twilioCall();

  } else {
	status = "Happy... I am Happy!";
  }
  res.json(201, {status: status});
  next();
}

function respondTime(req, res, next) {
  analogValue = analogPin0.read(); //read the value of the analog pin

  console.log(analogValue);
  var d = new Date();
  var today = d.getDate();
  var month = d.getMonth();
  month++;
  var year = d.getFullYear();

  var hours = d.getHours();
  var minutes = d.getMinutes();
  var seconds = d.getSeconds();
  res.json(201, {date: today + "/" + month + "/" + year,
		 time: hours + ":" + minutes + ":" + seconds });
  next();
}

var server = restify.createServer();
server.get('/moist', respond);
server.get('/time', respondTime);
server.get('/status', status);
server.head('/moist', respond);
server.get('/testBlink',lifxBlink);
server.get('/testCall',twilioCall);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});

function runLoop() {
  var testTimeout = 10000;
  analogValue = analogPin0.read(); //read the value of the analog pin

  if (analogValue >= 650) {
    console.log("I Need Water...");
    lifxBlink();
    twilioCall();
    testTimeout = 100000;
  }

  console.log(analogValue); //write the value of the analog pin to the console
  setTimeout(function() {runLoop();},testTimeout);
}
