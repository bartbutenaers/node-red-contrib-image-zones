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
    const imageType = require('image-type');
    const isBase64  = require('is-base64');

    function ImageZoneEditorNode(config) {
        RED.nodes.createNode(this,config);
        this.inputField  = config.inputField;
        this.outputField = config.outputField;
        this.polygons    = config.polygons;

        var node = this;

        node.on("input", function(msg) {
            try {
                // Get the image from the specified input location.
                // Keep a reference to the last image, to be able to get a snapshot image from the editor frontend
                node.lastImage = RED.util.evaluateNodeProperty(node.inputField, "msg", this, msg);
            } 
            catch(err) {
                node.error("Error getting image from msg." + node.inputField + " : " + err.message);
                return;
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
            
            node.send(msg);
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
        
        var lastImage = polygonEditorNode.lastImage;
        
        if (!lastImage) {
            res.writeHead(404);
            return res.end("No images have been passed yet through node with id = " + nodeId);
        }

        // When the image is base64 encoded, we need to decode it (unfortunately) to a buffer in order to be able to determine the mime type
        if (isBase64(lastImage)) {
            lastImage = Buffer.from(lastImage, 'base64');
        }
        
        try {
            var mimeType = imageType(lastImage).mime;
        }
        catch(err) {
            res.writeHead(404);
            return res.end("Cannot determine the mime type of the last image");           
        }

        // Convert the image buffer to a base64 encoded string to avoid special characters becoming corrupt during data transfer
        lastImage = new Buffer(polygonEditorNode.lastImage).toString('base64');
            
        // Pass the mime type, which is required by the SVG editor in order to be able to create a data url for the image
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Length", lastImage.length);
        res.writeHead(200);

        res.end(lastImage);
    });
}