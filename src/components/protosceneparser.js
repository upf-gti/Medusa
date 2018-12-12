document.ondragover = () => {return false};
document.ondragend = () => {return false};
document.ondrop = e =>{
    e.preventDefault();

    for(var i = 0; i < e.dataTransfer.files.length; i++ ){
        var reader = new FileReader();
        reader.onload = e =>{
            var json = JSON.parse(e.target.result);
            
            if(!json || !json.list)   return;

            console.log(json);

            for(var i in json.list){

                var item = json.list[i];

                var matrix = new Array(16);
                var i = 0;
                for( var key in item.transform ){
                    matrix[i] = item.transform[key];
                    i++;
                }
                matrix = new Float32Array(matrix);

                var node = new RD.SceneNode();
                node.color = [1,1,1,1];
                node.toggled = true;
                node.position = [matrix[3] * 100, matrix[7]* 100, -matrix[11]* 100]; 
                node.scaling  = [20,20,20];//[-matrix[0], matrix[5], -matrix[10]]; 
                
                quat.fromMat4(node.rotation, matrix);
                node.shader = "phong";     

                switch(item.type){
                    case "path": 
                        var points = [];
                        for( var t in item.path )   points.push([-item.path[t].e03* 100, item.path[t].e13* 100, -item.path[t].e23* 100])
                        if(item.loop)               points.push([-item.path[0].e03* 100, item.path[0].e13* 100, -item.path[0].e23* 100]);
                        else                        points.concat(points.slice(0,points.length).reverse().slice(1,points.length-1))
                        if(item.reverse)            points.reverse();
                        
                        var mesh = GL.Mesh.load({ vertices: points });
                        mesh.primitive = gl.LINE_STRIP;
                        GFX.renderer.meshes["path_"+node._uid] = mesh;
                        node.mesh = "path_"+node._uid;
                        node.color = [Math.random(),Math.random(),Math.random(),1];
                        node.primitive = gl.LINE_STRIP;
                        node.position = [0,0,0]; 
                        node.shader = "flat";     
                        node.scaling  = [1,1,1]; 
                        
                    break;
                    case "cube": 
                        node.color = [0.75,0.05,0.05,1];
                        node.mesh = "cube";
                    break;
                    case "sphere": 
                        node.color = [0.05,0.75,0.05,1];
                        node.mesh = "sphere";
                 break;
                    case "capsule": 
                        node.color = [0.05,0.05,0.75,1];
                        node.mesh = "sphere";
                    break;
                }
                node.updateMatrices();   
                GFX.scene.root.addChild(node);
            }

        }
        reader.onprogress = ()=>{}//to display file loading progress
        reader.readAsText(e.dataTransfer.files[i])
    }
};

/*
                "e00": 1.0,
                "e01": 0.0,
                "e02": 0.0,
                "e03": -1.0,
                "e10": 0.0,
                "e11": 1.0,
                "e12": 0.0,
                "e13": 1.0,
                "e20": 0.0,
                "e21": 0.0,
                "e22": 1.0,
                "e23": 0.0,
                "e30": 0.0,
                "e31": 0.0,
                "e32": 0.0,
                "e33": 1.0
*/