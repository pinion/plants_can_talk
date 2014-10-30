
/*

Project : Plants can talk

Tools : Intel Edison with Arduino board
        Water Pump
        5v Relay switch
        Humidity Sensor

APIs  : LIFX API - npm install lifx
        Twilio API - npm install twilio
        Restify - npm install restify
        ngrok - npm install ngrok

Code  : Arduino
        Node.js

*/


// This is a Hack - consider it as such
/* 

Todo : 
      1. Documentat process
      2. Draw Diagram
      3. Simplify cabling

*/

// ======================================================================
// Functions
// ======================================================================

function pwmSwitch(state) {
  if ( state == "on" ) sh.run('echo 2048000 > /sys/class/pwm/pwmchip0/pwm3/duty_cycle');
  if ( state == "off" ) sh.run('echo 0 > /sys/class/pwm/pwmchip0/pwm3/duty_cycle');  
}

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

function moist(req, res, next) {
  pwmSwitch("on"); 
  pausecomp(500);  
  analogValue = analogPin0.read(); //read the value of the analog pin
  pwmSwitch("off");
  // exec('./off.sh');  

  

  console.log(analogValue);
  res.json(201, {level: analogValue});
  next();
}

function status(req, res, next) {
  
  pwmSwitch("on");  
  pausecomp(2000);

  analogValue = analogPin0.read(); //read the value of the analog pin
  pwmSwitch("off");  

  console.log(analogValue);
  var status = "";
  if (analogValue >= 850) {
  status = "0"; 
  lifxBlink();
  twilioCall();

  } else {
  status = "1";
  }
  res.send(status);
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

function pausecomp(ms) {
  ms += new Date().getTime();
  while (new Date() < ms){}
} 

function runLoop() {
  var testTimeout = hour;
  
  pwmSwitch("on");  
  pausecomp(2000);

  analogValue = analogPin0.read(); //read the value of the analog pin
  pwmSwitch("off");

  if (analogValue >= 650) {
    console.log("I Need Water...");
    lifxBlink();
    // twilioCall();
    testTimeout = hour;
  }

  console.log(analogValue); //write the value of the analog pin to the console
  setTimeout(function() {runLoop();},testTimeout);
}

function startNgrok() {

  ngrok.connect({
    authtoken: process.env.ngrokToken,
    subdomain: 'edison',
    port: 8080
  }, function (err, url) {
    // https://edison.ngrok.com -> 127.0.0.1:8080
    console.log(url);
  });
}

// ======================================================================

// time

var hour = 3600000;

//

var alertPhoneNumber=[process.env.numberToCall];


var ngrok = require('ngrok');
var restify = require('restify');




var sh = require('execSync');

var mraa = require('mraa'); //require mraa

console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the console

var analogPin0 = new mraa.Aio(0); //setup access analog input Analog pin #0 (A0)
var pwmPin9 = new mraa.Pwm(3,-1,false);
var pinStat = new mraa.Gpio(12);

pwmPin9.enable(true);
pwmPin9.period_us(2000);






var server = restify.createServer();
server.get('/moist', moist);
server.get('/time', respondTime);
server.get('/status', status);
server.head('/moist', moist);
server.get('/testBlink',lifxBlink);
server.get('/testCall',twilioCall);


server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});

startNgrok();

runLoop();


