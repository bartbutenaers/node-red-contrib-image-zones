# node-red-contribute-image-zone-editors
A Node-RED node to draw and edit (polygon) zones on images

## Node usage

1. Inject an image into the node.
2. Add an entry to the editableListe for every zone you need.
3. Switch to the second tabsheet.
4. Press the "Refresh image" button, to load the last image that has been passed through this node.
5. Select in the dropdown list the zone that you want to create.
6. Left click on as much points on the image as you like, until the zone is completed.
7. Press the ESC key when the zone is completed.
8. To edit existing points of a zone, select the zone in the dropdown list.
9. Click on a zone edge to insert a new point on that edge.
10. Shift-click on an existing point of the zone to remove it.
11. Press left mouse down near a point of the zone and move the mouse (while keeping the left mouse down), to move that point to the position where you releae the mouse.
12. Press the "Delete zone" button, to remove all the existing points from the zone that is selected in the dropdown list.

Example flow:

![image](https://user-images.githubusercontent.com/14224149/141200346-881d627b-6475-4b1c-ba61-fed893ba66c4.png)
```
[{"id":"8e7c1a6c6c35b213","type":"inject","z":"4a680cc36387c937","name":"Inject image","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payloadType":"date","x":690,"y":640,"wires":[["aad721854c9bd0d6"]]},{"id":"aad721854c9bd0d6","type":"http request","z":"4a680cc36387c937","name":"","method":"GET","ret":"bin","paytoqs":"ignore","url":"https://upload.wikimedia.org/wikipedia/commons/4/4a/In_the_driveway_%28258053850%29.jpg","tls":"","persist":false,"proxy":"","authType":"","senderr":false,"x":870,"y":640,"wires":[["7eb22529b52903fc"]]},{"id":"d1706252e6b080d3","type":"debug","z":"4a680cc36387c937","name":"zones","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":1210,"y":640,"wires":[]},{"id":"7eb22529b52903fc","type":"image-zone-editor","z":"4a680cc36387c937","inputField":"payload","outputField":"payload","inputFieldType":"msg","outputFieldType":"msg","polygons":[{"name":"test","fillColor":"#d8311b","opacity":"50","render":false,"points":[{"x":229,"y":115},{"x":142,"y":219},{"x":350,"y":160}]}],"name":"","x":1050,"y":640,"wires":[["d1706252e6b080d3"]]}]
```
