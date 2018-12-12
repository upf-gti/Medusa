
document.ondragover = () => {return false};
document.ondragend = () => {return false};
document.ondrop = e =>{
    e.preventDefault();

    for(var i = 0; i < e.dataTransfer.files.length; i++ ){
        var reader = new FileReader();
        reader.onload = e =>{
            var data = new Float32Array(e.target.result);
            var c = new CrowdFile().fromFloat32Array(data);
            c.toggleRender();
        }
        reader.onprogress = ()=>{}//to display file loading progress
        reader.readAsArrayBuffer(e.dataTransfer.files[i])
    }
};

class CrowdFile{
    /*
        struct binHeader {
            float numFrames;
            float numValues;
            float offsetX;
            float offsetY;
            float filling[4];
        };

        struct sAgent {
            float x;
            float y;
            float theta; [-PI to PI]
            float speed;
            float dtheta;
        }; 
    */
    constructor( data ){
        this.numFrames = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.agents = 0;
        this.aux = {};
        this.paths = [];
    }

    fromURL( url ){
        request(url,{
            responseType: 'arraybuffer'
        })
        .then( e => e.data )
        .then( this.fromBinary.bind(this) );

        return this;
    }
    
    fromFloat32Array( data ){
        const [numFrames, numValues/*numagents * 5 + 1*/, offsetX, offsetY, a1, a2, a3, a4, ...values] = data;

        let numparams = 5;
        this.numFrames = numFrames;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.agents = ( numValues - 1 ) / numparams;
        this.aux = {a1,a2,a3,a4};
        this.paths = [];
        var agents = [];
        for(var a = 0; a < this.agents; a++){
            this.paths[a] = new Array(numFrames);
            var [x, y, theta, speed, dtheta] = values.subarray((1)+(a*numparams), (1)+(a*numparams)+5 );
            var agent = new Agent( [(x+offsetX)*100, 0, (y+offsetY) * 100] )
            //agent.orientCharacter([x*100,0,y*100]);
            
            agents.push(agent);
        }
            
        
        for(var i = 0; i < numFrames; i++ )
        for(var j = 0; j < this.agents; j++)
        {
            var k = i * numValues;
            var frame = values[k];
            var [x, y, theta, speed, dtheta] = values.subarray((k+1)+(j*numparams), (k+1)+(j*numparams)+5 );
            x += offsetX;
            y += offsetY;
            this.paths[j][i] = {frame,x,y,theta,speed,dtheta, visited:false, pos : [x* 100,0,y* 100]};
        }


        for(var a = 0; a < this.agents; a++){
            agents[a].path = this.paths[a];
            agents[a].current_waypoint = 0;
        }
        

        return this;
    }

    fromBinary( data ){
        if(!data || data.length <= 0) 
                return console.error("no data found");
        
        switch(data.constructor.name){
            case "String": 
                debugger;//notdone
            break;
            case "ArrayBuffer":
                data = new Float32Array( data );
            break;
            default: console.error("unable to read data");
        }
        
        this.fromFloat32Array( data );
    }

    toggleRender(){
        
        for(var j = 0; j < this.agents; j++){
            if(!this.paths[j].node){
                var points = this.paths[j].map(e => { return [e.x * 100, 5, e.y * 100] });
                
                this.paths[j].node = new RD.SceneNode();
                var mesh = GL.Mesh.load({ vertices: JSON.parse("["+points.join()+"]") });
                mesh.primitive = gl.LINE_STRIP;
                GFX.renderer.meshes["path_"+this.paths[j].node._uid] = mesh;
                this.paths[j].node.mesh = "path_"+node._uidthis.paths[j].;
                this.paths[j].node.toggled = false;
                this.paths[j].node.color = [Math.random(),Math.random(),Math.random(),1];
                this.paths[j].node.primitive = gl.LINE_STRIP;
      
            }
            if(!this.paths[j].node.toggled){
                GFX.scene.root.addChild(this.paths[j].node);
                this.paths[j].node.toggled = true;
            }else{
                GFX.scene.root.removeChild(this.paths[j].node);
                this.paths[j].node.toggled = false;
            }
        }
    }

}

//var c = new CrowdFile().fromURL(`src/assets/2agents_crossing_rvo.bin`)

