# node-red-contribute-image-zones
A Node-RED node to draw and edit (polygon) zones on images

## Install
Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install node-red-contrib-image-zones
```

Thanks to [hotnipi](https://github.com/hotNipi) for helping me to solve some styling issues!  And also thanks to [wb666greene](https://github.com/wb666greene) and [krambriw](https://github.com/krambriw) for reviewing this node, and sharing their AI video surveillance experience with me!


***WARNING: THIS IS AN EXPERIMENTAL NODE, WHICH MEANS THERE CAN ARRIVE BREAKING CHANGES IN THE NEAR FUTURE !!!!!***

## Support my Node-RED developments
Please buy my wife a coffee to keep her happy, while I am busy developing Node-RED stuff for you ...

<a href="https://www.buymeacoffee.com/bartbutenaers" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy my wife a coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## Demo

The following demo shows how this node can be used to draw zone polygons on top of camera images:

![demo_zones](https://user-images.githubusercontent.com/14224149/141678895-3d26712f-9c9e-43ff-99bf-55f3b129b278.gif)

## Node usage

1. Add this node to the flow, so (camera) images can pass through it.

2. Specify in which input message field the images arrive, and in which output message field the zone defintions need to be send:

   ![msg fields](https://user-images.githubusercontent.com/14224149/141677657-38881683-856f-49d3-bb9f-06c29df0701c.png)
   
   By using a different field name for the output zones, the input message will be *extended* with zone definitions (and the original input message will remain untouched).

3. Specify the settings of all the zones in the list.  Note that the zone names should be ***uniques***!

4. Switch to the second tabsheet, to display the zone drawing editor.

5. Click the *"Refresh image*" button to wait for the next background image (that is injected as an input message), and display it as background image in the editor.

   Note that the image should be a JPEG or a PNG, since that are the only image types supported in SVG.

6. Select in the dropdown which zone polygon you want to create or edit.  The polygon of the selected zone will be marked with circles at each polygon point.

7. Start drawing or editing the zone polygon:
   + While *creating* a new polygon, a new point will be added to the polygon at every left-mouse click.  Press the ESC key when the zone is completed.
   + When *editing* an existing polygon:
      - Click on a polygon edge to insert a new point.
      - Shift-click on an existing point to delete that point
      - Left click dragging on an existing point to move that point around.

8. Click the "Remove polygon" button to remove the polygon of the currently selected zone (in the dropdown list).

9. Deploy the flow.  The node status will now display the number of zones that have been specified:

   ![node status](https://user-images.githubusercontent.com/14224149/141678980-602e17bf-2d12-40c4-8cfd-9bce4ba71552.png)

10. The zone definitions will now be appended to every input message that is injected (which will be send on the first output):

   ![output msg zones](https://user-images.githubusercontent.com/14224149/141679044-67541365-6e74-4e92-b440-2a71f9d2532d.png)
   
***CAUTION: always inject images of the same resolution***, i.e. the same width and height.  Indeed the polygons are drawn on top of an image that has a certain resolution.  When you inject afterwards an image with another resolution, the polygons won't match anymore to the new coordinate system.  As a reminder, a warning will be displayed when an image with another resolution is being fetched:

![image](https://user-images.githubusercontent.com/14224149/141681192-41cbdb73-c827-4ca4-a9b4-de6920b28996.png)

## Example flows

### Continuous image stream

I the following example flow, a continuous camera stream is simulated by an inject node that injects every two seconds an image:

![image](https://user-images.githubusercontent.com/14224149/141680570-5a5c98e7-b9be-49f8-897b-819a27f55a74.png)
```
[{"id":"01badc6b2de5cc88","type":"http request","z":"4a680cc36387c937","name":"Get image","method":"GET","ret":"bin","paytoqs":"ignore","url":"https://upload.wikimedia.org/wikipedia/commons/4/4a/In_the_driveway_%28258053850%29.jpg","tls":"","persist":false,"proxy":"","authType":"","senderr":false,"x":1450,"y":480,"wires":[["7a271b7664f39474"]]},{"id":"1d0e8df6eda1e5a3","type":"debug","z":"4a680cc36387c937","name":"zones","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"zones","targetType":"msg","statusVal":"","statusType":"auto","x":1790,"y":480,"wires":[]},{"id":"7a271b7664f39474","type":"image-zone-editor","z":"4a680cc36387c937","inputField":"payload","outputField":"zones","inputFieldType":"msg","outputFieldType":"msg","polygons":[{"name":"Zone 1","fillColor":"#e72d18","opacity":"50","render":false,"points":[{"x":3,"y":231},{"x":137,"y":197},{"x":247,"y":206},{"x":151,"y":258},{"x":89,"y":236},{"x":47,"y":296},{"x":3,"y":297}]},{"name":"Zone 2","fillColor":"#1bde11","opacity":"50","render":false,"points":[{"x":255,"y":209},{"x":123,"y":278},{"x":339,"y":287},{"x":369,"y":252},{"x":257,"y":237},{"x":307,"y":208}]}],"imageWidth":"800","imageHeight":"600","name":"","x":1630,"y":480,"wires":[["1d0e8df6eda1e5a3"],[]]},{"id":"269ed2c5bc63ce10","type":"inject","z":"4a680cc36387c937","name":"Inject image","props":[],"repeat":"2","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":1270,"y":480,"wires":[["01badc6b2de5cc88"]]}]
```

When the *"Refresh image"* button is clicked, you will get the ***next image*** that is injected into this node.  Since images are being injected continuously, we will have no problems to get and display an image.

### Non-continuous image stream

When the image stream is non-continious, the *"Refresh image"* button won't work.  Indeed the node will try to wait about 5 seconds for an image to be injected, and an error will be displayed if no image arrives:

   ![no image](https://user-images.githubusercontent.com/14224149/141680770-31edab20-57ed-4d65-8ff8-e23fc5fdedbd.png)
   
To solve this, a second output has been added to this node.  When the *"Refresh image"* button is clicked, an output message will be send on that second output.  That output message can be used to trigger capturing a snapshot image from the camera, which will be injected into this node (and displayed in the drawing editor):

   ![snapshot injection](https://user-images.githubusercontent.com/14224149/141681013-cda4fdde-4bc1-4f55-b185-0a6279e03485.png)
```
[{"id":"aad721854c9bd0d6","type":"http request","z":"4a680cc36387c937","name":"","method":"GET","ret":"bin","paytoqs":"ignore","url":"https://upload.wikimedia.org/wikipedia/commons/4/4a/In_the_driveway_%28258053850%29.jpg","tls":"","persist":false,"proxy":"","authType":"","senderr":false,"x":1430,"y":240,"wires":[["7eb22529b52903fc"]]},{"id":"d1706252e6b080d3","type":"debug","z":"4a680cc36387c937","name":"zones","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":1770,"y":220,"wires":[]},{"id":"7eb22529b52903fc","type":"image-zone-editor","z":"4a680cc36387c937","inputField":"payload","outputField":"zones","inputFieldType":"msg","outputFieldType":"msg","polygons":[{"name":"Zone 1","fillColor":"#e72d18","opacity":"50","render":false,"points":[{"x":3,"y":231},{"x":137,"y":197},{"x":247,"y":206},{"x":151,"y":258},{"x":89,"y":236},{"x":47,"y":296},{"x":3,"y":297}]},{"name":"Zone 2","fillColor":"#1bde11","opacity":"50","render":false,"points":[{"x":255,"y":209},{"x":123,"y":278},{"x":339,"y":287},{"x":369,"y":252},{"x":257,"y":237},{"x":307,"y":208}]}],"imageWidth":"800","imageHeight":"600","name":"","x":1610,"y":240,"wires":[["d1706252e6b080d3"],["70d41049882a26bb"]]},{"id":"7f7b919fe50c5eaf","type":"link in","z":"4a680cc36387c937","name":"Image request","links":["70d41049882a26bb"],"x":1250,"y":280,"wires":[["aad721854c9bd0d6"]],"l":true},{"id":"70d41049882a26bb","type":"link out","z":"4a680cc36387c937","name":"Image request","mode":"link","links":["7f7b919fe50c5eaf"],"x":1800,"y":280,"wires":[],"l":true},{"id":"3f7e5cc22760f54b","type":"function","z":"4a680cc36387c937","name":"A non-continious stream","func":"\nreturn msg;","outputs":1,"noerr":0,"initialize":"","finalize":"","libs":[],"x":1210,"y":220,"wires":[["aad721854c9bd0d6"]]}]
```
