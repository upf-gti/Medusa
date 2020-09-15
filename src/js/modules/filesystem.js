class FileSystem{
    
    constructor(){
        // this.lfs = LFS.setup("https://webglstudio.upf.edu/users/hermann/files/sauce_dev/src/", this.onReady.bind(this) );
        this.lfs = LFS.setup("https://webglstudio.org/users/hermann/files/sauce_dev/src/", this.onReady.bind(this) );
        this.session = null;
        this.parsers = {};
		// this.root = "https://webglstudio.upf.edu/users/hermann/files/sauce_dev/files/";
		this.root = "https://webglstudio.org/users/hermann/files/sauce_dev/files/";
    }

   
    init(){
      console.log(this);

	  /*var dz = document.getElementById("dropzone");

      LiteGUI.createDropArea(document.getElementById("main-area"), 
      (function(e){ dz.classList.remove("active"); this.onFileDrop(e.dataTransfer);    return false; }).bind(this), 
      (function(e){ dz.classList.add("active");         return false; }).bind(this), 
      (function(e){ dz.classList.remove("active");      return false; }).bind(this)
      );

      document.body.ondragleave = e=> {e.preventDefault(); e.stopPropagation(); dz.classList.remove("active"); return false;} ;*/
    }

    onFileDrop( files ){
        
        console.log(files);
        for(var i = 0; i < files.items.length; i++){

            let fileReader = new FileReader(),
            file = files.items[i].getAsFile(),
            ext = (file.name).substr((file.name).lastIndexOf(".")+1),
            folder = "others";

            /*switch(ext){
                case "json": folder = "behaviors"; break;
                case "dae":  folder = "animations"; break;
            }*/

            this.uploadFile("behaviors", files.items[i], ["hdre"]);
        }

    }

    onReady(){
        LFS.login( "admin", "foo", this.onLogin.bind(this) );
    }

    onLogin( my_session, err ){
        if(!my_session)
            throw("error login in:", err);
        this.session = my_session;
    }

    async getTags( folder ){

        return new Promise( (resolve, reject)=>{
            CORE.FS.session.request(
                CORE.FS.session.server_url, 
                { action: "tags/getTags"}, e=>{
                console.log(e);
                resolve(e);
            }, reject, e => {});
        });
    }
    
    async uploadFile(folder, file, metadata){


        return new Promise((resolve, reject) => {

            let path = "public/"+folder+"/"+ file.name;

			CORE.FS.session.uploadFile( path, file, 
                    { "metadata": metadata }, 
                    function(e){console.log("complete",e); resolve()},
                    e => console.log("error",e)); //,
//                    e => console.log("progress",e));
        });
    }

    async getFiles( folder ){
        return new Promise( (resolve, reject)=>{
        
            function onError(e){
                reject(e);
            }
    
            function onFiles(f){
                if(!f)
                    return onError("Error: folder \""+folder+"\" not found.");
                resolve(f);
            }

            CORE.FS.session.request( 
                CORE.FS.session.server_url,
                { action: "tags/getFilesInFolder", unit: "SAUCE", folder: folder }, function(resp){

                if(resp.status < 1){
                    onError(resp.msg);
                    return;
                }
                //resp.data = JSON.parse(resp.data);
                LiteFileServer.Session.processFileList( resp.data, "SAUCE" + "/" + folder );

                onFiles(resp.data, resp);
            });
        });
    }
}

CORE.registerModule( FileSystem );

