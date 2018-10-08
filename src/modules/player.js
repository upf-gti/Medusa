class Player{
    
    constructor(){
        if(CORE.player && CORE.player.constructor.name == this.constructor.name )
            return CORE.player;
        CORE.player = this;
    }

    preInit(){
        this.panel = new LiteGUI.Area({id:"player-area"});
        CORE.GUI.root.add( this.panel );
    }

    init(){

       this.player = new LS.Player( CORE.config.player || { 
            alpha: true,
            premultipliedAlpha: false,
            container: this.panel.content,         
            "width":"100%", "height":"100%",
            "resources": "resources/",
            "shaders": "data/shaders.xml" 
        } );

        CORE.GUI.root.addEventListener("split_moved", this.resize.bind(this));
        window.addEventListener("resize", this.resize.bind(this));

        if( CORE.config.default_scene )
            this.player.loadScene( CORE.config.default_scene );

        this.player.play();
    }

    resize() {
        if(!this.player || !this.player.canvas) return;

        // Lookup the size the browser is displaying the canvas.
        var displayWidth  = this.player.canvas.parentElement.offsetWidth;
        var displayHeight = this.player.canvas.parentElement.offsetHeight;
       
        // Check if the canvas is not the same size.
        if (this.player.canvas.width  != displayWidth ||
            this.player.canvas.height != displayHeight) {
       
          // Make the canvas the same size
          this.player.canvas.width  = displayWidth;
          this.player.canvas.height = displayHeight;
        }
    }


}

CORE.registerModule( Player );