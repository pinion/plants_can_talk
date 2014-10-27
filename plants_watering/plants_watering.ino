/*
plant watering system using 3v-12v DC pump and humidity sensor.
using a relay to switch a 9v mains into 

 */
 
// Pin 13 has an LED connected on most Arduino boards.
// give it a name:
int led = 13; // also acts as singnal to the relay using digital pin 13
int val;
// the setup routine runs once when you press reset:
void setup() {                
  // initialize the digital pin as an output.
  pinMode(led, OUTPUT);  
  pinMode(7,OUTPUT); // digital pin for humidity sensor
  pinMode(A0, INPUT); // analog read pin for humidity sensor
  Serial.begin(9600); 
}

// the loop routine runs over and over again forever:
void loop() {
  
  digitalWrite(7,HIGH);
  int s = analogRead(A0); //take a sample
  Serial.println(s);
  
  //greater than 1000, probably not touching anything
  if(s >= 1000)
  { Serial.println("I think your prong's come loose."); }
  if(s < 1000 && s >= 650)
  //less than 1000, greater than 650, dry soil
  { Serial.println("Soil's rather dry, really."); 
  digitalWrite(13,HIGH);
  delay(2000);
  digitalWrite(13,LOW);
  }
  if(s < 650 && s >= 400)
  //less than 650, greater than 400, somewhat moist
  { Serial.println("Soil's a bit damp."); }
  if(s < 400)
  //less than 400, quite moist
  Serial.println("Soil is quite moist, thank you very much.");
  
  delay(10000); //How often do you really need to take this reading?
  




  
}
