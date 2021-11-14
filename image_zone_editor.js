/**
 * Copyright 2018 Bart Butenaers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
 module.exports = function(RED) {
    var settings = RED.settings;
    const isBase64  = require('is-base64');
    const sizeOf = require('image-size')

    function ImageZoneEditorNode(config) {
        RED.nodes.createNode(this,config);
        this.inputField  = config.inputField;
        this.outputField = config.outputField;
        this.polygons    = config.polygons;
        this.imageWidth  = parseInt(config.imageWidth);
        this.imageHeight = parseInt(config.imageHeight);

        var node = this;
        
        var numberOfZones = node.polygons.length;
        var statusText = numberOfZones + " zone";
        if (numberOfZones !== 1) {
            statusText += "s";
        }
        node.status({fill:"blue", shape:"dot", text:statusText});
        
        // The default resolution of the SVG is 400x300 (in case never a background image has been loaded)
        if (node.imageWidth === -1) node.imageWidth = 400;
        if (node.imageHeight === -1) node.imageHeight = 300;
        
        // The polygons are drawn in an SVG of size 400x300, and the image has been stretched/shrinked to fit into that SVG.
        // This means the polygon point coordinates need to stretched/shrinked the same way, to make sure they match the real image size.
        var widthConversionFactor = node.imageWidth / 400;
        var heightConversionFactor = node.imageHeight / 300;
        node.polygons.forEach(function(polygon) {
            polygon.points.forEach(function (point) {
                point.x = point.x * widthConversionFactor;
                point.y = point.y * heightConversionFactor;
            });
        });

        node.on("input", function(msg) {
            var inputImage;
            
            try {
                // Get the image from the specified input location.
                // Keep a reference to the last image, to be able to get a snapshot image from the editor frontend
                var inputImage = RED.util.evaluateNodeProperty(node.inputField, "msg", this, msg);
            } 
            catch(err) {
                node.error("Error getting image from msg." + node.inputField + " : " + err.message);
                return;
            }
            
            // TODO input validation

            if (inputImage) {
                // Pass the new image to all the available listeners
                node.emit('image_arrived', inputImage);
            }
                
            try {
                // Create a clone of the polygon array, to avoid race conflicts afterwards
                var clonedPolygons = node.polygons.slice();
                
                // Pass a clone of the polygon array in the specified output location
                RED.util.setMessageProperty(msg, node.outputField, clonedPolygons);
            }
            catch(err) {
                node.error("Error setting polygon array in msg." + node.outputField + " : " + err.message);
                return;
            }
            
            node.send([msg, null]);
        });
        
        node.on('close', function() {
            this.removeAllListeners("image_arrived");
		});
    }

    RED.nodes.registerType("image-zone-editor", ImageZoneEditorNode);
    
    // Make all the latest image available to the FLOW EDITOR.
    RED.httpAdmin.get('/image_zone_editor/image/:nodeid', RED.auth.needsPermission('image_zone_editor.read'), function(req, res) {
        // The client has replaced the dots in the node id by underscores, since dots are not allowed in urls
        var nodeId = req.params.nodeid.replace("_", ".");
        
        var polygonEditorNode = RED.nodes.getNode(nodeId);
        
        if (!polygonEditorNode) {
            res.writeHead(404);
            return res.end("Svg node with id=" + nodeId + " cannot be found");
        }
        
        // We cannot simply keep a reference to the last image (when an input msg arrives), and return that to the client.
        // Because by the time the 'refresh image' button is clicked, that image will have been passed already through the next nodes 
        // in the flow.  Those nodes might have changed thr message meanwhile, e.g. drawed the polygon on the image.  That is
        // not what we want, since we want to show the original untouched input image.  To solve that we will add a listeners
        // that is called when a new image arrives in an input message (within a limited timeout interval).

        // When the timeout time has passed, don't wait any longer for new images to arrive.
        // Note that the timeout time should be smaller than the timeout of the $.ajax call in the flow editor client code!
        timeoutTimer = setTimeout(function() {
            timeoutTimer = null;
            polygonEditorNode.removeListener('image_arrived', imageArrivedListener);
            
            res.writeHead(404);
            return res.end("No image has arrived during the specified time interval");  
        }, 5000);
        
        var imageArrivedListener = function(newImage) {
            if (timeoutTimer) {
                // A new input image has arrived (within 3000 msec), so the timeout handler isn't necessary anymore
                clearTimeout(timeoutTimer);
                timeoutTimer = null;
                polygonEditorNode.removeListener('image_arrived', imageArrivedListener);

                // When the image is base64 encoded, we need to decode it (unfortunately) to a buffer in order to be able to determine the mime type
                if (isBase64(newImage)) {
                    newImage = Buffer.from(newImage, 'base64');
                }

                try {
                    var imageInfo = sizeOf(newImage);
                }
                catch(err) {
                    res.writeHead(404);
                    return res.end("Cannot collect information about the input image");           
                }

                // Only image/jpeg is recognised as the actual mime type for JPEG files.
                imageInfo.type = imageInfo.type.replace("jpg", "jpeg");

                // Convert the image buffer to a base64 encoded string to avoid special characters becoming corrupt during data transfer
                newImage = new Buffer(newImage).toString('base64');
                    
                // Pass the mime type, which is required by the SVG editor in order to be able to create a data url for the image
                res.setHeader("Content-Type", "image/" + imageInfo.type);
                res.setHeader("Content-Length", newImage.length);
                
                // Pas the resolution, so this can be stored (via the config screen) into the node
                res.setHeader("Image-width", imageInfo.width);
                res.setHeader("Image-height", imageInfo.height);
                
                res.writeHead(200);

                // Pass the new input image to the flow editor config screen
                res.end(newImage);
            }
            else {
                // We cannot return the image anymore to the client, since the resp(onse) object is already closed
                console.log("Image has only arrived after the timeout interval, so it will be ignored");
            }
        }
       
        // Start waiting (during 3000 msec) for an new input image to arrive
        polygonEditorNode.addListener('image_arrived', imageArrivedListener);

        // Send an output message (on the second output) to allow users to load the image on the fly (and inject it)
        polygonEditorNode.send([null, {topic: "image_request"}]);
    });
}
